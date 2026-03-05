const express = require('express');
const path = require('path');
const multer = require('multer');
const controller = require('../controllers/bookController');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../public/images')),
  filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`)
});

const upload = multer({ storage });

router.get('/', controller.listBooks);
router.get('/:id', controller.getBookById);
router.post('/', auth.isAdmin, upload.single('book_img'), controller.createBook);
router.put('/:id', auth.isAdmin, upload.single('book_img'), controller.updateBook);
router.delete('/:id', auth.isAdmin, controller.deleteBook);

module.exports = router;
