const db = require('../models');
const fs = require('fs');
const path = require('path');
const { books, category } = db;
const { Op } = require('sequelize');


// [GET] ดึงรายการคำสั่งซื้อทั้งหมดไปแสดงหน้า Admin
exports.renderOrderManagement = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;
        
        // รับค่าจากการค้นหา
        const searchQuery = req.query.search || '';
        const statusFilter = req.query.status || '';

        // สร้างเงื่อนไขการกรองข้อมูล
        let whereCondition = {};
        
        if (statusFilter) {
            whereCondition.status = statusFilter;
        }

        // ค้นหาตาม Order ID (ถ้าพิมพ์เป็นตัวเลข)
        if (searchQuery && !isNaN(searchQuery)) {
            whereCondition.order_id = searchQuery;
        }

        // ดึงข้อมูล Order พร้อมกับ User และ OrderDetail
        const { count, rows: orders } = await db.order.findAndCountAll({
            where: whereCondition,
            include: [
                { 
                    model: db.users, 
                    attributes: ['user_name', 'user_email'],
                    // ถ้าค้นหาเป็นตัวหนังสือ ให้ไปหาที่ชื่อลูกค้าแทน
                    where: (searchQuery && isNaN(searchQuery)) ? {
                        user_name: { [Op.like]: `%${searchQuery}%` }
                    } : undefined
                },
                { model: db.orderDetail, attributes: ['quantity', 'unit_price'] }
            ],
            order: [['order_date', 'DESC']],
            limit: limit,
            offset: offset,
            distinct: true
        });

        // จัดรูปข้อมูลและคำนวณยอดรวมของแต่ละบิล
        const formattedOrders = orders.map(o => {
            const itemsTotal = o.orderDetails.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
            const totalItems = o.orderDetails.reduce((sum, item) => sum + item.quantity, 0);
            return {
                order_id: o.order_id,
                order_date: o.order_date,
                status: o.status,
                user_name: o.user ? o.user.user_name : 'Unknown User',
                total_amount: itemsTotal,
                total_items: totalItems
            };
        });

        const totalPages = Math.ceil(count / limit);

        // 🚨 ถ้าเป็นการโหลดผ่าน AJAX (พิมพ์ช่องค้นหา) ให้ส่งกลับเป็น JSON
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.json({
                orders: formattedOrders,
                totalItems: count,
                totalPages: totalPages,
                currentPage: page,
                limit: limit
            });
        }

        // ถ้าโหลดหน้าเว็บปกติ
        res.render('management/orders/list_orders', {
            orders: formattedOrders,
            currentPage: page,
            totalPages: totalPages,
            totalItems: count,
            limit: limit,
            searchQuery: searchQuery,
            filterStatus: statusFilter,
            activePage: 'orders',
            userName: req.session.userName,
            userEmail: req.session.userEmail
        });

    } catch (err) {
        console.error("🔥 Error fetching orders:", err);
        res.status(500).send("Server Error");
    }
};

// [PUT] เปลี่ยนสถานะคำสั่งซื้อ (API)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        await db.order.update({ status: status }, { where: { order_id: id } });
        res.json({ success: true, message: 'Status updated successfully' });
    } catch (err) {
        console.error("🔥 Error updating status:", err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


// [GET] หน้าแสดงรายละเอียดคำสั่งซื้อ (Order Details)
exports.renderOrderDetail = async (req, res) => {
    try {
        const orderId = req.params.id;

        // ดึงข้อมูล Order + User + OrderDetail + Books (ดึงทะลุ 3 ตารางเลยครับ!)
        const order = await db.order.findByPk(orderId, {
            include: [
                { model: db.users, attributes: ['user_name', 'user_email'] },
                { 
                    model: db.orderDetail, 
                    include: [{ model: db.books, attributes: ['title', 'book_img'] }] 
                }
            ]
        });

        if (!order) {
            return res.status(404).send('Order not found');
        }

        // คำนวณยอดเงินต่างๆ
        const itemsTotal = order.orderDetails.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
        const grandTotal = itemsTotal;

        res.render('management/orders/order_detail', {
            order: order,
            itemsTotal: itemsTotal,
            grandTotal: grandTotal,
            activePage: 'orders',
            userName: req.session.userName,
            userEmail: req.session.userEmail
        });

    } catch (err) {
        console.error("🔥 Error fetching order details:", err);
        res.status(500).send("Server Error");
    }
};