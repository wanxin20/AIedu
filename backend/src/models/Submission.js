const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Submission = sequelize.define('Submission', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    comment: '提交ID'
  },
  assignment_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '作业ID',
    field: 'assignment_id'
  },
  student_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '学生ID',
    field: 'student_id'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '提交内容'
  },
  attachments: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '附件列表（图片/文件）'
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '得分'
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '批改评语'
  },
  ai_comment: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'AI批改评语',
    field: 'ai_comment'
  },
  ai_error_message: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'AI批改错误信息',
    field: 'ai_error_message'
  },
  status: {
    type: DataTypes.ENUM('pending', 'submitted', 'graded'),
    defaultValue: 'pending',
    comment: '状态'
  },
  ai_grading_status: {
    type: DataTypes.ENUM('none', 'pending', 'processing', 'completed', 'failed'),
    defaultValue: 'none',
    comment: 'AI批改状态',
    field: 'ai_grading_status'
  },
  submitted_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '提交时间',
    field: 'submitted_at'
  },
  graded_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '批改时间',
    field: 'graded_at'
  },
  ai_graded_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'AI批改完成时间',
    field: 'ai_graded_at'
  },
  graded_by: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: '批改人ID',
    field: 'graded_by'
  }
}, {
  tableName: 'submissions',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: '作业提交表'
});

module.exports = Submission;

