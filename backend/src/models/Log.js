const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Log = sequelize.define('Log', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    comment: '日志ID'
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: '用户ID',
    field: 'user_id'
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '操作类型'
  },
  module: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '模块'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '操作描述'
  },
  ip_address: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'IP地址',
    field: 'ip_address'
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'User Agent',
    field: 'user_agent'
  },
  request_data: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '请求数据',
    field: 'request_data'
  },
  response_status: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '响应状态码',
    field: 'response_status'
  }
}, {
  tableName: 'logs',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false, // 日志不需要更新时间
  comment: '操作日志表'
});

module.exports = Log;

