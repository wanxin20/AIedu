const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LessonPlan = sequelize.define('LessonPlan', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    comment: '教案ID'
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '教案标题'
  },
  subject: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '学科'
  },
  grade: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '年级'
  },
  teacher_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '教师ID',
    field: 'teacher_id'
  },
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
    comment: '教案内容'
  },
  objectives: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '教学目标'
  },
  materials: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '教学材料'
  },
  duration: {
    type: DataTypes.INTEGER,
    defaultValue: 45,
    comment: '课时（分钟）'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '标签'
  },
  status: {
    type: DataTypes.ENUM('draft', 'published'),
    defaultValue: 'draft',
    comment: '状态'
  }
}, {
  tableName: 'lesson_plans',
  underscored: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  comment: '教案表'
});

module.exports = LessonPlan;

