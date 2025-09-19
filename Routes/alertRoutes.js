const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');

router.post('/alerts', alertController.createAlert);
router.put('/alerts/:alert_id', alertController.updateAlert);
router.get('/alerts', alertController.getAlerts);

module.exports = router;
