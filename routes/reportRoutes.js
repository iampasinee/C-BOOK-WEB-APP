const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

// Route หน้ารายงานยอดขายแยกตามหมวดหมู่
router.get('/management/reports/sales_category', authMiddleware.isAdmin, reportController.renderSalesByCategory);

router.get('/management/reports/sales-by-category/:id', authMiddleware.isAdmin, reportController.renderCategoryDetailReport);

router.get('/management/reports/inventory-status', authMiddleware.isAdmin, reportController.renderInventoryStatus);

router.get('/management/reports/sale-2', authMiddleware.isAdmin, reportController.renderSales2);


module.exports = router;