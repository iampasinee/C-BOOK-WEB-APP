const path = require('path');
const bcrypt = require('bcryptjs');
const { books, category, users, orders, order_details } = require('../models');

const seedDatabase = async () => {
  try {
    // ==========================================
    // 1. หมวดหมู่ (Categories)
    // ==========================================
    const categories = await category.bulkCreate([
      { category_id: 1, category_name: 'Fiction' },
      { category_id: 2, category_name: 'Manga & Illustration' },
      { category_id: 3, category_name: 'Technology' },
      { category_id: 4, category_name: 'Finance & Investment' },
      { category_id: 5, category_name: 'Health & Wellness' },
      { category_id: 6, category_name: 'Cooking & Food' },
      { category_id: 7, category_name: 'Novel' },
    ], { ignoreDuplicates: true });
    console.log('Categories seeded!');

    // ==========================================
    // 2. หนังสือ (Books)
    // ==========================================
    const booksData = [
      // Fiction
      { title: 'Dune', author: 'Frank Herbert', price: 550, stock_quantity: 15, book_status: 'Available', book_img: 'Dune.jpg', category_id: 1 },
      { title: 'Oppenheimer', author: 'Kai Bird', price: 890, stock_quantity: 5, book_status: 'Available', book_img: 'Oppenheimer.jpg', category_id: 1 },
      { title: 'The Godfather', author: 'Mario Puzo', price: 380, stock_quantity: 8, book_status: 'Available', book_img: 'The Godfather.jpg', category_id: 1 },
      { title: 'Blade Runner', author: 'Philip K. Dick', price: 350, stock_quantity: 12, book_status: 'Available', book_img: 'Blade Runner.jpg', category_id: 1 },
      // Novel 
      { title: 'The Midnight Library', author: 'Matt Haig', price: 380, stock_quantity: 20, book_status: 'Available', book_img: 'The Midnight Library.jpg', category_id: 7 },
      { title: 'The Alchemist', author: 'Paulo Coelho', price: 350, stock_quantity: 10, book_status: 'Available', book_img: 'The Alchemist.jpg', category_id: 7 },
      { title: 'Normal People', author: 'Sally Rooney', price: 420, stock_quantity: 10, book_status: 'Available', book_img: 'Normal People.png', category_id: 7 },
      { title: 'The Seven Husbands of Evelyn Hugo', author: 'Taylor Jenkins Reid', price: 450, stock_quantity: 7, book_status: 'Available', book_img: 'The Seven Husbands of Evelyn Hugo.jpg', category_id: 7 },
      // Manga & Illustration
      { title: 'Jujutsu Kaisen, Vol. 24', author: 'Gege Akutami', price: 280, stock_quantity: 100, book_status: 'Available', book_img: 'Jujutsu Kaisen, Vol. 24.jpg', category_id: 2 },
      { title: 'Demon Slayer, Vol. 1', author: 'Koyoharu Gotouge', price: 280, stock_quantity: 50, book_status: 'Available', book_img: 'Demon Slayer, Vol. 1.jpg', category_id: 2 },
      { title: 'Spy x Family, Vol. 2', author: 'Tatsuya Endo', price: 280, stock_quantity: 40, book_status: 'Available', book_img: 'Spy x Family, Vol. 2.jpg', category_id: 2 },
      { title: 'Blue Lock, Vol. 1', author: 'Muneyuki Kaneshiro', price: 280, stock_quantity: 60, book_status: 'Available', book_img: 'Blue Lock, Vol. 1.jpg', category_id: 2 },
      { title: 'Blue Period, Vol. 1', author: 'Tsubasa Yamaguchi', price: 280, stock_quantity: 30, book_status: 'Available', book_img: 'Blue Period, Vol. 1.jpg', category_id: 2 },
      { title: 'My Hero Academia, Vol. 38', author: 'Kohei Horikoshi', price: 280, stock_quantity: 45, book_status: 'Available', book_img: 'My Hero Academia, Vol. 38.jpg', category_id: 2 },
      // Technology
      { title: 'Clean Code', author: 'Robert C. Martin', price: 950, stock_quantity: 20, book_status: 'Available', book_img: 'Clean Code.jpg', category_id: 3 },
      { title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', price: 1650, stock_quantity: 10, book_status: 'Available', book_img: 'Designing Data-Intensive Applications.jpg', category_id: 3 },
      { title: 'The Pragmatic Programmer', author: 'Andrew Hunt', price: 1250, stock_quantity: 15, book_status: 'Available', book_img: 'The Pragmatic Programmer.jpg', category_id: 3 },
      { title: 'You Don\'t Know JS', author: 'Kyle Simpson', price: 750, stock_quantity: 25, book_status: 'Available', book_img: 'You Don\'t Know JS.jpg', category_id: 3 },
      // Finance & Investment
      { title: 'The Psychology of Money', author: 'Morgan Housel', price: 420, stock_quantity: 50, book_status: 'Available', book_img: 'The Psychology of Money.webp', category_id: 4 },
      { title: 'Rich Dad Poor Dad', author: 'Robert Kiyosaki', price: 350, stock_quantity: 40, book_status: 'Available', book_img: 'Rich Dad Poor Dad.jpg', category_id: 4 },
      { title: 'The Intelligent Investor', author: 'Benjamin Graham', price: 650, stock_quantity: 15, book_status: 'Available', book_img: 'The Intelligent Investor.webp', category_id: 4 },
      { title: 'Principles', author: 'Ray Dalio', price: 950, stock_quantity: 12, book_status: 'Available', book_img: 'Principles.jpg', category_id: 4 },
      // Health & Wellness
      { title: 'Why We Sleep', author: 'Matthew Walker', price: 550, stock_quantity: 22, book_status: 'Available', book_img: 'Why We Sleep.jpg', category_id: 5 },
      { title: 'Ikigai', author: 'Héctor García', price: 350, stock_quantity: 30, book_status: 'Available', book_img: 'Ikigai.jpg', category_id: 5 },
      // Cooking & Food
      { title: 'The Flavor Bible', author: 'Karen Page', price: 1450, stock_quantity: 5, book_status: 'Available', book_img: 'The Flavor Bible.jpg', category_id: 6 },
    ];
    await books.bulkCreate(booksData);
    console.log(' Books seeded!');

    // ==========================================
    // 3. ผู้ใช้งาน (Users)
    // ==========================================
    // เข้ารหัสผ่านเตรียมไว้
    const hashedUserPass = await bcrypt.hash('123456', 10);
    const hashedAdminCPass = await bcrypt.hash('admin123456', 10);
    
    const usersData = [
      { user_id: 1, user_name: 'pasinee', user_email: 'pasinee@cbook.com', password: hashedUserPass, user_role: 'member', user_status: 'active' },
      { user_id: 3, user_name: 'AdminC-Book', user_email: 'admin.c@cbook.com', password: hashedAdminCPass, user_role: 'admin', user_status: 'active' },
      { user_id: 4, user_name: 'pimpa', user_email: 'pimpa.p@exam.com', password: hashedUserPass, user_role: 'member', user_status: 'active' },
      { user_id: 6, user_name: 'Admin sale', user_email: 'admin@cbook.com', password: hashedUserPass, user_role: 'admin', user_status: 'active' },
      { user_id: 7, user_name: 'pornyanee', user_email: 'pornyanee@gmail.com', password: hashedUserPass, user_role: 'member', user_status: 'active' },
      { user_id: 8, user_name: 'jj@gmail.com', user_email: 'jj@gmail.com', password: hashedUserPass, user_role: 'member', user_status: 'active' },
      { user_id: 9, user_name: 'Phiyada', user_email: 'phiyada@gmail.com', password: hashedUserPass, user_role: 'member', user_status: 'active' },
      { user_id: 10, user_name: 'Montakan', user_email: 'Montakan@gmail.com', password: hashedUserPass, user_role: 'member', user_status: 'active' },
    ];
    await users.bulkCreate(usersData, { ignoreDuplicates: true });
    console.log('Users seeded!');

    // ==========================================
    // 4. ข้อมูลการสั่งซื้อ (Orders)
    // ==========================================
    const ordersData = [
      { order_id: 1, status: 'delivered', user_id: 1 },
      { order_id: 2, status: 'delivered', user_id: 1 },
      { order_id: 3, status: 'delivered', user_id: 4 },
      { order_id: 4, status: 'delivered', user_id: 7 },
      { order_id: 5, status: 'delivered', user_id: 7 },
      { order_id: 6, status: 'delivered', user_id: 7 },
      { order_id: 7, status: 'delivered', user_id: 7 },
      { order_id: 8, status: 'delivered', user_id: 9 },
      { order_id: 9, status: 'delivered', user_id: 10 },
      { order_id: 10, status: 'delivered', user_id: 7 },
    ];
    await orders.bulkCreate(ordersData, { ignoreDuplicates: true });
    console.log(' Orders seeded!');

    // ==========================================
    // 5. รายละเอียดการสั่งซื้อ (Order Details)
    // ==========================================
    const orderDetailsData = [
      { detail_id: 1, quantity: 2, unit_price: 280, order_id: 1, book_id: 14 },
      { detail_id: 2, quantity: 1, unit_price: 280, order_id: 1, book_id: 11 },
      { detail_id: 3, quantity: 1, unit_price: 280, order_id: 2, book_id: 11 },
      { detail_id: 4, quantity: 1, unit_price: 420, order_id: 3, book_id: 19 },
      { detail_id: 5, quantity: 1, unit_price: 350, order_id: 3, book_id: 6 },
      { detail_id: 6, quantity: 1, unit_price: 1450, order_id: 4, book_id: 25 },
      { detail_id: 7, quantity: 2, unit_price: 380, order_id: 4, book_id: 5 },
      { detail_id: 8, quantity: 1, unit_price: 420, order_id: 5, book_id: 19 },
      { detail_id: 9, quantity: 1, unit_price: 350, order_id: 5, book_id: 6 },
      { detail_id: 10, quantity: 1, unit_price: 1650, order_id: 6, book_id: 16 },
      { detail_id: 11, quantity: 1, unit_price: 280, order_id: 6, book_id: 11 },
      { detail_id: 12, quantity: 2, unit_price: 280, order_id: 7, book_id: 14 },
      { detail_id: 13, quantity: 1, unit_price: 280, order_id: 7, book_id: 13 },
      { detail_id: 14, quantity: 1, unit_price: 750, order_id: 8, book_id: 18 },
      { detail_id: 15, quantity: 1, unit_price: 420, order_id: 8, book_id: 7 },
      { detail_id: 16, quantity: 1, unit_price: 350, order_id: 8, book_id: 6 },
      { detail_id: 17, quantity: 2, unit_price: 420, order_id: 9, book_id: 19 },
      { detail_id: 18, quantity: 2, unit_price: 280, order_id: 10, book_id: 11 },
      { detail_id: 19, quantity: 1, unit_price: 280, order_id: 10, book_id: 10 },
    ];
    await order_details.bulkCreate(orderDetailsData, { ignoreDuplicates: true });
    console.log('Order Details seeded!');

    console.log('All databases seeded successfully!');
    process.exit();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();