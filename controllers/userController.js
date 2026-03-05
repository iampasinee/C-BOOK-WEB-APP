const db = require('../models');
const { users } = db;
const { Op } = require('sequelize');

// [GET] หน้าตารางจัดการผู้ใช้งาน (Admin)
exports.renderUserList = async (req, res) => {
    try {
        const searchQuery = req.query.search || '';
        // 🚨 กำหนดค่าเริ่มต้นเป็น member หากไม่มีการส่งค่ามา
        const roleFilter = req.query.role !== undefined ? req.query.role : 'member'; 
        const page = parseInt(req.query.page) || 1;
        const limit = 6;

        let whereCondition = {};

        // 1. เงื่อนไข Role (ถ้าเลือกเป็นค่าว่างจะดึงทั้งหมด แต่ในที่นี้เราเริ่มที่ member)
        if (roleFilter) {
            whereCondition.user_role = roleFilter;
        }

        // 2. เงื่อนไขการค้นหา (รวมกับ Role)
        if (searchQuery) {
            whereCondition[Op.and] = [
                { user_role: roleFilter }, // ต้องอยู่ใน Role ที่เลือกด้วย
                {
                    [Op.or]: [
                        { user_name: { [Op.like]: `%${searchQuery}%` } },
                        { user_email: { [Op.like]: `%${searchQuery}%` } }
                    ]
                }
            ];
        }

        const { count, rows: allUsers } = await users.findAndCountAll({
            where: whereCondition,
            limit: limit,
            offset: (page - 1) * limit,
            order: [['user_id', 'DESC']]
        });

        // นับจำนวนภาพรวมระบบ (ไม่เปลี่ยนตาม Filter)
        const totalUsersCount = await users.count();
        const totalAdminCount = await users.count({ where: { user_role: 'admin' } });
        const totalMemberCount = await users.count({ where: { user_role: 'member' } });

        const totalPages = Math.ceil(count / limit);

        if (req.xhr) {
            return res.json({
                users: allUsers,
                totalItems: count, // จำนวนที่กรองได้จริง
                totalPages,
                currentPage: page,
                limit,
                totalUsersCount,
                totalAdminCount,
                totalMemberCount
            });
        }

        res.render("management/user/list_users", {
            users: allUsers,
            totalPages,
            currentPage: page,
            totalItems: count,
            limit,
            searchQuery,
            filterRole: roleFilter,
            totalUsersCount,
            totalAdminCount,
            totalMemberCount,
            activePage: 'members'
        });
    } catch (err) {
        console.error("🔥 Error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

// [PUT] แก้ไขสิทธิ์ผู้ใช้ (Role)
exports.changeUserRole = async (req, res) => {
    try {
        const userId = req.params.id;
        const { role } = req.body; // รับค่า 'admin' หรือ 'member' จาก Frontend

        // ป้องกันไม่ให้ Admin เปลี่ยนสิทธิ์ตัวเอง (ป้องกันระบบพังแล้วไม่มี Admin เหลือ)
        if (req.session.userId.toString() === userId.toString()) {
            return res.status(403).json({ success: false, message: "You cannot change your own role." });
        }

        await db.users.update(
            { user_role: role }, 
            { where: { user_id: userId } }
        );

        res.json({ success: true, message: 'Role updated successfully' });
    } catch (error) {
        console.error("Error changing role:", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// [DELETE] ลบผู้ใช้
exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // ป้องกันไม่ให้ Admin ลบตัวเอง
        if (req.session.userId.toString() === userId.toString()) {
            return res.status(403).json({ success: false, message: "You cannot delete yourself." });
        }

        await db.users.destroy({ where: { user_id: userId } });

        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};