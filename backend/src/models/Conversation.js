const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    comment: '会话ID'
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '用户ID（学生）',
    field: 'user_id'
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '会话标题'
  },
  coze_conversation_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Coze API会话ID',
    field: 'coze_conversation_id'
  },
  message_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '消息数量',
    field: 'message_count'
  },
  last_message: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '最后一条消息',
    field: 'last_message'
  },
  last_message_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后消息时间',
    field: 'last_message_at'
  }
}, {
  tableName: 'conversations',
  underscored: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  comment: '学习助手会话表'
});

module.exports = Conversation;

