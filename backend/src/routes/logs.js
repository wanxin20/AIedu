const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

/**
 * 日志管理路由
 * 仅管理员可访问
 */

// 获取日志列表
router.get(
  '/',
  authenticateToken,
  authorizeRoles('admin'),
  logController.getLogList
);

// 获取日志统计信息
router.get(
  '/statistics',
  authenticateToken,
  authorizeRoles('admin'),
  logController.getLogStatistics
);

// 获取日志详情
router.get(
  '/:id',
  authenticateToken,
  authorizeRoles('admin'),
  logController.getLogDetail
);

// 清理旧日志
router.delete(
  '/cleanup',
  authenticateToken,
  authorizeRoles('admin'),
  logController.cleanupOldLogs
);

module.exports = router;

