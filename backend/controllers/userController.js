const db = require('../models');
const { Op } = require('sequelize');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await db.users.findOne({ where: { user_email: email } });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Email not found' });
    }

    const isValid = await user.validPassword(password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    if (user.user_status !== 'active') {
      return res.status(403).json({ success: false, message: 'User is suspended' });
    }

    return res.json({
      success: true,
      user: {
        user_id: user.user_id,
        user_name: user.user_name,
        user_email: user.user_email,
        user_role: user.user_role,
        user_status: user.user_status
      }
    });
  } catch (error) {
    console.error('login error:', error);
    return res.status(500).json({ success: false, message: 'Login failed' });
  }
};

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existing = await db.users.findOne({ where: { user_email: email } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    const user = await db.users.create({
      user_name: username,
      user_email: email,
      password,
      user_role: 'member',
      user_status: 'active'
    });

    return res.status(201).json({
      success: true,
      user: {
        user_id: user.user_id,
        user_name: user.user_name,
        user_email: user.user_email,
        user_role: user.user_role
      }
    });
  } catch (error) {
    console.error('register error:', error);
    return res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const searchQuery = req.query.search || '';
    const roleFilter = req.query.role || 'member';
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 6);

    let where = {};

    if (roleFilter) {
      where.user_role = roleFilter;
    }

    if (searchQuery) {
      where = {
        [Op.and]: [
          roleFilter ? { user_role: roleFilter } : {},
          {
            [Op.or]: [
              { user_name: { [Op.like]: `%${searchQuery}%` } },
              { user_email: { [Op.like]: `%${searchQuery}%` } }
            ]
          }
        ]
      };
    }

    const { count, rows } = await db.users.findAndCountAll({
      where,
      limit,
      offset: (page - 1) * limit,
      order: [['user_id', 'DESC']]
    });

    return res.json({
      success: true,
      users: rows,
      totalItems: count,
      totalPages: Math.max(1, Math.ceil(count / limit)),
      currentPage: page,
      limit,
      totalUsersCount: await db.users.count(),
      totalAdminCount: await db.users.count({ where: { user_role: 'admin' } }),
      totalMemberCount: await db.users.count({ where: { user_role: 'member' } })
    });
  } catch (error) {
    console.error('listUsers error:', error);
    return res.status(500).json({ success: false, message: 'Failed to list users' });
  }
};

exports.changeUserRole = async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;

    if (String(req.authUser.userId) === String(userId)) {
      return res.status(403).json({ success: false, message: 'Cannot change your own role' });
    }

    await db.users.update({ user_role: role }, { where: { user_id: userId } });
    return res.json({ success: true, message: 'Role updated successfully' });
  } catch (error) {
    console.error('changeUserRole error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update role' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    if (String(req.authUser.userId) === String(userId)) {
      return res.status(403).json({ success: false, message: 'Cannot delete yourself' });
    }

    await db.users.destroy({ where: { user_id: userId } });
    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('deleteUser error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
};
