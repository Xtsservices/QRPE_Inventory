module.exports = {
  // Insert new privilege mapping (assign privilege)
  ASSIGN_PRIVILEGE: `
    INSERT INTO role_feature_privileges (role_id, feature_id, privilege_id)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP
  `,

  // Get privileges (human-readable) for a specific role-feature
  GET_PRIVILEGES_FOR_ROLE_FEATURE: `
    SELECT 
      r.role_name,
      f.feature_name,
      p.privilege_id,
      p.privilege_name
    FROM role_feature_privileges rfp
    JOIN roles r ON rfp.role_id = r.role_id
    JOIN features f ON rfp.feature_id = f.feature_id
    JOIN privileges p ON rfp.privilege_id = p.privilege_id
    WHERE rfp.role_id = ? AND rfp.feature_id = ?
  `,

  // Optional: Get ALL role-feature-privileges (nice for admin dashboards)
  GET_ALL_ROLE_FEATURE_PRIVILEGES: `
    SELECT 
      r.role_name,
      f.feature_name,
      p.privilege_name
    FROM role_feature_privileges rfp
    JOIN roles r ON rfp.role_id = r.role_id
    JOIN features f ON rfp.feature_id = f.feature_id
    JOIN privileges p ON rfp.privilege_id = p.privilege_id
    ORDER BY r.role_name, f.feature_name, p.privilege_name
  `
};
