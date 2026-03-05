const express = require('express');
const controller = require('../controllers/categoryController');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', controller.listCategories);
router.get('/:id', controller.getCategoryById);
router.post('/', auth.isAdmin, controller.createCategory);
router.put('/:id', auth.isAdmin, controller.updateCategory);
router.delete('/:id', auth.isAdmin, controller.deleteCategory);

module.exports = router;
