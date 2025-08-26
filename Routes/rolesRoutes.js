const express = require('express');
const router = express.Router();
const controller = require('../controllers/rolesController');

router.post('/role-feature-privilege', controller.assignPrivilege);
router.get('/role-feature-privilege/:role_id/:feature_id', controller.getPrivilegesForRoleFeature);

module.exports = router;