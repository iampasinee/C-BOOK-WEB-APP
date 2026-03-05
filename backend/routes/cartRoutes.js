const express = require('express');
const controller = require('../controllers/cartController');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/summary', auth.isLoggedIn, controller.getSummary);
router.post('/add', auth.isLoggedIn, controller.addToCart);
router.post('/update', auth.isLoggedIn, controller.updateCart);

module.exports = router;
