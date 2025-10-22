const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Class = sequelize.define('Class', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    comment: '班级ID'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '班级名称'
  },
  grade: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '年级'
  },
  teacher_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: '班主任ID',
    field: 'teacher_id'
  },
  student_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '学生人数',
    field: 'student_count'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态: 0-停用, 1-正常'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '班级描述'
  }
}, {
  tableName: 'classes',
  underscored: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  comment: '班级表'
});

module.exports = Class;

