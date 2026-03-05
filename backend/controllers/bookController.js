const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const db = require('../models');

const defaultImages = new Set(['default_book.png']);

function removeOldImage(imageName) {
  if (!imageName || defaultImages.has(imageName)) return;
  const filePath = path.join(__dirname, '../public/images', imageName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

exports.listBooks = async (req, res) => {
  try {
    const limit = Number(req.query.limit || 12);
    const page = Number(req.query.page || 1);
    const offset = (page - 1) * limit;

    const where = {};

    if (req.query.search) {
      where.title = { [Op.like]: `%${req.query.search}%` };
    }

    if (req.query.category && req.query.category !== 'all') {
      where.category_id = req.query.category;
    }

    if (req.query.status) {
      where.book_status = req.query.status;
    }

    if (req.query.onlyAvailable === '1') {
      where.book_status = 'Available';
    }

    const { count, rows } = await db.books.findAndCountAll({
      where,
      include: [{ model: db.category, attributes: ['category_id', 'category_name'] }],
      limit,
      offset,
      order: [['book_id', 'DESC']]
    });

    res.json({
      success: true,
      books: rows,
      totalItems: count,
      totalPages: Math.max(1, Math.ceil(count / limit)),
      currentPage: page,
      limit
    });
  } catch (error) {
    console.error('listBooks error:', error);
    res.status(500).json({ success: false, message: 'Failed to list books' });
  }
};

exports.getBookById = async (req, res) => {
  try {
    const book = await db.books.findByPk(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    return res.json({ success: true, book });
  } catch (error) {
    console.error('getBookById error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get book' });
  }
};

exports.createBook = async (req, res) => {
  try {
    const { title, author, price, stock_quantity, category_id } = req.body;

    const existing = await db.books.findOne({ where: { title } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Book title already exists' });
    }

    const stock = Number(stock_quantity || 0);
    const calculatedStatus = stock > 0 ? 'Available' : 'Out of Stock';

    const created = await db.books.create({
      title,
      author,
      price,
      stock_quantity: stock,
      book_status: calculatedStatus,
      category_id,
      book_img: req.file ? req.file.filename : 'default_book.png'
    });

    return res.status(201).json({ success: true, book: created });
  } catch (error) {
    console.error('createBook error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create book' });
  }
};

exports.updateBook = async (req, res) => {
  try {
    const current = await db.books.findByPk(req.params.id);
    if (!current) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    const { title, author, price, stock_quantity, category_id } = req.body;
    const stock = Number(stock_quantity || 0);
    const calculatedStatus = stock > 0 ? 'Available' : 'Out of Stock';

    const updateData = {
      title,
      author,
      price,
      stock_quantity: stock,
      book_status: calculatedStatus,
      category_id
    };

    if (req.file) {
      updateData.book_img = req.file.filename;
      removeOldImage(current.book_img);
    }

    await db.books.update(updateData, { where: { book_id: req.params.id } });
    const updated = await db.books.findByPk(req.params.id);

    return res.json({ success: true, book: updated });
  } catch (error) {
    console.error('updateBook error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update book' });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const target = await db.books.findByPk(req.params.id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    removeOldImage(target.book_img);
    await db.books.destroy({ where: { book_id: req.params.id } });

    return res.json({ success: true, message: 'Book deleted successfully' });
  } catch (error) {
    console.error('deleteBook error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete book' });
  }
};
