const express = require('express');
const controller = require('../controllers/userController');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', controller.login);
router.post('/register', controller.register);
router.get('/', auth.isAdmin, controller.listUsers);
router.put('/:id/role', auth.isAdmin, controller.changeUserRole);
router.delete('/:id', auth.isAdmin, controller.deleteUser);

module.exports = router;
