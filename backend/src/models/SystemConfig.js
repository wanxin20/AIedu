const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SystemConfig = sequelize.define('SystemConfig', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    comment: '配置ID'
  },
  config_key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: '配置键',
    field: 'config_key'
  },
  config_value: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '配置值',
    field: 'config_value'
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '配置描述'
  },
  type: {
    type: DataTypes.STRING(50),
    defaultValue: 'string',
    comment: '值类型: string, number, boolean, json'
  }
}, {
  tableName: 'system_configs',
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: '系统配置表'
});

/**
 * 获取配置值（自动类型转换）
 */
SystemConfig.prototype.getValue = function() {
  const value = this.config_value;
  const type = this.type;

  switch (type) {
    case 'number':
      return parseFloat(value);
    case 'boolean':
      return value === 'true';
    case 'json':
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    default:
      return value;
  }
};

/**
 * 设置配置值（自动类型转换）
 */
SystemConfig.prototype.setValue = function(value) {
  const type = this.type;

  switch (type) {
    case 'number':
    case 'boolean':
      this.config_value = String(value);
      break;
    case 'json':
      this.config_value = JSON.stringify(value);
      break;
    default:
      this.config_value = String(value);
  }
};

module.exports = SystemConfig;

