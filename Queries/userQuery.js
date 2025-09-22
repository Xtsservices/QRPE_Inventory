// ================= USER QUERIES =================

// --- Validation ---
exports.CHECK_MOBILE_EXISTS = `
  SELECT id FROM users WHERE mobile_number = ?
`;

exports.CHECK_EMAIL_EXISTS = `
  SELECT id FROM users WHERE email = ?
`;

exports.CHECK_EMAIL_EXISTS_EXCEPT = `
  SELECT id FROM users WHERE email = ? AND id != ?
`;

exports.CHECK_MOBILE_EXISTS_EXCEPT = `
  SELECT id FROM users WHERE mobile_number = ? AND id != ?
`;

// --- Get last user for ID generation ---
exports.GET_LAST_USER = `
  SELECT id FROM users ORDER BY id DESC LIMIT 1
`;

// --- Insert user ---
exports.INSERT_USER = `
  INSERT INTO users 
  (id, name, role, mobile_number, email, created_by, created_date, status)
  VALUES (?, ?, ?, ?, ?, ?, UNIX_TIMESTAMP(), ?)
`;

// --- Get all users ---
exports.GET_ALL_USERS = `
  SELECT u.id, u.name, u.role, u.email,
         u.mobile_number AS mobileNumber,
         u.created_date,
         u.status
  FROM users u
`;

// --- Get user by ID ---
exports.GET_USER_BY_ID = `
  SELECT u.id, u.name, u.role, u.email,
         u.mobile_number AS mobileNumber,
         u.status
  FROM users u
  WHERE u.id = ?
`;

// --- Update user (dynamic SQL will be built in controller) ---

// --- Soft delete user ---
exports.SOFT_DELETE_USER = `
  UPDATE users SET status="Inactive" WHERE id=?
`;

// ================= OTP QUERIES =================

// --- Insert OTP ---
exports.INSERT_OTP = `
  INSERT INTO otp (mobile_number, otp_code, created_at) 
  VALUES (?, ?, NOW())
`;

// --- Get latest OTP ---
exports.GET_LATEST_OTP = `
  SELECT otp_code, created_at 
  FROM otp 
  WHERE mobile_number = ? 
  ORDER BY created_at DESC 
  LIMIT 1
`;
