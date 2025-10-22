const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Assignment = sequelize.define('Assignment', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    comment: '作业ID'
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '作业标题'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '作业描述'
  },
  subject: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '学科'
  },
  teacher_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '教师ID',
    field: 'teacher_id'
  },
  class_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '班级ID',
    field: 'class_id'
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '截止时间'
  },
  total_score: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    comment: '总分',
    field: 'total_score'
  },
  attachments: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '附件列表'
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'closed'),
    defaultValue: 'draft',
    comment: '状态'
  }
}, {
  tableName: 'assignments',
  underscored: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  comment: '作业表'
});

module.exports = Assignment;

