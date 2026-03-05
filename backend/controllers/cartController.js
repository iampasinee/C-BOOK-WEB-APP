const db = require('../models');

function summarize(cart) {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
  return { totalItems, totalPrice };
}

exports.getSummary = async (req, res) => {
  const cart = Array.isArray(req.body.cart) ? req.body.cart : [];
  const summary = summarize(cart);
  return res.json({ success: true, cart, ...summary });
};

exports.addToCart = async (req, res) => {
  try {
    const { bookId } = req.body;
    const cart = Array.isArray(req.body.cart) ? req.body.cart : [];

    const book = await db.books.findByPk(bookId);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    const index = cart.findIndex((item) => String(item.bookId) === String(bookId));

    if (index > -1) {
      if (cart[index].quantity >= book.stock_quantity) {
        return res.json({ success: false, message: 'Not enough stock', isMax: true, cart, ...summarize(cart) });
      }
      cart[index].quantity += 1;
    } else {
      if (book.stock_quantity <= 0) {
        return res.json({ success: false, message: 'Out of stock', cart, ...summarize(cart) });
      }

      cart.push({
        bookId: String(book.book_id),
        title: book.title,
        price: Number(book.price),
        img: book.book_img || 'default_book.png',
        quantity: 1,
        maxStock: book.stock_quantity
      });
    }

    return res.json({ success: true, cart, ...summarize(cart) });
  } catch (error) {
    console.error('addToCart error:', error);
    return res.status(500).json({ success: false, message: 'Failed to add to cart' });
  }
};

exports.updateCart = async (req, res) => {
  try {
    const { bookId, action } = req.body;
    const cart = Array.isArray(req.body.cart) ? req.body.cart : [];

    const index = cart.findIndex((item) => String(item.bookId) === String(bookId));

    if (index > -1) {
      if (action === 'increase' && cart[index].quantity < cart[index].maxStock) {
        cart[index].quantity += 1;
      } else if (action === 'decrease' && cart[index].quantity > 1) {
        cart[index].quantity -= 1;
      } else if (action === 'remove') {
        cart.splice(index, 1);
      }
    }

    return res.json({ success: true, cart, ...summarize(cart) });
  } catch (error) {
    console.error('updateCart error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update cart' });
  }
};
