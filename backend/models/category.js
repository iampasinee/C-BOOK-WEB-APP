
module.exports = (sequelize, Datatypes) => {
    const category = sequelize.define('category', {
        category_id: {
            type: Datatypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        category_name: {
            type: Datatypes.STRING,
            allowNull: false,
            unique: true}
    });
    return category;
};