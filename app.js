const express = require('express');
const path = require('path');
const { sequelize } = require('./models');

// 🚨 1. นำเข้า express-session สำหรับจัดการระบบ Login
const session = require('express-session'); 

// นำเข้า Routes เพียงครั้งเดียวต่อหนึ่งตัวแปร
const bookRoutes = require('./routes/bookRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const ordersRoutes = require('./routes/orderRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

// View Engine & Static Files
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 🚨 3. ตั้งค่า Session (สำคัญมาก: ต้องวางไว้ *ก่อน* เรียกใช้ Routes)
app.use(session({
    secret: 'cbook_secret_key_123', // รหัสลับสำหรับเข้ารหัสคุกกี้
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // ล็อกอินค้างไว้ 1 วัน
}));

// 1. เส้นทางฝั่ง Frontend และ API
// เนื่องจากเราแยก logic ไว้ในไฟล์ routes เรียบร้อยแล้ว สามารถเรียกใช้ได้เลยครับ
app.use('/', bookRoutes); 
app.use('/', categoryRoutes); 
app.use('/', userRoutes);
app.use('/', authRoutes);
app.use('/', ordersRoutes);
app.use('/', reportRoutes);

const port = process.env.PORT || 3000;

sequelize.sync().then(() => {
    app.listen(port, () => {
        console.log(`C-BOOK Application listening at http://localhost:${port}`);
    });
});