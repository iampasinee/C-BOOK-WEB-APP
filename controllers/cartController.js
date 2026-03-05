const db = require('../models');

// [POST] กดปุ่ม Add to Cart หน้าเว็บ
exports.addToCart = async (req, res) => {
    try {
        const { bookId } = req.body;
        if (!req.session.cart) req.session.cart = [];

        // ดึงข้อมูลหนังสือจาก DB เพื่อเช็กสต็อก
        const book = await db.books.findByPk(bookId);
        if (!book) return res.status(404).json({ success: false, message: 'Book not found' });

        const existingItemIndex = req.session.cart.findIndex(item => item.bookId === bookId.toString());

        if (existingItemIndex > -1) {
            // 🚨 ถ้ามีแล้ว ให้บวกจำนวนเพิ่ม แต่ต้องไม่เกินสต็อกจริง
            if (req.session.cart[existingItemIndex].quantity < book.stock_quantity) {
                req.session.cart[existingItemIndex].quantity += 1;
            } else {
                return res.json({ success: false, message: 'Not enough stock', isMax: true });
            }
        } else {
            // 🚨 ถ้ายังไม่มี ให้เพิ่มใหม่และจำ maxStock ไว้ด้วย
            if (book.stock_quantity > 0) {
                req.session.cart.push({
                    bookId: book.book_id.toString(),
                    title: book.title,
                    price: parseFloat(book.price),
                    img: book.book_img || 'default_book.png',
                    quantity: 1,
                    maxStock: book.stock_quantity // จำสต็อกสูงสุด
                });
            } else {
                return res.json({ success: false, message: 'Out of stock' });
            }
        }

        const totalItems = req.session.cart.reduce((sum, item) => sum + item.quantity, 0);
        req.session.cartCount = totalItems;

        res.json({ success: true, totalItems: totalItems });
    } catch (err) {
        console.error("Cart Error:", err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// [GET] ดึงข้อมูลตะกร้า
exports.getCart = (req, res) => {
    const cart = req.session.cart || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    res.json({ success: true, cart: cart, totalItems: totalItems, totalPrice: totalPrice });
};

// 🚨 [POST] อัปเดตจำนวนสินค้า (+ / - / ลบ)
exports.updateCart = (req, res) => {
    const { bookId, action } = req.body;
    let cart = req.session.cart || [];
    const index = cart.findIndex(item => item.bookId === bookId.toString());

    if (index > -1) {
        if (action === 'increase' && cart[index].quantity < cart[index].maxStock) {
            cart[index].quantity++;
        } else if (action === 'decrease' && cart[index].quantity > 1) {
            cart[index].quantity--;
        } else if (action === 'remove') {
            cart.splice(index, 1); // ลบออกจากตะกร้า
        }
    }

    req.session.cart = cart;
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    req.session.cartCount = totalItems;

    res.json({ success: true, cart: cart, totalItems: totalItems, totalPrice: totalPrice });
};

// [GET] หน้า Checkout ชำระเงิน
exports.renderCheckout = (req, res) => {
    try {
        const cart = req.session.cart || [];
        
        // ถ้าตะกร้าว่างเปล่า ไม่ให้เข้าหน้า Checkout (เตะกลับหน้า Home)
        if (cart.length === 0) {
            return res.redirect('/');
        }

        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shippingFee = 50; // สมมติค่าส่ง 50 บาท (ปรับเปลี่ยนได้)
        const grandTotal = totalPrice + shippingFee;

        res.render('checkout', {
            cart: cart,
            totalItems: totalItems,
            totalPrice: totalPrice,
            shippingFee: shippingFee,
            grandTotal: grandTotal,
            // ข้อมูลผู้ใช้
            userLoggedIn: true, 
            userName: req.session.userName,
            userEmail: req.session.userEmail,
            cartCount: req.session.cartCount || 0
        });
    } catch (err) {
        console.error("Checkout Render Error:", err);
        res.status(500).send("Error loading checkout page");
    }
};


// [POST] ประมวลผลคำสั่งซื้อเมื่อลูกค้ากด Place Order
exports.processCheckout = async (req, res) => {
    // เริ่มต้น Transaction (เพื่อความปลอดภัย ถ้าเกิด Error กลางทาง ข้อมูลจะถูก Rollback ยกเลิกทั้งหมด)
    const transaction = await db.sequelize.transaction(); 

    try {
        const userId = req.session.userId;
        const cart = req.session.cart || [];
        const { fullName, phone, address, paymentMethod } = req.body;

        // ถ้าตะกร้าว่างเปล่า ให้เด้งกลับหน้าโฮม
        if (cart.length === 0) {
            return res.redirect('/');
        }

        // 1. บันทึกข้อมูลลงตาราง Order (ตารางหลัก)
        const newOrder = await db.order.create({
            user_id: userId,
            status: 'delivered',
            order_date: new Date()
            
        }, { transaction });

        // 2. วนลูปสินค้าในตะกร้า เพื่อบันทึกลงตาราง OrderDetail และ ตัดสต็อก
        for (let item of cart) {
            
            // 2.1 บันทึกรายละเอียดลง OrderDetail
            await db.orderDetail.create({
                order_id: newOrder.order_id,
                book_id: parseInt(item.bookId),
                quantity: parseInt(item.quantity),
                unit_price: parseFloat(item.price)
            }, { transaction });

            // 2.2 ตัดสต็อกสินค้าในตาราง books
            await db.books.decrement('stock_quantity', {
                by: parseInt(item.quantity),
                where: { book_id: parseInt(item.bookId) },
                transaction
            });

            // 2.3 เช็กว่าถ้าตัดสต็อกแล้วเหลือ 0 ให้เปลี่ยนสถานะเป็น Out of Stock อัตโนมัติ
            const updatedBook = await db.books.findByPk(item.bookId, { transaction });
            if (updatedBook && updatedBook.stock_quantity <= 0) {
                await updatedBook.update({ book_status: 'Out of Stock' }, { transaction });
            }
        }

        // 3. ยืนยันการเปลี่ยนแปลงข้อมูลทั้งหมดลงฐานข้อมูล (Commit)
        await transaction.commit();

        // 4. เคลียร์ตะกร้าสินค้าออกจาก Session
        req.session.cart = [];
        req.session.cartCount = 0;

        // 5. สั่งซื้อสำเร็จ เด้งกลับหน้า Home หรือหน้าประวัติการสั่งซื้อ
        // (เราสามารถแนบ query ?success ไปโชว์แจ้งเตือนได้)
        res.redirect('/?success=true');

    } catch (err) {
        // ถ้าระหว่างทำงานมี Error ให้ยกเลิกการบันทึกข้อมูลทั้งหมด (Rollback)
        await transaction.rollback();
        console.error("🔥 Checkout Process Error:", err);
        res.status(500).send("Error processing your order.");
    }
};