const path = require('path');
const { books, category } = require('../models');

const seedDatabase = async () => {
  try {
    // 1. เคลียร์ข้อมูลเก่า (ถ้าต้องการ) และสร้างหมวดหมู่
    const categories = await category.bulkCreate([
      { category_id: 1, category_name: 'Fiction' },
      { category_id: 2, category_name: 'Manga & Illustration' },
      { category_id: 3, category_name: 'Technology' },
      { category_id: 4, category_name: 'Finance & Investment' },
      { category_id: 5, category_name: 'Health & Wellness' },
      { category_id: 6, category_name: 'Cooking & Food' },
      { category_id: 7, category_name: 'Novel' },
    ], { ignoreDuplicates: true });

    // 2. ข้อมูลหนังสือตามรูปภาพ (ชื่อไฟล์ตรงตามภาพ image_d5b862.jpg)
    const booksData = [
      // Fiction
      { title: 'Dune', author: 'Frank Herbert', price: 550, stock_quantity: 15, book_status: 'Available', book_img: 'Dune.jpg', category_id: 1 },
      { title: 'Oppenheimer', author: 'Kai Bird', price: 890, stock_quantity: 5, book_status: 'Available', book_img: 'Oppenheimer.jpg', category_id: 1 },
      { title: 'The Godfather', author: 'Mario Puzo', price: 380, stock_quantity: 8, book_status: 'Available', book_img: 'The Godfather.jpg', category_id: 1 },
      { title: 'Blade Runner', author: 'Philip K. Dick', price: 350, stock_quantity: 12, book_status: 'Available', book_img: 'Blade Runner.jpg', category_id: 1 },

      //Novel 
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
    console.log('Seed completed successfully!');
    process.exit();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();