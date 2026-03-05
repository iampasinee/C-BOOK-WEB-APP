
module.exports = (sequelize, Datatypes) => {
    const order = sequelize.define('order', {
        order_id: { 
            type: Datatypes.INTEGER, 
            primaryKey: true, 
            autoIncrement: true 
        },
        order_date: { 
            type: Datatypes.DATE, 
            defaultValue: Datatypes.NOW 
        },
        status: { 
            type: Datatypes.STRING, 
            defaultValue: 'pending' 
        },
        user_id: { 
            type: Datatypes.INTEGER, 
            allowNull: false 
        }

    });
    return order;
};