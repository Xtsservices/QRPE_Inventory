const db = require('../db');
const logger = require('../logger');

// Helper: generate 6-digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ===== CREATE USER =====
exports.registerUser = async (req, res) => {
  const { name, role, mobileNumber, email, createdBy } = req.body;

  // Validation
  if (!name || !mobileNumber || !email || !role) {
    return res.status(400).json({ success: false, error: 'Name, mobileNumber, email, and role are required.' });
  }
  if (!/^[A-Za-z\s]{2,50}$/.test(name.trim())) {
    return res.status(400).json({ success: false, error: 'Name should contain only letters and spaces.' });
  }
  if (!/^\d{10}$/.test(mobileNumber.trim())) {
    return res.status(400).json({ success: false, error: 'Mobile number must be 10 digits.' });
  }
  if (!/\S+@\S+\.\S+/.test(email.trim())) {
    return res.status(400).json({ success: false, error: 'Invalid email format.' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Check duplicates
    const [mobileRows] = await connection.execute(
      'SELECT id FROM `users` WHERE mobile_number = ?',
      [mobileNumber.trim()]
    );
    if (mobileRows.length > 0) {
      await connection.rollback();
      return res.status(409).json({ success: false, error: 'Mobile number already exists.' });
    }

    const [emailRows] = await connection.execute(
      'SELECT id FROM `users` WHERE email = ?',
      [email.trim()]
    );
    if (emailRows.length > 0) {
      await connection.rollback();
      return res.status(409).json({ success: false, error: 'Email already exists.' });
    }

    // Generate new user ID
    const [lastUser] = await connection.execute('SELECT id FROM `users` ORDER BY id DESC LIMIT 1');
    let newId = 'USR001';
    if (lastUser.length > 0) {
      const lastIdNum = parseInt(lastUser[0].id.replace('USR', ''));
      newId = `USR${String(lastIdNum + 1).padStart(3, '0')}`;
    }

    // Insert user with status = 'Active'
    await connection.execute(
      `INSERT INTO \`users\` (id, name, role, mobile_number, email, created_by, created_date, status)
       VALUES (?, ?, ?, ?, ?, ?, UNIX_TIMESTAMP(), ?)`,
      [newId, name.trim(), role.trim(), mobileNumber.trim(), email.trim(), createdBy || name.trim(), 'Active']
    );

    await connection.commit();
    logger.info(`User registered: ${JSON.stringify({ id: newId, name, role, mobileNumber, email, status: 'Active' })}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { id: newId, name, role, mobileNumber, email, status: 'Active' }
    });

  } catch (err) {
    if (connection) await connection.rollback();
    logger.error('Error registering user: ' + err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
};

// ===== GET ALL USERS =====
exports.getAllUsers = async (req, res) => {
  const { status } = req.query;

  try {
    let query = `
      SELECT u.id, u.name, u.role, u.email,
             u.mobile_number AS mobileNumber,
             u.created_date,
             u.status
      FROM \`users\` u
    `;

    const params = [];
    if (status && status !== 'All') {
      query += ' WHERE u.status = ?';
      params.push(status);
    }

    query += ' ORDER BY u.created_date DESC';

    const [rows] = await db.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// ===== GET USER BY ID =====
exports.getUserById = async (req, res) => {
  const { user_id } = req.params;

  try {
    const [rows] = await db.execute(
      `SELECT u.id, u.name, u.role, u.email,
              u.mobile_number AS mobileNumber,
              u.status
       FROM \`users\` u
       WHERE u.id = ?`,
      [user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// ===== UPDATE USER =====
exports.updateUser = async (req, res) => {
  const { user_id } = req.params;
  const { name, email, mobileNumber, role, status } = req.body;

  try {
    const fields = [];
    const values = [];

    if (name && name.trim() !== "") {
      fields.push("name = ?");
      values.push(name.trim());
    }
    if (email && email.trim() !== "") {
      const [emailRows] = await db.execute(
        "SELECT id FROM `users` WHERE email = ? AND id != ?",
        [email.trim(), user_id]
      );
      if (emailRows.length > 0) {
        return res.status(409).json({ success: false, error: "Email already exists." });
      }
      fields.push("email = ?");
      values.push(email.trim());
    }
    if (mobileNumber && mobileNumber.trim() !== "") {
      const [mobileRows] = await db.execute(
        "SELECT id FROM `users` WHERE mobile_number = ? AND id != ?",
        [mobileNumber.trim(), user_id]
      );
      if (mobileRows.length > 0) {
        return res.status(409).json({ success: false, error: "Mobile number already exists." });
      }
      fields.push("mobile_number = ?");
      values.push(mobileNumber.trim());
    }
    if (role && role.trim() !== "") {
      fields.push("role = ?");
      values.push(role.trim());
    }
    if (status && status.trim() !== "") {
      fields.push("status = ?");
      values.push(status.trim());
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: "No valid fields to update" });
    }

    values.push(user_id);

    const [result] = await db.execute(
      `UPDATE \`users\` SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({ success: true, message: "User updated successfully" });
  } catch (err) {
    console.error("UpdateUser error:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// ===== SOFT DELETE USER =====
exports.deleteUser = async (req, res) => {
  const { user_id } = req.params;

  try {
    const [result] = await db.execute(
      'UPDATE `user` SET status="Inactive" WHERE id=?',
      [user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, message: 'User marked as Inactive successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

//
// ===== OTP CONTROLLER FUNCTIONS =====
//

// Send or Resend OTP (10 min expiry)
exports.sendOtp = async (req, res) => {
  const { mobileNumber } = req.body;
  if (!mobileNumber) return res.status(400).json({ success: false, error: "Mobile number required" });

  try {
    const otp = generateOtp();

    // Insert OTP with expiry
    await db.execute(
      "INSERT INTO otp (mobile_number, otp_code, created_at) VALUES (?, ?, NOW())",
      [mobileNumber, otp]
    );

    // TODO: Send via SMS/Email API
    res.json({ success: true, message: "OTP sent successfully", otp }); // ⚠️ remove otp in production
  } catch (err) {
    console.error("Error sending OTP:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// Verify OTP (must be within 10 minutes)
exports.verifyOtp = async (req, res) => {
  const { mobileNumber, otp } = req.body;

  if (!mobileNumber || !otp) {
    return res.status(400).json({ success: false, error: "Mobile number and OTP required" });
  }

  try {
    const [rows] = await db.execute(
      `SELECT otp_code, created_at 
       FROM otp 
       WHERE mobile_number = ? 
       ORDER BY created_at DESC LIMIT 1`,
      [mobileNumber]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "No OTP found for this number" });
    }

    const latestOtp = rows[0];
    const createdAt = new Date(latestOtp.created_at);
    const now = new Date();

    const diffMinutes = (now - createdAt) / (1000 * 60);
    if (diffMinutes > 10) {
      return res.status(410).json({ success: false, error: "OTP expired" });
    }

    if (latestOtp.otp_code !== otp) {
      return res.status(400).json({ success: false, error: "Invalid OTP" });
    }

    res.json({ success: true, message: "OTP verified successfully" });
  } catch (err) {
    console.error("Error verifying OTP:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};
