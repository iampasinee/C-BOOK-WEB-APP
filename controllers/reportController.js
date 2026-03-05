const db = require('../models');
const { Op } = require('sequelize');

// 1. [GET] หน้าแรก: รายงานยอดขายแยกตามหมวดหมู่ (สรุป)
exports.renderSalesByCategory = async (req, res) => {
    try {
        const orderDetails = await db.orderDetail.findAll({
            include: [
                {
                    model: db.order,
                    where: { status: { [Op.ne]: 'cancelled' } }, 
                    attributes: ['status']
                },
                {
                    model: db.books,
                    include: [{ model: db.category, attributes: ['category_id', 'category_name'] }]
                }
            ]
        });

        const categorySales = {};

        orderDetails.forEach(item => {
            const cat = (item.book && item.book.category) ? item.book.category : null;
            const categoryId = cat ? cat.category_id : 'uncategorized';
            const categoryName = cat ? cat.category_name : 'Uncategorized';
            const qty = item.quantity;
            const price = parseFloat(item.unit_price);
            const totalRevenue = qty * price;

            if (!categorySales[categoryId]) {
                categorySales[categoryId] = { 
                    id: categoryId,
                    name: categoryName, 
                    totalQty: 0, 
                    totalRevenue: 0 
                };
            }

            categorySales[categoryId].totalQty += qty;
            categorySales[categoryId].totalRevenue += totalRevenue;
        });

        const reportData = Object.values(categorySales).sort((a, b) => b.totalQty - a.totalQty);
        const grandTotalQty = reportData.reduce((sum, cat) => sum + cat.totalQty, 0);
        const grandTotalRevenue = reportData.reduce((sum, cat) => sum + cat.totalRevenue, 0);

        res.render('management/reports/sales_category', {
            activePage: 'reports1', 
            reportData: reportData,
            grandTotalQty: grandTotalQty,
            grandTotalRevenue: grandTotalRevenue,
            userName: req.session.userName,
            userEmail: req.session.userEmail
        });

    } catch (err) {
        console.error("🔥 Report Error:", err);
        res.status(500).send("Server Error");
    }
};

// 2. [GET] หน้าเจาะลึก: ดูรายชื่อหนังสือที่ขายได้ในหมวดหมู่นั้น
exports.renderCategoryDetailReport = async (req, res) => {
    try {
        const categoryId = req.params.id;
        let categoryName = 'Uncategorized';

        // หาชื่อหมวดหมู่
        if (categoryId !== 'uncategorized') {
            const category = await db.category.findByPk(categoryId);
            if (category) categoryName = category.category_name;
        }

        // ดึงรายการสั่งซื้อเฉพาะหนังสือที่อยู่ในหมวดหมู่นี้
        const orderDetails = await db.orderDetail.findAll({
            include: [
                {
                    model: db.order,
                    where: { status: { [Op.ne]: 'cancelled' } },
                    attributes: ['status']
                },
                {
                    model: db.books,
                    where: categoryId !== 'uncategorized' ? { category_id: categoryId } : { category_id: null },
                    attributes: ['book_id', 'title'] // ถ้ามี book_img ให้ดึงมาด้วยได้ครับ
                }
            ]
        });

        const bookSales = {};

        // จัดกลุ่มตามหนังสือ
        orderDetails.forEach(item => {
            const bookId = item.book.book_id;
            const bookTitle = item.book.title;
            const qty = item.quantity;
            const revenue = qty * parseFloat(item.unit_price);

            if (!bookSales[bookId]) {
                bookSales[bookId] = { id: bookId, title: bookTitle, qty: 0, revenue: 0 };
            }
            bookSales[bookId].qty += qty;
            bookSales[bookId].revenue += revenue;
        });

        // เรียงหนังสือที่ทำรายได้มากสุดขึ้นก่อน
        const reportData = Object.values(bookSales).sort((a, b) => b.revenue - a.revenue);
        
        // ยอดรวมเฉพาะหมวดหมู่นี้
        const grandTotalQty = reportData.reduce((sum, b) => sum + b.qty, 0);
        const grandTotalRevenue = reportData.reduce((sum, b) => sum + b.revenue, 0);

        res.render('management/reports/sales_category_detail', {
            activePage: 'reports1',
            categoryName: categoryName,
            reportData: reportData,
            grandTotalQty: grandTotalQty,
            grandTotalRevenue: grandTotalRevenue,
            userName: req.session.userName,
            userEmail: req.session.userEmail
        });

    } catch (err) {
        console.error("🔥 Detail Report Error:", err);
        res.status(500).send("Server Error");
    }
};



