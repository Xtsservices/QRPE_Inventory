const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/dashboard/counts', dashboardController.getDashboardCounts);

module.exports = router;