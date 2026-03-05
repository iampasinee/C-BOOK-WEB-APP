const express = require('express');
const controller = require('../controllers/orderController');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', auth.isAdmin, controller.listOrders);
router.get('/:id', auth.isAdmin, controller.getOrderById);
router.put('/:id/status', auth.isAdmin, controller.updateOrderStatus);
router.post('/checkout/process', auth.isLoggedIn, controller.checkout);

module.exports = router;
