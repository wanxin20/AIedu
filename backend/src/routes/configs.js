const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

/**
 * 系统配置路由
 * 仅管理员可访问（除了获取配置）
 */

// 获取所有配置
router.get(
  '/',
  authenticateToken,
  configController.getAllConfigs
);

// 获取单个配置
router.get(
  '/:key',
  authenticateToken,
  authorizeRoles('admin'),
  configController.getConfig
);

// 更新配置
router.put(
  '/',
  authenticateToken,
  authorizeRoles('admin'),
  configController.updateConfigs
);

// 创建配置
router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin'),
  configController.createConfig
);

// 删除配置
router.delete(
  '/:key',
  authenticateToken,
  authorizeRoles('admin'),
  configController.deleteConfig
);

// 重置为默认配置
router.post(
  '/reset',
  authenticateToken,
  authorizeRoles('admin'),
  configController.resetToDefault
);

module.exports = router;

