const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

/**
 * 教学资源路由
 * 所有路由都需要认证
 */

// 获取资源列表（所有角色）
router.get(
  '/',
  authenticateToken,
  resourceController.getResourceList
);

// 获取资源详情（所有角色）
router.get(
  '/:id',
  authenticateToken,
  resourceController.getResourceDetail
);

// 创建资源（教师/管理员）
router.post(
  '/',
  authenticateToken,
  authorizeRoles('teacher', 'admin'),
  resourceController.createResource
);

// 更新资源（教师/管理员）
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('teacher', 'admin'),
  resourceController.updateResource
);

// 删除资源（教师/管理员）
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('teacher', 'admin'),
  resourceController.deleteResource
);

// 下载资源（所有角色）
router.post(
  '/:id/download',
  authenticateToken,
  resourceController.downloadResource
);

module.exports = router;

