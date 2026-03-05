const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const authMiddleware = require('../middleware/authMiddleware');

const cartController = require('../controllers/cartController');
const dashboardController = require('../controllers/dashboardController');


const multer = require('multer');
const path = require('path');


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images/'); 
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });


// ===============================
//       --- Public Pages ---
// ===============================
// หน้าแรกสำหรับ User ทั่วไป (แสดงหนังสือทั้งหมด)
router.get('/', bookController.renderHomePage); 

// cart routes
router.post('/cart/add', authMiddleware.isLoggedIn, cartController.addToCart);
router.get('/cart/get', authMiddleware.isLoggedIn, cartController.getCart);
router.post('/cart/update', authMiddleware.isLoggedIn, cartController.updateCart);

router.get('/checkout', authMiddleware.isLoggedIn, cartController.renderCheckout);
router.post('/checkout/process', authMiddleware.isLoggedIn, cartController.processCheckout);

// ===============================
//     --- Management (Admin) ---
// ===============================
// หน้า Dashboard หลัก
router.get('/management', authMiddleware.isAdmin, dashboardController.renderDashboard);

// --- ระบบจัดการหนังสือ (Books CRUD) ---

// 1. หน้าตารางรายชื่อหนังสือ (List)
// หมายเหตุ: หากคุณมีฟังก์ชันแยกสำหรับหน้าตาราง ให้เปลี่ยนจาก renderHome เป็นชื่อฟังก์ชันนั้นครับ
router.get('/management/books',authMiddleware.isAdmin, bookController.renderBookList);

// 2. เพิ่มหนังสือใหม่ (Create)
router.get('/management/books/create',authMiddleware.isAdmin, bookController.renderCreateForm);
router.post('/management/books/create',authMiddleware.isAdmin, upload.single('book_img'), bookController.handleCreate);

// 3. แก้ไขหนังสือ (Update)
// เปลี่ยนจาก /update/:id เป็น /edit/:id เพื่อให้ตรงกับมาตรฐานสากลและระบบ Category ครับ
router.get('/management/books/edit/:id',authMiddleware.isAdmin, bookController.renderUpdateForm);
router.post('/management/books/edit/:id',authMiddleware.isAdmin, upload.single('book_img'), bookController.handleUpdate);

// 4. ลบหนังสือ (Delete) - รองรับ Fetch API จากหน้าบ้าน
router.delete('/management/books/delete/:id',authMiddleware.isAdmin, bookController.handleDelete);

module.exports = router;