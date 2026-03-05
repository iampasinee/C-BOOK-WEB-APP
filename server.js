const express = require('express');
const app = express();
const port = 3000;

// ตั้งค่าให้ Express ใช้งาน EJS
app.set('view engine', 'ejs');

// ตั้งค่าให้ดึงไฟล์ CSS/ภาพ จากโฟลเดอร์ public
app.use(express.static('public'));

// สร้าง Route สำหรับหน้าแรก (Home)
app.get('/', (req, res) => {
    const data = {
        cartCount: 2,
        wishlistCount: 5
    };
    res.render('home', data); 
});

app.get('/management', (req, res) => {
    res.render('management', {
        cartCount: 2,
        wishlistCount: 5
    }); 
});
app.get('/management/list_book', (req, res) => {
    res.render('management', {
        cartCount: 2,
        wishlistCount: 5
    }); 
});

// เปิดรันเซิร์ฟเวอร์
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});