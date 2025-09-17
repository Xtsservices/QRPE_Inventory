const db = require('../db');
const logger = require('../logger');

// ===== CREATE USER =====
exports.registerUser = async (req, res) => {
  const { name, role, mobileNumber, email, createdBy } = req.body; // remove id from destructure

  if (!name || !mobileNumber || !email || !role) {
    return res.status(400).json({ success: false, error: 'Name, mobileNumber, email, and role are required.' });
  }

  if (!/^[A-Za-z\s]{2,50}$/.test(name)) {
    return res.status(400).json({ success: false, error: 'Name should contain only letters and spaces.' });
  }
  if (!/^\d{10}$/.test(mobileNumber)) {
    return res.status(400).json({ success: false, error: 'Mobile number must be 10 digits.' });
  }
  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ success: false, error: 'Invalid email format.' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Check duplicates
    const [mobileRows] = await connection.execute(`SELECT id FROM user WHERE mobile_number = ?`, [mobileNumber]);
    if (mobileRows.length > 0) { await connection.rollback(); return res.status(409).json({ success: false, error: 'Mobile number already exists.' }); }

    const [emailRows] = await connection.execute(`SELECT id FROM user WHERE email = ?`, [email]);
    if (emailRows.length > 0) { await connection.rollback(); return res.status(409).json({ success: false, error: 'Email already exists.' }); }

    // ===== Generate new user ID =====
    const [lastUser] = await connection.execute('SELECT id FROM user ORDER BY created_date DESC LIMIT 1');
    let newId = 'USR001';
    if (lastUser.length > 0) {
      const lastIdNum = parseInt(lastUser[0].id.replace('USR', ''));
      newId = `USR${String(lastIdNum + 1).padStart(3, '0')}`;
    }

    // Insert user
    await connection.execute(
      `INSERT INTO user (id, name, role, mobile_number, email, created_by, created_date)
       VALUES (?, ?, ?, ?, ?, ?, UNIX_TIMESTAMP())`,
      [newId, name, role, mobileNumber, email, createdBy || name]
    );

    // Optional login table
    await connection.execute(
      `INSERT INTO login (user_id, login_by, login_date) VALUES (?, ?, UNIX_TIMESTAMP())`,
      [newId, createdBy || name]
    );

    await connection.commit();
    logger.info(`User registered: ${JSON.stringify({ id: newId, name, role, mobileNumber, email })}`);
    res.status(201).json({ success: true, message: 'User registered successfully', data: { id: newId, name, role, mobileNumber, email } });

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
  try {
    const [rows] = await db.execute(
     `SELECT u.id, u.name, u.role, u.email,
          u.mobile_number AS mobileNumber,   -- ✅ alias here
          l.login_date
   FROM user u
   LEFT JOIN login l ON u.id = l.user_id
   ORDER BY u.created_date DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// ===== GET USER BY ID =====
exports.getUserById = async (req, res) => {
  const { user_id } = req.params;  // <-- only once

  try {
    const [rows] = await db.execute(
      `SELECT u.id, u.name, u.role, u.email,
         u.mobile_number AS mobileNumber,
         l.login_date
       FROM user u
       LEFT JOIN login l ON u.id = l.user_id
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
  const { name, email, mobileNumber, role } = req.body;

  try {
    const [result] = await db.execute(
      `UPDATE user SET name=?, email=?, mobile_number=?, role=? WHERE id=?`,
      [name, email, mobileNumber, role, user_id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, message: 'User updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

exports.deleteUser = async (req, res) => {
  const { user_id } = req.params; // Make sure this matches your route param

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Delete from login table
    await connection.execute(`DELETE FROM login WHERE user_id = ?`, [user_id]);

    // Delete from user table
    const [result] = await connection.execute(`DELETE FROM user WHERE id = ?`, [user_id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await connection.commit();
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Error deleting user:', err); // <-- Look at this in terminal
    res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
};
``