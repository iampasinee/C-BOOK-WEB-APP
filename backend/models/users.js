const bcrypt = require('bcryptjs');

module.exports = (sequelize, Datatypes) => {
    const users = sequelize.define('users', {
        user_id: {
            type: Datatypes.INTEGER,
            primaryKey: true,
            autoIncrement: true 
        },
        user_name: {
            type: Datatypes.STRING,
            allowNull: false
        },
        user_email: {
            type: Datatypes.STRING,
            allowNull: false,
            unique: true, 
            validate: {
                isEmail: true 
            }
        },
        password: {
            type: Datatypes.STRING,
            allowNull: false
        },
        user_role: {
            type: Datatypes.ENUM('admin', 'member'),
            defaultValue: 'member'
        },
        user_status: {
            type: Datatypes.STRING,
            defaultValue: 'active',
            allowNull: false
        }
    }, {
        // ระบบเข้ารหัสผ่านอัตโนมัติ (Hooks)
        hooks: {
            beforeCreate: async (user) => {
                if (user.password) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
            beforeUpdate: async (user) => {
                if (user.changed('password')) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            }
        }
    });

    //ฟังก์ชันสำหรับเช็กรหัสผ่านตอน Login
    users.prototype.validPassword = async function (password) {
        return await bcrypt.compare(password, this.password);
    };

    return users;
};