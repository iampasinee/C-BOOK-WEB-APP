const db = require('../models');
const { category, books} = db;
const { Op } = require('sequelize');

// [GET] List Categories and Stats
exports.renderCategory = async (req, res) => {
    try {
        const limit = 6; 
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;
        const searchQuery = req.query.search ? req.query.search.toLowerCase() : '';

        // 1. ดึงหมวดหมู่มาแบบปกติ (ไม่ต้องใส่ literal ซับซ้อนแล้ว)
        const { count, rows: allCategories } = await category.findAndCountAll({
            where: {
                category_name: {
                    [Op.like]: `%${searchQuery}%`
                }
            },
            limit: limit,
            offset: offset,
            order: [['category_id', 'DESC']]
        });

        const totalPages = Math.ceil(count / limit);
        const categoriesData = allCategories.map(cat => cat.toJSON());

        // 2.วนลูปนับจำนวนหนังสือใส่เข้าไปทีละหมวดหมู่ (วิธีนี้ชัวร์ 100%)
        await Promise.all(categoriesData.map(async (cat) => {
            cat.book_count = await db.books.count({ 
                where: { category_id: cat.category_id } 
            });
        }));

        const totalBooks = await db.books.count();

        // 3. ส่งข้อมูลกลับไปให้หน้าเว็บ
        if (req.xhr) {
            return res.json({
                categories: categoriesData,
                currentPage: page,
                totalPages: totalPages,
                totalItems: count,
                limit: limit
            });
        }

        res.render("management/category/list_cate", { 
            categories: categoriesData,
            activePage: 'categories',
            currentPage: page,
            totalPages: totalPages,
            totalItems: count,
            limit: limit,
            searchQuery: searchQuery,
            stats: {
                totalCategories: count,
                totalBooks: totalBooks
            }
        }); 

    } catch (err) {
        console.error("🔥 Error renderCategory:", err);
        res.status(500).send('Error rendering list category');
    }
};


// [GET] Create Form
exports.renderCreateCategoryForm = async (req, res) => {
    try {
        res.render("management/category/create_cate"); 
    } catch (err) { 
        res.status(500).send('Error rendering create category form'); 
    }
};

// [POST] Handle Create
exports.handleCreateCategory = async (req, res) => {
    try {
        const categoryName = req.body.category_name.trim();
        const existingCategory = await category.findOne({
            where: {
                category_name: {
                    [Op.like]: categoryName
                }
            }
        });
        if (existingCategory) {
            console.log("Found duplicate:", categoryName); 
            return res.render("management/category/create_cate", { 
                errorMessage: 'This category name already exists. Please try another name.',
                oldValue: req.body.category_name 
            });
        }
        await category.create({ category_name: categoryName });
        res.redirect('/management/categories/'); 

    } catch (err) { 
        console.error("🔥 Error:", err);
        res.status(500).send('Internal Server Error'); 
    }
};


// [GET] Render Edit Form
exports.renderEditCategoryForm = async (req, res) => {
    try {
        const cat = await category.findByPk(req.params.id);
        if (!cat) return res.redirect('/management/category');
        
        res.render("management/category/edit_cate", { cat });
    } catch (err) {
        res.status(500).send('Error');
    }
};

// [POST] Handle Edit
exports.handleEditCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const newName = req.body.category_name.trim();

        const existingCategory = await category.findOne({
            where: {
                category_name: { [Op.like]: newName }, 
                category_id: { [Op.ne]: categoryId }
            }
        });

        if (existingCategory) {
            return res.render("management/category/edit_cate", { 
                cat: { category_id: categoryId, category_name: newName },
                errorMessage: 'This category name already exists. Please try another name.',
                activePage: 'categories'
            });
        }

        await category.update(
            { category_name: newName },
            { where: { category_id: categoryId } }
        );

        res.redirect('/management/categories'); 

    } catch (err) {
        console.error("🔥 Error editing category:", err);
        res.status(500).send('Internal Server Error');
    }
};


// [DELETE] Handle Delete
exports.deleteCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const bookCount = await books.count({ 
            where: { category_id: categoryId } 
        });

        if (bookCount > 0) {
            return res.status(400).json({ 
                message: `Cannot delete category with ID ${categoryId} because it has associated books.` 
            });
        }

        await category.destroy({
            where: { category_id: categoryId }
        });
        
        res.status(200).json({ message: 'Delete category successfully' });

    } catch (error) {
        console.error("🔥 Error deleting category:", error);
        res.status(500).json({ message: 'Error deleting category' });
    }
};

