const { Op } = require('sequelize');
const db = require('../models');

exports.listCategories = async (req, res) => {
  try {
    const search = (req.query.search || '').trim();
    const limit = Number(req.query.limit || 50);
    const page = Number(req.query.page || 1);
    const offset = (page - 1) * limit;

    const where = search
      ? { category_name: { [Op.like]: `%${search}%` } }
      : {};

    const { count, rows } = await db.category.findAndCountAll({
      where,
      limit,
      offset,
      order: [['category_id', 'DESC']]
    });

    const categories = await Promise.all(
      rows.map(async (cat) => {
        const book_count = await db.books.count({ where: { category_id: cat.category_id } });
        return { ...cat.toJSON(), book_count };
      })
    );

    res.json({
      success: true,
      categories,
      totalItems: count,
      totalPages: Math.max(1, Math.ceil(count / limit)),
      currentPage: page,
      limit,
      stats: {
        totalCategories: count,
        totalBooks: await db.books.count()
      }
    });
  } catch (error) {
    console.error('listCategories error:', error);
    res.status(500).json({ success: false, message: 'Failed to list categories' });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const category = await db.category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    return res.json({ success: true, category });
  } catch (error) {
    console.error('getCategoryById error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get category' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const category_name = (req.body.category_name || '').trim();

    const existing = await db.category.findOne({
      where: { category_name: { [Op.like]: category_name } }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Category name already exists' });
    }

    const created = await db.category.create({ category_name });
    return res.status(201).json({ success: true, category: created });
  } catch (error) {
    console.error('createCategory error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create category' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category_name = (req.body.category_name || '').trim();

    const duplicate = await db.category.findOne({
      where: {
        category_name: { [Op.like]: category_name },
        category_id: { [Op.ne]: categoryId }
      }
    });

    if (duplicate) {
      return res.status(400).json({ success: false, message: 'Category name already exists' });
    }

    await db.category.update({ category_name }, { where: { category_id: categoryId } });
    const category = await db.category.findByPk(categoryId);

    return res.json({ success: true, category });
  } catch (error) {
    console.error('updateCategory error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update category' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const bookCount = await db.books.count({ where: { category_id: categoryId } });

    if (bookCount > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete category with books' });
    }

    await db.category.destroy({ where: { category_id: categoryId } });
    return res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('deleteCategory error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
};
