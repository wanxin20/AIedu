const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    comment: '用户ID'
  },
  phone: {
    type: DataTypes.STRING(11),
    allowNull: false,
    unique: true,
    comment: '手机号'
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '密码（加密）'
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '姓名'
  },
  role: {
    type: DataTypes.ENUM('admin', 'teacher', 'student'),
    allowNull: false,
    comment: '角色'
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '头像URL'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '邮箱'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态: 0-禁用, 1-正常'
  },
  class_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: '班级ID（学生）',
    field: 'class_id'
  },
  subject: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '任教学科（教师）'
  },
  last_login_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后登录时间',
    field: 'last_login_at'
  },
  last_login_ip: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '最后登录IP',
    field: 'last_login_ip'
  },
  failed_login_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '登录失败次数',
    field: 'failed_login_count'
  },
  locked_until: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '锁定截止时间',
    field: 'locked_until'
  }
}, {
  tableName: 'users',
  underscored: true,
  paranoid: true, // 启用软删除
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  comment: '用户表'
});

/**
 * 密码加密（在创建用户之前）
 */
User.beforeCreate(async (user) => {
  if (user.password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

/**
 * 密码加密（在更新密码时）
 */
User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

/**
 * 验证密码
 * @param {String} password - 明文密码
 * @returns {Boolean} 是否匹配
 */
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

/**
 * 转换为安全的用户对象（不包含密码）
 * @returns {Object} 安全的用户对象
 */
User.prototype.toSafeObject = function() {
  const { password, failed_login_count, locked_until, deleted_at, ...safeUser } = this.toJSON();
  return safeUser;
};

module.exports = User;

