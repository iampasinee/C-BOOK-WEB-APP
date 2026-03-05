const db = require('../models');
const fs = require('fs');
const path = require('path');
const { books, category } = db;
const { Op } = require('sequelize');



// ============================================================
// --- Frontend Render: CRUD page ---
// ============================================================

// [GET] หน้าแสดงรายการหนังสือทั้งหมด
exports.renderHomePage = async (req, res) => {
    try {
        const limit = 12; // แสดง 12 เล่มต่อหน้า
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;
        const searchQuery = req.query.search || '';
        const categoryFilter = req.query.category || 'all';

        // 1. สร้างเงื่อนไขการดึงข้อมูล (เอาเฉพาะที่พร้อมขาย และตรงกับคำค้นหา)
        let whereCondition = { book_status: 'Available' };

        // เช็กคำค้นหา
        if (req.query.search) {
            whereCondition.title = { [Op.like]: `%${req.query.search}%` };
        }

        // เช็กหมวดหมู่ (ถ้าไม่ใช่ 'all')
        if (req.query.category && req.query.category !== 'all') {
            whereCondition.category_id = categoryFilter;
        }

        // 2. ดึงหนังสือมาพร้อมหมวดหมู่
        const { count, rows: allBooks } = await books.findAndCountAll({
            where: whereCondition,
            include: [{ model: category, attributes: ['category_name'] }],
            limit: limit,
            offset: offset,
            order: [['book_id', 'DESC']]
        });

        const allCategories = await db.category.findAll({
            order: [['category_name', 'ASC']]
        });

        const totalPages = Math.ceil(count / limit);
        const userLoggedIn = req.session && req.session.userId ? true : false;

        // 3. 🚨 ถ้าเป็นการค้นหาผ่านช่อง Search (AJAX) ให้ส่งเป็น JSON
        if (req.xhr) {
            return res.json({
                books: allBooks,
                currentPage: page,
                totalPages: totalPages,
                userLoggedIn: userLoggedIn
            });
        }

        // 4. ถ้าโหลดหน้าเว็บปกติ
        res.render('home', {
            books: allBooks,
            categories: allCategories, 
            currentCategory: categoryFilter,
            currentPage: page,
            totalPages: totalPages,
            searchQuery: searchQuery,
            userLoggedIn: userLoggedIn,
            cartCount: req.session.cartCount || 0,
            userName: req.session ? req.session.userName : null
        });

    } catch (err) {
        console.error("🔥 Error rendering home page:", err);
        res.status(500).send('Error loading store');
    }
};











// --- Delete Image ---
const defaultImages = [
    'default_book.png',
    'The Alchemis.jpg', 'Dune.jpg', 'Oppenheimer.jpg', 'The Godfather.jpg',
    'Blade Runner.jpg', 'The Midnight Library.jpg', 'Normal People.png',
    'The Seven Husbands of Evelyn Hugo.jpg', 'Jujutsu Kaisen, Vol. 24.jpg',
    'Demon Slayer, Vol. 1.jpg', 'Spy x Family, Vol. 2.jpg', 'Blue Lock, Vol. 1.jpg',
    'Blue Period, Vol. 1.jpg', 'My Hero Academia, Vol. 38.jpg', 'Clean Code.jpg',
    'Designing Data-Intensive Applications.jpg', 'The Pragmatic Programmer.jpg',
    'You Don\'t Know JS.jpg', 'The Psychology of Money.webp', 'Rich Dad Poor Dad.jpg',
    'The Intelligent Investor.webp', 'Principles.jpg', 'Why We Sleep.jpg',
    'Ikigai.jpg', 'The Flavor Bible.jpg'
];

