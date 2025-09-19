const db = require('../db');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_jwt_secret'; // ⚠️ Use process.env.JWT_SECRET in production

// ===== LOGIN WITH OTP =====
exports.loginWithOtp = async (req, res) => {
  const { mobile_number, otp_code } = req.body;

  // Validation
  if (!mobile_number || !/^\d{10}$/.test(mobile_number) || !otp_code) {
    return res.status(400).json({
      success: false,
      error: 'mobile_number must be exactly 10 digits and otp_code is required.'
    });
  }

  try {
    // Check OTP with expiry (10 min)
    const [rows] = await db.execute(
      `SELECT * FROM otp 
       WHERE mobile_number = ? 
       AND otp_code = ? 
       AND expires_at > UNIX_TIMESTAMP()
       ORDER BY created_at DESC LIMIT 1`,
      [mobile_number, otp_code]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid or expired OTP.' });
    }

    // Get user_id from users table
    const [userRows] = await db.execute(
      `SELECT id FROM users WHERE mobile_number = ?`,
      [mobile_number]
    );

    if (userRows.length === 0) {
      // Auto-register user if not found
      const newId = `USR${Date.now().toString().slice(-6)}`;
      await db.execute(
        `INSERT INTO users (id, name, role, mobile_number, email, created_by, created_date, status)
         VALUES (?, ?, ?, ?, ?, ?, UNIX_TIMESTAMP(), ?)`,
        [newId, 'New User', 'User', mobile_number, null, 'System', 'Active']
      );
      user_id = newId;
    } else {
      user_id = userRows[0].id;
    }

    // Insert login entry
    await db.execute(
      `INSERT INTO login (user_id, login_by, login_date, status) 
       VALUES (?, ?, UNIX_TIMESTAMP(), 'Active')`,
      [user_id, mobile_number]
    );

    // Generate JWT token
    const token = jwt.sign({ user_id, mobile_number }, JWT_SECRET, { expiresIn: '1h' });

    res.json({ success: true, message: 'Login successful', token });
  } catch (err) {
    console.error('Error in loginWithOtp:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// ===== RESEND OTP =====
exports.resendOtp = async (req, res) => {
  const { mobile_number } = req.body;

  if (!mobile_number || !/^\d{10}$/.test(mobile_number)) {
    return res.status(400).json({ success: false, error: 'mobile_number must be exactly 10 digits.' });
  }

  try {
    // Throttle: at least 5 sec gap
    const [rows] = await db.execute(
      `SELECT created_at FROM otp WHERE mobile_number = ? ORDER BY created_at DESC LIMIT 1`,
      [mobile_number]
    );

    const now = Math.floor(Date.now() / 1000);
    if (rows.length > 0 && now - rows[0].created_at < 5) {
      const wait = 5 - (now - rows[0].created_at);
      return res.status(429).json({ success: false, error: `Please wait ${wait} more seconds before resending OTP.` });
    }

    // Generate OTP (random 6-digit)
    const otp_code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with expiry (10 min = 600 sec)
    await db.execute(
      `INSERT INTO otp (mobile_number, otp_code, created_at, expires_at) 
       VALUES (?, ?, UNIX_TIMESTAMP(), UNIX_TIMESTAMP() + 600)`,
      [mobile_number, otp_code]
    );

    // In production: send via SMS gateway
    res.json({ success: true, message: 'OTP resent successfully.', otp_code });
  } catch (err) {
    console.error('Error in resendOtp:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// ===== TERMINATE SESSION =====
exports.terminateSession = async (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ success: false, error: 'user_id is required.' });
  }

  try {
    await db.execute(
      `UPDATE login 
       SET status = 'Inactive', logout_time = UNIX_TIMESTAMP() 
       WHERE user_id = ? AND status = 'Active' 
       ORDER BY login_date DESC LIMIT 1`,
      [user_id]
    );

    res.json({ success: true, message: 'Session terminated.' });
  } catch (err) {
    console.error('Error in terminateSession:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
