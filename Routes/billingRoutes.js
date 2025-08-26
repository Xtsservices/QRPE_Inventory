const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');

router.post('/billings', billingController.createBilling);
router.get('/billings', billingController.getBillings);

module.exports = router;