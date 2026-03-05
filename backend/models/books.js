
module.exports = (sequelize, Datatypes) => {
    const books = sequelize.define('books', {
        book_id: {
            type: Datatypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        title: {
            type: Datatypes.STRING,
            allowNull: false
        },
        author: {
            type: Datatypes.STRING,
            allowNull: false
        },
        price: {
            type: Datatypes.DOUBLE,
            allowNull: false
        },
        stock_quantity: {
            type: Datatypes.INTEGER,
            defaultValue: 0
        },
        book_status: {
            type: Datatypes.STRING,
            defaultValue: 'active'
        },
        book_img: {
            type: Datatypes.STRING,
            allowNull: true,
            defaultValue: 'default_book.png'
        },
        category_id: {
            type: Datatypes.INTEGER,
            allowNull: false
        }
    });
    return books;
};