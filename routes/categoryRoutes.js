const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/authMiddleware');


// Route categories
router.get('/management/categories/',authMiddleware.isAdmin, categoryController.renderCategory);
router.get('/management/category/create',authMiddleware.isAdmin, categoryController.renderCreateCategoryForm);
router.post('/management/category/create',authMiddleware.isAdmin, categoryController.handleCreateCategory);

// Route Edit
router.get('/management/category/edit/:id', authMiddleware.isAdmin, categoryController.renderEditCategoryForm);
router.post('/management/category/edit/:id', authMiddleware.isAdmin, categoryController.handleEditCategory);


// Route DELETE
router.delete('/management/category/delete/:id', authMiddleware.isAdmin, categoryController.deleteCategory);

module.exports = router;