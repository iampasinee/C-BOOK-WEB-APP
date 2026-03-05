
module.exports = (sequelize, Datatypes) => {
    const orderDetail = sequelize.define('orderDetail', {
        detail_id: { 
            type: Datatypes.INTEGER, 
            primaryKey: true, 
            autoIncrement: true 
        },
        quantity: { 
            type: Datatypes.INTEGER, 
            allowNull: false 
        },
        unit_price: { 
            type: Datatypes.DOUBLE, 
            allowNull: false 
        },
        book_id: {
            type: Datatypes.INTEGER,
            allowNull: false
        },
        order_id: {
            type: Datatypes.INTEGER,
            allowNull: false
        }
    });
    return orderDetail;
};