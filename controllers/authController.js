const db = require('../models');

// 1. โหลดหน้าจอ Login
exports.renderLogin = (req, res) => {
    // ส่งตัวแปร error: null ไปก่อนเผื่อหน้าเว็บพัง
    res.render('login', { error: null }); 
};

// 2. ตรวจสอบข้อมูลตอนผู้ใช้กดปุ่ม Login
exports.handleLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // ขั้นที่ 1: หาตัวผู้ใช้จากอีเมล (อิงตามฟิลด์ user_email ในตารางคุณ)
        const user = await db.users.findOne({ where: { user_email: email } });
        
        if (!user) {
            return res.render('login', { error: 'ไม่พบอีเมลนี้ในระบบ' });
        }

        // ขั้นที่ 2: เช็กรหัสผ่าน (เรียกใช้ฟังก์ชัน validPassword จาก Model ของคุณ)
        const isMatch = await user.validPassword(password);
        
        if (!isMatch) {
            return res.render('login', { error: 'รหัสผ่านไม่ถูกต้อง' });
        }

        // ขั้นที่ 3: เช็กว่าโดนระงับบัญชีไหม
        if (user.user_status !== 'active') {
            return res.render('login', { error: 'บัญชีนี้ถูกระงับการใช้งาน' });
        }

        // ✅ ล็อกอินสำเร็จ! สร้าง Session จำตัวตนไว้
        req.session.userId = user.user_id;
        req.session.userName = user.user_name;
        req.session.userEmail = user.user_email;
        req.session.role = user.user_role;

        // ขั้นที่ 4: เด้งไปตามสิทธิ์การใช้งาน
        if (user.user_role === 'admin') {
            res.redirect('/management'); // แอดมินไปหลังบ้าน
        } else {
            res.redirect('/'); // ลูกค้าปกติไปหน้าร้าน
        }

    } catch (err) {
        console.error("🔥 Login Error:", err);
        res.render('login', { error: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์ กรุณาลองใหม่' });
    }
};

// 3. ระบบ Logout
exports.handleLogout = (req, res) => {
    // ลบ Session ทิ้งทั้งหมด
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
        }
        // ลบเสร็จให้เด้งกลับไปหน้า Home
        res.redirect('/'); 
    });
};


// ==========================================
// ส่วนของการสมัครสมาชิก (Register)
// ==========================================

// 1. [GET] เปิดหน้าฟอร์มสมัครสมาชิก
exports.renderRegister = (req, res) => {
    // โหลดหน้า register.ejs พร้อมส่งตัวแปร error ว่างๆ ไปก่อน
    res.render('register', { error: null });
};

// 2. [POST] รับข้อมูลจากฟอร์มเพื่อบันทึกลงฐานข้อมูล
exports.handleRegister = async (req, res) => {
    try {
        // ดึงข้อมูลมาจากช่อง input ในไฟล์ register.ejs (อิงตามค่า name="")
        const { username, email, password } = req.body;
        
        // ขั้นตอนที่ 1: เช็กว่ามี Email นี้ในระบบหรือยัง?
        const existingUser = await db.users.findOne({ where: { user_email: email } });
        
        if (existingUser) {
            // ถ้ามีอีเมลนี้แล้ว ให้ตีกลับไปหน้าเดิมพร้อมข้อความแจ้งเตือน
            return res.render('register', { error: 'อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น!' });
        }

        // ขั้นตอนที่ 2: บันทึกผู้ใช้ใหม่ลง Database 
        // 🚨 เราใส่ password ธรรมดาเข้าไปได้เลย เพราะ Hook ใน Model (beforeCreate) จะเข้ารหัสให้เอง
        await db.users.create({
            user_name: username,
            user_email: email,
            password: password,
            user_role: 'member',   
            user_status: 'active'   
        });

        // ขั้นตอนที่ 3: สมัครสำเร็จ เด้งพากลับไปหน้า Login ทันที
        res.redirect('/login');

    } catch (err) {
        console.error("Register Error:", err);
        // ถ้าเซิร์ฟเวอร์มีปัญหา หรือ Database เซฟไม่ผ่าน จะแจ้งเตือนผู้ใช้
        res.render('register', { error: 'เกิดข้อผิดพลาดในการสมัครสมาชิก กรุณาลองใหม่อีกครั้ง' });
    }
};