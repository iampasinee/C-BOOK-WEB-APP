// middleware/authMiddleware.js

// 1. ยามเช็กสิทธิ์ Admin (สำหรับหน้า Management)
exports.isAdmin = (req, res, next) => {
    // เช็กว่ามี Session ล็อกอินอยู่ไหม และ Role เป็น 'admin' หรือเปล่า
    if (req.session && req.session.userId && req.session.role === 'admin') {
        return next(); // อนุญาตให้ผ่านไปดึงหน้าเว็บได้
    }
    
    // ถ้ายังไม่ล็อกอิน หรือไม่ใช่ Admin ให้เด้งกลับไปหน้า Login
    res.redirect('/login');
};

// 2. ยามเช็กแค่ล็อกอินเฉยๆ (เผื่ออนาคตเอาไว้ใช้กับหน้า ตะกร้าสินค้า หรือ หน้าโปรไฟล์)
exports.isLoggedIn = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next(); // อนุญาตให้ผ่าน
    }
    res.redirect('/login');
};