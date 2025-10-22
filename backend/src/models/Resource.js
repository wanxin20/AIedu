const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Resource = sequelize.define('Resource', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    comment: '资源ID'
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '资源标题'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '资源描述'
  },
  type: {
    type: DataTypes.ENUM('document', 'video', 'audio', 'image', 'other'),
    allowNull: false,
    comment: '资源类型'
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '分类'
  },
  subject: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '学科'
  },
  file_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '文件名',
    field: 'file_name'
  },
  file_url: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: '文件URL',
    field: 'file_url'
  },
  file_size: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: '文件大小（字节）',
    field: 'file_size'
  },
  mime_type: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'MIME类型',
    field: 'mime_type'
  },
  uploader_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '上传者ID',
    field: 'uploader_id'
  },
  download_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '下载次数',
    field: 'download_count'
  },
  view_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '查看次数',
    field: 'view_count'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态: 0-隐藏, 1-正常'
  }
}, {
  tableName: 'resources',
  underscored: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  comment: '教学资源表'
});

module.exports = Resource;