const deleteOldImage = (imageName) => {
    if (imageName && !defaultImages.includes(imageName)) {
        // เช็ค Path: ถ้า controller อยู่ในโฟลเดอร์ controllers ต้องถอยออก 1 ชั้น (..) ไปหา public
        const filePath = path.join(__dirname, '../public/images/', imageName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Deleted unused image: ${imageName}`);
        }
    }
};


// ============================================================
// --- Frontend Render: ส่งข้อมูลไปแสดงที่ EJS ---
// ============================================================

// [GET] หน้า Dashboard หลัก (Management)
exports.renderManagement = async (req, res) => {
    try {
        res.render("management", { activePage: 'home', userName: req.session.userName, userEmail: req.session.userEmail });
    } catch (err) {
        console.error("🔥 Error rendering management page:", err);
        res.status(500).send('Error rendering management page');
    }
};

// [GET] หน้าตารางจัดการหนังสือ (Admin)
exports.renderBookList = async (req, res) => {
    try {
        const searchQuery = req.query.search || '';
        const catId = req.query.category || '';
        const status = req.query.status || '';
        const page = parseInt(req.query.page) || 1;
        const limit = 6;

        let whereCondition = {};

        if (searchQuery) {
            whereCondition.title = {
                [Op.like]: `%${searchQuery}%`
            };
        }

        if (catId) whereCondition.category_id = catId;
        if (status) whereCondition.book_status = status;

        const { count, rows: allBooks } = await books.findAndCountAll({
            where: whereCondition,
            include: [{
                model: category,
                attributes: ['category_id', 'category_name']
            }],
            limit: limit,
            offset: (page - 1) * limit,
            order: [['book_id', 'DESC']]
        });

        const totalPages = Math.ceil(count / limit);

        if (req.xhr) {
            return res.json({
                books: allBooks,
                totalItems: count,
                totalPages: totalPages,
                currentPage: page,
                limit: limit
            });
        }

        const categories = await category.findAll({ attributes: ['category_id', 'category_name'] });
        const totalBooksCount = await books.count();

        res.render("management/book/list_books", {
            books: allBooks,
            categories,
            totalPages,
            currentPage: page,
            totalItems: count,
            limit,
            searchQuery,
            filterCategory: catId,
            filterStatus: status,
            totalBooksCount,
            activePage: 'books',
            userName: req.session.userName,
            userEmail: req.session.userEmail
        });

    } catch (err) {
        console.error("🔥 Optimization Error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

// [GET] หน้าฟอร์มเพิ่มหนังสือ
exports.renderCreateForm = async (req, res) => {
    try {
        const categories = await category.findAll({ order: [['category_name', 'ASC']] });
        res.render("management/book/create_book", {
            categories,
            activePage: 'books',
            userName: req.session.userName,
            userEmail: req.session.userEmail
        });
    } catch (err) {
        console.error("🔥 Error renderCreateForm:", err);
        res.status(500).send('Error rendering create form');
    }
};

// [GET] หน้าฟอร์มแก้ไขหนังสือ
exports.renderUpdateForm = async (req, res) => {
    try {
        const bookId = req.params.id;
        const [book, allCategories] = await Promise.all([
            books.findByPk(bookId),
            category.findAll({ order: [['category_name', 'ASC']] })
        ]);

        if (!book) {
            return res.status(404).send('Book not found');
        }

        res.render("management/book/edit_book", {
            book: book,
            categories: allCategories,
            activePage: 'books',
            currentPage: req.query.page || 1,
            searchQuery: req.query.search || '',
            filterCategory: req.query.category || '',
            filterStatus: req.query.status || '',
            userName: req.session.userName,
            userEmail: req.session.userEmail
        });
    } catch (err) {
        console.error("🔥 Error renderEdit:", err);
        res.status(500).send('Error rendering edit page');
    }
};

// ============================================================
// --- Form Handlers: รับข้อมูลจาก EJS มาบันทึกลง Database ---
// ============================================================

// [POST] บันทึกหนังสือใหม่
exports.handleCreate = async (req, res) => {
    try {
        let { title, author, price, stock_quantity, category_id } = req.body;

        const existingBook = await books.findOne({ where: { title: title } });

        if (existingBook) {
            const categories = await category.findAll({ order: [['category_name', 'ASC']] });
            return res.render("management/book/create_book", {
                categories: categories,
                activePage: 'books',
                errorMessage: `The book title "${title}" already exists.`
            });
        }

        const stock = parseInt(stock_quantity) || 0;
        const calculatedStatus = stock === 0 ? 'Out of Stock' : 'Available';

        // 1. จัดการชื่อไฟล์รูปภาพ ถ้าไม่มีส่งมาให้ใช้ default_book.png
        const uploadedImg = req.file ? req.file.filename : 'default_book.png';

        await books.create({
            title,
            author,
            price,
            stock_quantity: stock,
            book_status: calculatedStatus,
            category_id,
            book_img: uploadedImg //2. เพิ่มฟิลด์รูปภาพตอนบันทึก
        });

        res.redirect('/management/books');
    } catch (err) {
        console.error("🔥 Error handleCreate:", err);
        res.status(500).send('Error creating book');
    }
};

// [POST] บันทึกการแก้ไข
exports.handleUpdate = async (req, res) => {
    try {
        const bookId = req.params.id;
        let { title, author, price, stock_quantity, category_id } = req.body;

        const stock = parseInt(stock_quantity) || 0;
        const calculatedStatus = stock === 0 ? 'Out of Stock' : 'Available';

        // 🚨 บรรทัดนี้แหละครับที่หายไป! ต้องดึงข้อมูลหนังสือเดิมมาก่อนเพื่อเอาชื่อรูปไปลบ
        const currentBook = await books.findByPk(bookId);

        if (!currentBook) {
            return res.status(404).send('Book not found');
        }

        let updateData = {
            title,
            author,
            price,
            stock_quantity: stock,
            book_status: calculatedStatus,
            category_id
        };

        // 🚨 เช็กว่ามีการอัปโหลดรูปใหม่เข้ามาหรือไม่
        if (req.file) {
            updateData.book_img = req.file.filename;

            // ลบรูปภาพเก่าทิ้งออกจากเซิร์ฟเวอร์
            deleteOldImage(currentBook.book_img);
        }

        // อัปเดตข้อมูลลงฐานข้อมูล
        await books.update(updateData, { where: { book_id: bookId } });

        // Redirect กลับหน้าเดิม
        const { page, search, category: cat, status } = req.body;
        res.redirect(`/management/books?page=${page || 1}&search=${encodeURIComponent(search || '')}&category=${encodeURIComponent(cat || '')}&status=${encodeURIComponent(status || '')}`);

    } catch (err) {
        console.error("🔥 Error handleUpdate:", err);
        res.status(500).send('Error updating book');
    }
};

// [DELETE] ลบหนังสือ
exports.handleDelete = async (req, res) => {
    try {
        const bookId = req.params.id;

        // --- 1. ค้นหาข้อมูลหนังสือเดิมก่อน เพื่อเอาชื่อไฟล์รูปภาพ ---
        const targetBook = await books.findByPk(bookId);

        if (targetBook) {
            // --- 2. เรียกใช้ฟังก์ชันลบรูปภาพ (ถ้าไม่ใช่รูปตั้งต้น) ---
            deleteOldImage(targetBook.book_img);

            // --- 3. เมื่อลบรูปเสร็จแล้ว ค่อยลบข้อมูลใน Database ---
            await books.destroy({
                where: { book_id: bookId }
            });

            res.status(200).json({ message: 'Deleted successfully' });
        } else {
            res.status(404).json({ message: 'Book not found' });
        }

    } catch (err) {
        console.error("Error handleDelete:", err);
        res.status(500).json({ message: 'Error deleting book' });
    }
};