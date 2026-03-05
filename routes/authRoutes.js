const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// เส้นทางสำหรับแสดงหน้า Login และรับข้อมูล Login
router.get('/login', authController.renderLogin);
router.post('/login', authController.handleLogin);

// สมัครสมาชิก
router.get('/register', authController.renderRegister);
router.post('/register', authController.handleRegister);

// เส้นทางสำหรับ Logout
router.get('/logout', authController.handleLogout);

module.exports = router;
