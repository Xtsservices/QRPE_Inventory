const db = require('../db');
const logger = require('../logger');
const queries = require('../Queries/userQuery');

// Helper: generate 6-digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ===== CREATE USER =====
exports.registerUser = async (req, res) => {
  const { name, role, mobileNumber, email, createdBy } = req.body;

  if (!name || !mobileNumber || !email || !role) {
    return res.status(400).json({ success: false, error: 'Name, mobileNumber, email, and role are required.' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // ✅ Check duplicates
    const [mobileRows] = await connection.execute(queries.CHECK_MOBILE_EXISTS, [mobileNumber.trim()]);
    if (mobileRows.length > 0) {
      await connection.rollback();
      return res.status(409).json({ success: false, error: 'Mobile number already exists.' });
    }

    const [emailRows] = await connection.execute(queries.CHECK_EMAIL_EXISTS, [email.trim()]);
    if (emailRows.length > 0) {
      await connection.rollback();
      return res.status(409).json({ success: false, error: 'Email already exists.' });
    }

    // ✅ Generate new user ID
    const [lastUser] = await connection.execute(queries.GET_LAST_USER);
    let newId = 'USR001';
    if (lastUser.length > 0) {
      const lastIdNum = parseInt(lastUser[0].id.replace('USR', ''));
      newId = `USR${String(lastIdNum + 1).padStart(3, '0')}`;
    }

    // ✅ Insert user
    await connection.execute(queries.INSERT_USER, [
      newId, name.trim(), role.trim(), mobileNumber.trim(),
      email.trim(), createdBy || name.trim(), 'Active'
    ]);

    await connection.commit();

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
    let query = queries.GET_ALL_USERS;
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
    const [rows] = await db.execute(queries.GET_USER_BY_ID, [user_id]);
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

    if (name) { fields.push("name = ?"); values.push(name.trim()); }
    if (email) {
      const [emailRows] = await db.execute(queries.CHECK_EMAIL_EXISTS_EXCEPT, [email.trim(), user_id]);
      if (emailRows.length > 0) return res.status(409).json({ success: false, error: "Email already exists." });
      fields.push("email = ?"); values.push(email.trim());
    }
    if (mobileNumber) {
      const [mobileRows] = await db.execute(queries.CHECK_MOBILE_EXISTS_EXCEPT, [mobileNumber.trim(), user_id]);
      if (mobileRows.length > 0) return res.status(409).json({ success: false, error: "Mobile number already exists." });
      fields.push("mobile_number = ?"); values.push(mobileNumber.trim());
    }
    if (role) { fields.push("role = ?"); values.push(role.trim()); }
    if (status) { fields.push("status = ?"); values.push(status.trim()); }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: "No valid fields to update" });
    }

    values.push(user_id);
    const [result] = await db.execute(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);

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
    const [result] = await db.execute(queries.SOFT_DELETE_USER, [user_id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, message: 'User marked as Inactive successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// ===== SEND OTP =====
exports.sendOtp = async (req, res) => {
  const { mobileNumber } = req.body;
  if (!mobileNumber) return res.status(400).json({ success: false, error: "Mobile number required" });

  try {
    const otp = generateOtp();
    await db.execute(queries.INSERT_OTP, [mobileNumber, otp]);

    res.json({ success: true, message: "OTP sent successfully", otp }); // ⚠ remove otp in production
  } catch (err) {
    console.error("Error sending OTP:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// ===== VERIFY OTP =====
exports.verifyOtp = async (req, res) => {
  const { mobileNumber, otp } = req.body;
  if (!mobileNumber || !otp) {
    return res.status(400).json({ success: false, error: "Mobile number and OTP required" });
  }

  try {
    const [rows] = await db.execute(queries.GET_LATEST_OTP, [mobileNumber]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: "No OTP found for this number" });

    const latestOtp = rows[0];
    const createdAt = new Date(latestOtp.created_at);
    const now = new Date();
    const diffMinutes = (now - createdAt) / (1000 * 60);

    if (diffMinutes > 10) return res.status(410).json({ success: false, error: "OTP expired" });
    if (latestOtp.otp_code !== otp) return res.status(400).json({ success: false, error: "Invalid OTP" });

    res.json({ success: true, message: "OTP verified successfully" });
  } catch (err) {
    console.error("Error verifying OTP:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};
