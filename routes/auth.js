const express = require('express');
const router = express.Router();
const {register, login, verifyOTP} = require("../controllers/AuthController")

router.post('/login', login);
router.post('/register', register)
router.post('/verify-otp', verifyOTP)

module.exports = router;