// ===== LOGIN WITH OTP =====
exports.checkOtp = `
  SELECT * FROM otp 
  WHERE mobile_number = ? 
    AND otp_code = ? 
    AND expires_at > NOW()
  ORDER BY created_at DESC 
  LIMIT 1
`;

exports.getUserByMobile = `
  SELECT id FROM users WHERE mobile_number = ?
`;

exports.insertUser = `
  INSERT INTO users (id, name, role, mobile_number, email, created_by, created_date, status)
  VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)
`;

exports.insertLogin = `
  INSERT INTO login (user_id, login_by, login_date, status) 
  VALUES (?, ?, NOW(), 'Active')
`;

// ===== SEND OTP =====
exports.sendOtp = `
  INSERT INTO otp (mobile_number, otp_code, created_at, expires_at) 
  VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 10 MINUTE))
`;

// ===== RESEND OTP =====
exports.getLastOtp = `
  SELECT created_at 
  FROM otp 
  WHERE mobile_number = ? 
  ORDER BY created_at DESC 
  LIMIT 1
`;

exports.storeOtp = `
  INSERT INTO otp (mobile_number, otp_code, created_at, expires_at) 
  VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 10 MINUTE))
`;

// ===== TERMINATE SESSION =====
exports.terminateSession = `
  UPDATE login 
  SET status = 'Inactive', logout_time = NOW()
  WHERE user_id = ? 
    AND status = 'Active'
    AND login_date = (
      SELECT ld FROM (
        SELECT MAX(login_date) AS ld 
        FROM login 
        WHERE user_id = ? AND status = 'Active'
      ) AS latest
    )
`;
