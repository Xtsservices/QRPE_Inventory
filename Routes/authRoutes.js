const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.loginWithOtp);
router.post('/resend-otp', authController.resendOtp);
router.post('/logout', authController.terminateSession);

module.exports = router;