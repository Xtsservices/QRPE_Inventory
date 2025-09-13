const db = require('../db');
const logger = require('../logger');

exports.registerUser = async (req, res) => {
  const {
    first_name,
    last_name,
    date_of_birth,
    gender,
    mobile_number,
    email_id
  } = req.body;

  // Input validation
  if (!first_name || !mobile_number) {
    return res.status(400).json({ success: false, error: 'first_name and mobile_number are required.' });
  }
  // Mobile number must be exactly 10 digits
  if (!/^\d{10}$/.test(mobile_number)) {
    return res.status(400).json({ success: false, error: 'mobile_number must be exactly 10 digits.' });
  }
  if (email_id == null) {
    return res.status(400).json({ success: false, error: 'Email ID should not be null.' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Check if mobile_number already exists
    const [mobileRows] = await connection.execute(
      `SELECT user_id FROM user WHERE mobile_number = ?`,
      [mobile_number]
    );
    if (mobileRows.length > 0) {
      await connection.rollback();
      return res.status(409).json({ success: false, error: 'Mobile number already exists.' });
    }

    // Check if email_id already exists
    const [emailRows] = await connection.execute(
      `SELECT user_id FROM user WHERE email_id = ?`,
      [email_id]
    );
    if (emailRows.length > 0) {
      await connection.rollback();
      return res.status(409).json({ success: false, error: 'Email ID already exists.' });
    }

    // Insert into user table
    const [userResult] = await connection.execute(
      `INSERT INTO user (first_name, last_name, date_of_birth, gender, mobile_number, email_id, created_by, created_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, UNIX_TIMESTAMP())`,
      [first_name, last_name, date_of_birth, gender, mobile_number, email_id, first_name]
    );
    const user_id = userResult.insertId;

    // Insert into login table, linking with user_id
    await connection.execute(
      `INSERT INTO login (user_id, login_by, login_date)
       VALUES (?, ?, UNIX_TIMESTAMP())`,
      [user_id, first_name]
    );

    await connection.commit();
    logger.info('User registered successfully: ' + JSON.stringify({ user_id, first_name, last_name, mobile_number, email_id }));
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user_id,
        first_name,
        last_name,
        mobile_number,
        email_id
      }
    });
  } catch (err) {
    if (connection) await connection.rollback();
    logger.error('Error during registration: ' + err.message);
    console.error('Error during registration:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
};

exports.getUserById = async (req, res) => {
  const { user_id } = req.params;
  try {
    const [rows] = await db.execute(
      `SELECT u.*, l.login_date
       FROM user u
       JOIN login l ON u.user_id = l.user_id
       WHERE u.user_id = ?`,
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