// 3. [GET] รายงานวิเคราะห์สต็อกสินค้าคงเหลือ (Inventory Status)
exports.renderInventoryStatus = async (req, res) => {
    try {
        // ดึงหมวดหมู่ทั้งหมดมาทำ Dropdown
        const categories = await db.category.findAll({ order: [['category_name', 'ASC']] });

        // ดึงข้อมูลหนังสือทั้งหมดพร้อมหมวดหมู่ (เรียงตามสต็อกน้อยไปมาก เพื่อให้เห็นตัวที่ใกล้หมดก่อน)
        const books = await db.books.findAll({
            include: [{ model: db.category, attributes: ['category_name'] }],
            order: [
                ['stock_quantity', 'ASC'] // 🚨 หมายเหตุ: ถ้าใน Model คุณใช้ชื่อคอลัมน์ว่า quantity ให้แก้ 'stock' เป็น 'quantity' นะครับ
            ]
        });

        // จัดรูปข้อมูลและกำหนดเกณฑ์สถานะ
        const reportData = books.map(b => {
            const currentStock = b.stock_quantity; // เปลี่ยนเป็น b.quantity ได้ถ้า DB คุณใช้ชื่อนั้น
            let statusName = 'In Stock';
            let statusCode = 'in-stock';

            if (currentStock === 0) {
                statusName = 'Out of Stock';
                statusCode = 'out-of-stock';
            } else if (currentStock <= 10) { // 🚨 เกณฑ์: ถ้าน้อยกว่าหรือเท่ากับ 10 ให้แจ้งเตือนว่าเหลือน้อย
                statusName = 'Low Stock';
                statusCode = 'low-stock';
            }

            return {
                id: b.book_id,
                title: b.title,
                category: b.category ? b.category.category_name : 'Uncategorized',
                categoryId: b.category_id,
                stock: currentStock,
                statusName: statusName,
                statusCode: statusCode
            };
        });

        res.render('management/reports/inventory_status', {
            activePage: 'reports2',
            reportData: reportData,
            categories: categories,
            totalBooks: reportData.length,
            userName: req.session.userName,
            userEmail: req.session.userEmail
        });

    } catch (err) {
        console.error("🔥 Inventory Report Error:", err);
        res.status(500).send("Server Error");
    }
};


















// [GET] หน้าแรก: รายงานยอดขายแยกตามหมวดหมู่ (สรุปแบบจัดกลุ่มหนังสือ)
exports.renderSales2= async (req, res) => {
    try {
        const orderDetails = await db.orderDetail.findAll({
            include: [
                {
                    model: db.order,
                    where: { status: { [Op.ne]: 'cancelled' } }, 
                    attributes: ['status']
                },
                {
                    model: db.books,
                    include: [{ model: db.category, attributes: ['category_id', 'category_name'] }]
                }
            ]
        });

        const categorySales = {};

        orderDetails.forEach(item => {
            const cat = (item.book && item.book.category) ? item.book.category : null;
            const categoryId = cat ? cat.category_id : 'uncategorized';
            const categoryName = cat ? cat.category_name : 'Uncategorized';
            const bookTitle = item.book ? item.book.title : 'Unknown';
            const qty = item.quantity;
            const price = parseFloat(item.unit_price);
            const revenue = qty * price;

            if (!categorySales[categoryId]) {
                categorySales[categoryId] = { 
                    id: categoryId,
                    name: categoryName, 
                    totalQty: 0, 
                    totalRevenue: 0,
                    books: {} // สำหรับเก็บยอดขายรายหนังสือในหมวดนี้
                };
            }

            categorySales[categoryId].totalQty += qty;
            categorySales[categoryId].totalRevenue += revenue;

            // เก็บรายชื่อหนังสือและยอดขายสะสมรายเล่ม
            if (!categorySales[categoryId].books[bookTitle]) {
                categorySales[categoryId].books[bookTitle] = { title: bookTitle, qty: 0, revenue: 0 };
            }
            categorySales[categoryId].books[bookTitle].qty += qty;
            categorySales[categoryId].books[bookTitle].revenue += revenue;
        });

        // แปลงข้อมูลและเรียงลำดับตามจำนวนเล่มที่ขายได้ (ตามที่คุณต้องการล่าสุด)
        const reportData = Object.values(categorySales).sort((a, b) => b.totalQty - a.totalQty).slice(0, 5);
        
        const grandTotalQty = reportData.reduce((sum, cat) => sum + cat.totalQty, 0);
        const grandTotalRevenue = reportData.reduce((sum, cat) => sum + cat.totalRevenue, 0);

        res.render('management/reports/sale-2', {
            activePage: 'reports1', 
            reportData: reportData,
            grandTotalQty: grandTotalQty,
            grandTotalRevenue: grandTotalRevenue,
            userName: req.session.userName,
            userEmail: req.session.userEmail
        });

    } catch (err) {
        console.error("🔥 Report Error:", err);
        res.status(500).send("Server Error");
    }
};