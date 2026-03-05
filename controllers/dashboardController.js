const db = require('../models');

// [GET] หน้า Dashboard สรุปข้อมูล
exports.renderDashboard = async (req, res) => {
    try {
        // 1. นับจำนวนหนังสือ ลูกค้า และออเดอร์
        const totalBooks = await db.books.count();
        const totalUsers = await db.users.count({ where: { user_role: 'member' } });
        const totalOrders = await db.order.count();

        // 2. คำนวณยอดขายรวมทั้งหมด
        const orderDetails = await db.orderDetail.findAll();
        // เอา (จำนวน x ราคา) ของทุกรายการมาบวกกัน
        const totalSales = orderDetails.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
        const totalBooksSold = orderDetails.reduce((sum, order) => sum + order.quantity , 0);
        // หมายเหตุ: ถ้ามีออเดอร์เยอะมาก ในอนาคตควรใช้ Sequelize .sum() หรือ Raw Query แทนเพื่อความเร็วครับ

        // 3. ดึงออเดอร์ล่าสุด 5 รายการมาโชว์
        const recentOrders = await db.order.findAll({
            limit: 5,
            order: [['order_date', 'DESC']],
            include: [
                { model: db.users, attributes: ['user_name'] },
                { model: db.orderDetail, attributes: ['quantity', 'unit_price'] }
            ],
            distinct: true
        });

        // ฟอร์แมตข้อมูลออเดอร์ล่าสุดให้พร้อมแสดงผล
        const formattedRecentOrders = recentOrders.map(o => {
            const itemsTotal = o.orderDetails.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
            const totalItems = o.orderDetails.reduce((sum, item) => sum + item.quantity, 0);
            return {
                order_id: o.order_id,
                order_date: o.order_date,
                status: o.status,
                user_name: o.user ? o.user.user_name : 'Unknown',
                total_amount: itemsTotal.toFixed(2),
                total_items: totalItems
            };
        });

        res.render('management', {
            activePage: 'home', // เอาไว้เน้นสีเมนูใน Sidebar
            totalBooks,
            totalUsers,
            totalOrders,
            totalSales,
            totalBooksSold,
            recentOrders: formattedRecentOrders,
            userName: req.session.userName,
            userEmail: req.session.userEmail
        });

    } catch (err) {
        console.error("🔥 Dashboard Error:", err);
        res.status(500).send("Server Error");
    }
};