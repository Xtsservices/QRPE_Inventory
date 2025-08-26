const db = require('../db');

// Assign privilege to role-feature
exports.assignPrivilege = async (req, res) => {
  const { role_id, feature_id, privilege_id } = req.body;
  if (!role_id || !feature_id || !privilege_id) {
    return res.status(400).json({ success: false, error: 'role_id, feature_id, and privilege_id are required.' });
  }
  try {
    await db.execute(
      `INSERT INTO role_feature_privilege (role_id, feature_id, privilege_id) VALUES (?, ?, ?)`,
      [role_id, feature_id, privilege_id]
    );
    res.json({ success: true, message: 'Privilege assigned to role-feature.' });
  } catch (err) {
    console.error('Error assigning privilege:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Get all privileges for a role-feature
exports.getPrivilegesForRoleFeature = async (req, res) => {
  const { role_id, feature_id } = req.params;
  try {
    const [rows] = await db.execute(
      `SELECT p.privilege_id, p.privilege_name
       FROM privileges p
       JOIN role_feature_privilege rfp ON p.privilege_id = rfp.privilege_id
       WHERE rfp.role_id = ? AND rfp.feature_id = ?`,
      [role_id, feature_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching privileges:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};