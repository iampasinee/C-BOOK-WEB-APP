const db = require('../models');
const { Op } = require('sequelize');

exports.dashboard = async (req, res) => {
  try {
    const totalBooks = await db.books.count();
    const totalUsers = await db.users.count({ where: { user_role: 'member' } });
    const totalOrders = await db.order.count();
    const orderDetails = await db.orderDetail.findAll();

    const totalSales = orderDetails.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    const totalBooksSold = orderDetails.reduce((sum, item) => sum + item.quantity, 0);

    const recentOrdersRaw = await db.order.findAll({
      limit: 5,
      order: [['order_date', 'DESC']],
      include: [
        { model: db.users, attributes: ['user_name'] },
        { model: db.orderDetail, attributes: ['quantity', 'unit_price'] }
      ],
      distinct: true
    });

    const recentOrders = recentOrdersRaw.map((o) => ({
      order_id: o.order_id,
      order_date: o.order_date,
      status: o.status,
      user_name: o.user ? o.user.user_name : 'Unknown',
      total_items: o.orderDetails.reduce((sum, item) => sum + item.quantity, 0),
      total_amount: o.orderDetails.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
    }));

    return res.json({
      success: true,
      totalBooks,
      totalUsers,
      totalOrders,
      totalSales,
      totalBooksSold,
      recentOrders
    });
  } catch (error) {
    console.error('dashboard report error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load dashboard' });
  }
};

exports.salesByCategory = async (req, res) => {
  try {
    const orderDetails = await db.orderDetail.findAll({
      include: [
        { model: db.order, where: { status: { [Op.ne]: 'cancelled' } }, attributes: ['status'] },
        { model: db.books, include: [{ model: db.category, attributes: ['category_id', 'category_name'] }] }
      ]
    });

    const categorySales = {};

    for (const item of orderDetails) {
      const cat = item.book && item.book.category ? item.book.category : null;
      const categoryId = cat ? cat.category_id : 'uncategorized';
      const categoryName = cat ? cat.category_name : 'Uncategorized';

      if (!categorySales[categoryId]) {
        categorySales[categoryId] = { id: categoryId, name: categoryName, totalQty: 0, totalRevenue: 0 };
      }

      categorySales[categoryId].totalQty += item.quantity;
      categorySales[categoryId].totalRevenue += item.quantity * Number(item.unit_price);
    }

    const reportData = Object.values(categorySales).sort((a, b) => b.totalQty - a.totalQty);
    const grandTotalQty = reportData.reduce((sum, item) => sum + item.totalQty, 0);
    const grandTotalRevenue = reportData.reduce((sum, item) => sum + item.totalRevenue, 0);

    return res.json({ success: true, reportData, grandTotalQty, grandTotalRevenue });
  } catch (error) {
    console.error('salesByCategory error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load sales report' });
  }
};

exports.salesByCategoryDetail = async (req, res) => {
  try {
    const categoryId = req.params.id;
    let categoryName = 'Uncategorized';

    if (categoryId !== 'uncategorized') {
      const category = await db.category.findByPk(categoryId);
      if (category) categoryName = category.category_name;
    }

    const orderDetails = await db.orderDetail.findAll({
      include: [
        { model: db.order, where: { status: { [Op.ne]: 'cancelled' } }, attributes: ['status'] },
        {
          model: db.books,
          where: categoryId !== 'uncategorized' ? { category_id: categoryId } : { category_id: null },
          attributes: ['book_id', 'title']
        }
      ]
    });

    const bookSales = {};

    for (const item of orderDetails) {
      const bookId = item.book.book_id;
      if (!bookSales[bookId]) {
        bookSales[bookId] = { id: bookId, title: item.book.title, qty: 0, revenue: 0 };
      }

      bookSales[bookId].qty += item.quantity;
      bookSales[bookId].revenue += item.quantity * Number(item.unit_price);
    }

    const reportData = Object.values(bookSales).sort((a, b) => b.revenue - a.revenue);
    const grandTotalQty = reportData.reduce((sum, item) => sum + item.qty, 0);
    const grandTotalRevenue = reportData.reduce((sum, item) => sum + item.revenue, 0);

    return res.json({ success: true, categoryName, reportData, grandTotalQty, grandTotalRevenue });
  } catch (error) {
    console.error('salesByCategoryDetail error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load detail report' });
  }
};

exports.inventoryStatus = async (req, res) => {
  try {
    const categories = await db.category.findAll({ order: [['category_name', 'ASC']] });
    const books = await db.books.findAll({
      include: [{ model: db.category, attributes: ['category_name'] }],
      order: [['stock_quantity', 'ASC']]
    });

    const reportData = books.map((book) => {
      let statusName = 'In Stock';
      let statusCode = 'in-stock';

      if (book.stock_quantity === 0) {
        statusName = 'Out of Stock';
        statusCode = 'out-of-stock';
      } else if (book.stock_quantity <= 10) {
        statusName = 'Low Stock';
        statusCode = 'low-stock';
      }

      return {
        id: book.book_id,
        title: book.title,
        category: book.category ? book.category.category_name : 'Uncategorized',
        categoryId: book.category_id,
        stock: book.stock_quantity,
        statusName,
        statusCode
      };
    });

    return res.json({ success: true, categories, reportData, totalBooks: reportData.length });
  } catch (error) {
    console.error('inventoryStatus error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load inventory report' });
  }
};
