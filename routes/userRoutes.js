const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');


// ===============================
//     --- User Management ---
// ===============================

// 1. หน้าตารางรายชื่อสมาชิก (List)
router.get('/management/users/', authMiddleware.isAdmin, userController.renderUserList);

router.put('/management/users/:id/role', authMiddleware.isAdmin, userController.changeUserRole);
router.delete('/management/users/:id', authMiddleware.isAdmin, userController.deleteUser);

module.exports = router;