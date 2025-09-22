const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/send-otp', authController.sendOtp);       // Send OTP
router.post('/login-otp', authController.loginWithOtp); // Login with OTP
router.post('/resend-otp', authController.resendOtp);   // Resend OTP
router.post('/logout', authController.terminateSession); // Terminate session

module.exports = router;
