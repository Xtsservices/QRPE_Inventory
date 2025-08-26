const db = require('../db');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_jwt_secret'; // Use env variable in production

// Login with OTP
exports.loginWithOtp = async (req, res) => {
  const { mobile_number, otp_code } = req.body;
  // Mobile number must be exactly 10 digits
  if (!mobile_number || !/^\d{10}$/.test(mobile_number) || !otp_code) {
    return res.status(400).json({ success: false, error: 'mobile_number must be exactly 10 digits and otp_code is required.' });
  }

  try {
    // Check OTP (default is 123456 or from table)
    const [rows] = await db.execute(
      `SELECT * FROM otp WHERE mobile_number = ? AND otp_code = ? ORDER BY created_at DESC LIMIT 1`,
      [mobile_number, otp_code]
    );
    if (rows.length === 0 && otp_code !== '123456') {
      return res.status(401).json({ success: false, error: 'Invalid OTP.' });
    }

    // Get user_id (assuming you have a users table)
    const [userRows] = await db.execute(
      `SELECT user_id FROM user WHERE mobile_number = ?`,
      [mobile_number]
    );
    if (userRows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }
    const user_id = userRows[0].user_id;

    // Insert login history (success)
    await db.execute(
      `INSERT INTO login_history (user_id, status, login_time) VALUES (?, 'success', UNIX_TIMESTAMP())`,
      [user_id]
    );

    // Generate JWT token
    const token = jwt.sign({ user_id, mobile_number }, JWT_SECRET, { expiresIn: '1h' });

    res.json({ success: true, message: 'Login successful', token });
  } catch (err) {
    console.error('Error in loginWithOtp:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Resend OTP (after 5 seconds)
exports.resendOtp = async (req, res) => {
  const { mobile_number } = req.body;
  // Mobile number must be exactly 10 digits
  if (!mobile_number || !/^\d{10}$/.test(mobile_number)) {
    return res.status(400).json({ success: false, error: 'mobile_number must be exactly 10 digits.' });
  }
  try {
    // Check last OTP time
    const [rows] = await db.execute(
      `SELECT created_at FROM otp WHERE mobile_number = ? ORDER BY created_at DESC LIMIT 1`,
      [mobile_number]
    );
    const now = Math.floor(Date.now() / 1000);
    if (rows.length > 0 && now - rows[0].created_at < 5) {
      return res.status(429).json({ success: false, error: 'Please wait 5 seconds before resending OTP.' });
    }

    // Generate and insert new OTP (here, always 123456 for demo)
    const otp_code = '123456';
    await db.execute(
      `INSERT INTO otp (mobile_number, otp_code, created_at) VALUES (?, ?, UNIX_TIMESTAMP())`,
      [mobile_number, otp_code]
    );
    res.json({ success: true, message: 'OTP resent successfully.', otp_code });
  } catch (err) {
    console.error('Error in resendOtp:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Terminate session (set status inactive)
exports.terminateSession = async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) {
    return res.status(400).json({ success: false, error: 'user_id is required.' });
  }
  try {
    await db.execute(
      `UPDATE login_history SET status = 'inactive', logout_time = UNIX_TIMESTAMP() WHERE user_id = ? AND status = 'success' ORDER BY login_time DESC LIMIT 1`,
      [user_id]
    );
    res.json({ success: true, message: 'Session terminated.' });
  } catch (err) {
    console.error('Error in terminateSession:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};