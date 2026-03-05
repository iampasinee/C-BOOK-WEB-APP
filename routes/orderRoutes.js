const express = require('express');
const router = express.Router();

// เรียกใช้ Controller และ Middleware ของเรา
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');

// ==========================================
// Routes สำหรับ Order Management (Admin)
// ==========================================

// 1. หน้าตารางดูออเดอร์ทั้งหมด (รองรับทั้งโหลดหน้าเว็บปกติ และ โหลดผ่าน AJAX ค้นหา)
router.get('/management/orders', authMiddleware.isAdmin, orderController.renderOrderManagement);

// 2. API สำหรับให้แอดมินกดเปลี่ยนสถานะ (Pending -> Shipped ฯลฯ)
router.put('/management/orders/:id/status', authMiddleware.isAdmin, orderController.updateOrderStatus);

// ... (Route อื่นๆ) ...

//เพิ่ม Route นี้สำหรับหน้าดูรายละเอียด
router.get('/management/orders/:id', authMiddleware.isAdmin, orderController.renderOrderDetail);


module.exports = router;