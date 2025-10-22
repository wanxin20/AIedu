const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ConversationMessage = sequelize.define('ConversationMessage', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    comment: '消息ID'
  },
  conversation_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '会话ID',
    field: 'conversation_id'
  },
  sender: {
    type: DataTypes.ENUM('user', 'assistant'),
    allowNull: false,
    comment: '发送者类型'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '消息内容'
  },
  suggested_questions: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'AI建议的快捷问题',
    field: 'suggested_questions'
  }
}, {
  tableName: 'conversation_messages',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false, // 消息不需要更新时间
  comment: '学习助手消息表'
});

module.exports = ConversationMessage;

