const db = require('../db');
const jwt = require('jsonwebtoken');
const queries = require('../Queries/authQuery');

const JWT_SECRET = 'your_jwt_secret'; // ⚠️ Use process.env.JWT_SECRET in production

// ===== SEND OTP =====
exports.sendOtp = async (req, res) => {
  const { mobile_number } = req.body;

  // Validate mobile number
  if (!mobile_number || !/^\d{10}$/.test(mobile_number)) {
    return res.status(400).json({
      success: false,
      error: 'mobile_number must be exactly 10 digits.'
    });
  }

  try {
    // Generate OTP (random 6-digit)
    const otp_code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with expiry (10 min = 600 sec)
    await db.execute(queries.storeOtp, [mobile_number, otp_code]);

    // In production: send via SMS provider (Twilio / MSG91 / etc.)
    res.json({
      success: true,
      message: 'OTP sent successfully.',
      otp_code // ⚠️ Expose only for dev/testing. Remove in production.
    });
  } catch (err) {
    console.error('Error in sendOtp:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/* Duplicate declarations removed */

// ===== LOGIN WITH OTP (with Transaction) =====
exports.loginWithOtp = async (req, res) => {
  const { mobile_number, otp_code } = req.body;

  // Validation
  if (!mobile_number || !/^\d{10}$/.test(mobile_number) || !otp_code) {
    return res.status(400).json({
      success: false,
      error: 'mobile_number must be exactly 10 digits and otp_code is required.'
    });
  }

  const connection = await db.getConnection(); // get connection for transaction

  try {
    await connection.beginTransaction();

    // Check OTP with expiry (10 min)
    const [rows] = await connection.execute(queries.checkOtp, [mobile_number, otp_code]);

    if (rows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(401).json({ success: false, error: 'Invalid or expired OTP.' });
    }

    // Get user_id from users table
    const [userRows] = await connection.execute(queries.getUserByMobile, [mobile_number]);
    let user_id;

    if (userRows.length === 0) {
      // Auto-register user if not found
      const newId = `USR${Date.now().toString().slice(-6)}`;
      await connection.execute(queries.insertUser, [
        newId, 'New User', 'User', mobile_number, null, 'System', 'Active'
      ]);
      user_id = newId;
    } else {
      user_id = userRows[0].id;
    }

    // Insert login entry
    await connection.execute(queries.insertLogin, [user_id, mobile_number]);

    // Commit transaction
    await connection.commit();
    connection.release();

    // Generate JWT token
    const token = jwt.sign({ user_id, mobile_number }, JWT_SECRET, { expiresIn: '1h' });

    res.json({ success: true, message: 'Login successful', token });

  } catch (err) {
    await connection.rollback();
    connection.release();
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
    const [rows] = await db.execute(queries.getLastOtp, [mobile_number]);

    const now = Math.floor(Date.now() / 1000);
    if (rows.length > 0 && now - rows[0].created_at < 5) {
      const wait = 5 - (now - rows[0].created_at);
      return res.status(429).json({
        success: false,
        error: `Please wait ${wait} more seconds before resending OTP.`
      });
    }

    // Generate OTP (random 6-digit)
    const otp_code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with expiry (10 min = 600 sec)
    await db.execute(queries.storeOtp, [mobile_number, otp_code]);

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
    await db.execute(queries.terminateSession, [user_id]);

    res.json({ success: true, message: 'Session terminated.' });
  } catch (err) {
    console.error('Error in terminateSession:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
