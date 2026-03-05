const db = require('../models');
const { Op } = require('sequelize');

exports.listOrders = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const offset = (page - 1) * limit;

    const searchQuery = req.query.search || '';
    const statusFilter = req.query.status || '';

    const where = {};
    if (statusFilter) where.status = statusFilter;
    if (searchQuery && !Number.isNaN(Number(searchQuery))) where.order_id = Number(searchQuery);

    const { count, rows } = await db.order.findAndCountAll({
      where,
      include: [
        {
          model: db.users,
          attributes: ['user_name', 'user_email'],
          where: searchQuery && Number.isNaN(Number(searchQuery))
            ? { user_name: { [Op.like]: `%${searchQuery}%` } }
            : undefined
        },
        { model: db.orderDetail, attributes: ['quantity', 'unit_price'] }
      ],
      order: [['order_date', 'DESC']],
      limit,
      offset,
      distinct: true
    });

    const orders = rows.map((o) => {
      const total_amount = o.orderDetails.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
      const total_items = o.orderDetails.reduce((sum, item) => sum + item.quantity, 0);

      return {
        order_id: o.order_id,
        order_date: o.order_date,
        status: o.status,
        user_name: o.user ? o.user.user_name : 'Unknown User',
        total_amount,
        total_items
      };
    });

    return res.json({
      success: true,
      orders,
      totalItems: count,
      totalPages: Math.max(1, Math.ceil(count / limit)),
      currentPage: page,
      limit
    });
  } catch (error) {
    console.error('listOrders error:', error);
    return res.status(500).json({ success: false, message: 'Failed to list orders' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await db.order.findByPk(req.params.id, {
      include: [
        { model: db.users, attributes: ['user_name', 'user_email'] },
        { model: db.orderDetail, include: [{ model: db.books, attributes: ['title', 'book_img'] }] }
      ]
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const itemsTotal = order.orderDetails.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

    return res.json({
      success: true,
      order,
      itemsTotal,
      grandTotal: itemsTotal
    });
  } catch (error) {
    console.error('getOrderById error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get order' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    await db.order.update({ status: req.body.status }, { where: { order_id: req.params.id } });
    return res.json({ success: true, message: 'Status updated successfully' });
  } catch (error) {
    console.error('updateOrderStatus error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update status' });
  }
};

exports.checkout = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const userId = req.authUser.userId;
    const cart = Array.isArray(req.body.cart) ? req.body.cart : [];

    if (!cart.length) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const newOrder = await db.order.create(
      { user_id: userId, status: 'delivered', order_date: new Date() },
      { transaction }
    );

    for (const item of cart) {
      await db.orderDetail.create(
        {
          order_id: newOrder.order_id,
          book_id: Number(item.bookId),
          quantity: Number(item.quantity),
          unit_price: Number(item.price)
        },
        { transaction }
      );

      await db.books.decrement('stock_quantity', {
        by: Number(item.quantity),
        where: { book_id: Number(item.bookId) },
        transaction
      });

      const updatedBook = await db.books.findByPk(item.bookId, { transaction });
      if (updatedBook && updatedBook.stock_quantity <= 0) {
        await updatedBook.update({ book_status: 'Out of Stock' }, { transaction });
      }
    }

    await transaction.commit();
    return res.status(201).json({ success: true, orderId: newOrder.order_id });
  } catch (error) {
    await transaction.rollback();
    console.error('checkout error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process checkout' });
  }
};
