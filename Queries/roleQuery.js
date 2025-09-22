// ----------------- ROLE-FEATURE-PRIVILEGES -----------------
const ASSIGN_PRIVILEGE = `
  INSERT INTO role_feature_privilege (role_id, feature_id, privilege_id)
  VALUES (?, ?, ?)
`;

const GET_PRIVILEGES_FOR_ROLE_FEATURE = `
  SELECT p.privilege_id, p.privilege_name
  FROM privileges p
  JOIN role_feature_privilege rfp ON p.privilege_id = rfp.privilege_id
  WHERE rfp.role_id = ? AND rfp.feature_id = ?
`;

module.exports = {
  // ... keep all previous exports
  ASSIGN_PRIVILEGE,
  GET_PRIVILEGES_FOR_ROLE_FEATURE
};
