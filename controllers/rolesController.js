const db = require('../db');
const queries = require('../Queries/roleQuery');

// Assign privilege to role-feature
exports.assignPrivilege = async (req, res) => {
  const { role_id, feature_id, privilege_id } = req.body;
  if (!role_id || !feature_id || !privilege_id) {
    return res.status(400).json({
      success: false,
      error: 'role_id, feature_id, and privilege_id are required.'
    });
  }
  try {
    await db.execute(queries.ASSIGN_PRIVILEGE, [role_id, feature_id, privilege_id]);
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
    const [rows] = await db.execute(queries.GET_PRIVILEGES_FOR_ROLE_FEATURE, [role_id, feature_id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching privileges:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
