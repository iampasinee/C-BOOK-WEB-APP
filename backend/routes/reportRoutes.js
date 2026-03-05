const express = require('express');
const controller = require('../controllers/reportController');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/dashboard', auth.isAdmin, controller.dashboard);
router.get('/sales_category', auth.isAdmin, controller.salesByCategory);
router.get('/sales-by-category/:id', auth.isAdmin, controller.salesByCategoryDetail);
router.get('/inventory-status', auth.isAdmin, controller.inventoryStatus);

module.exports = router;
