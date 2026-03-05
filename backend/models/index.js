const { Sequelize, DataTypes } = require('sequelize');

// Setup Connection
const sequelize = new Sequelize('database', 'username', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    storage: './Database/DB_Books.sqlite'
});

// Import Models
const users = require('././users')(sequelize, DataTypes);
const category = require('./category')(sequelize, DataTypes);
const books = require('./books')(sequelize, DataTypes);
const order = require('./order')(sequelize, DataTypes);
const orderDetail = require('./order_detail')(sequelize, DataTypes);

// Set Associations

// Books <-> Category (One-to-Many)
category.hasMany(books, { foreignKey: 'category_id'});
books.belongsTo(category, { foreignKey: 'category_id'  });

// Users <-> Order (One-to-Many)
users.hasMany(order, { foreignKey: 'user_id' });
order.belongsTo(users, { foreignKey: 'user_id' });

// Order <-> OrderDetail (One-to-Many)
order.hasMany(orderDetail, { foreignKey: 'order_id' });
orderDetail.belongsTo(order, { foreignKey: 'order_id' });

// Books <-> OrderDetail (One-to-Many)
books.hasMany(orderDetail, { foreignKey: 'book_id' });
orderDetail.belongsTo(books, { foreignKey: 'book_id' });


// Export Models
module.exports = {
  sequelize,
  users,
  category,
  books,
  order,
  orderDetail
}

