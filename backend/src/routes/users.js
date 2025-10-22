const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

/**
 * 用户管理路由
 * 所有路由都需要认证
 */

// 获取用户列表（管理员）
router.get(
  '/',
  authenticateToken,
  authorizeRoles('admin'),
  userController.getUserList
);

// 获取用户详情（管理员或本人）
router.get(
  '/:id',
  authenticateToken,
  userController.getUserDetail
);

// 更新用户信息（管理员或本人）
router.put(
  '/:id',
  authenticateToken,
  userController.updateUser
);

// 修改密码（本人）
router.put(
  '/:id/password',
  authenticateToken,
  userController.changePassword
);

// 重置密码（管理员）
router.post(
  '/:id/reset-password',
  authenticateToken,
  authorizeRoles('admin'),
  userController.resetPassword
);

// 删除用户（管理员）
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('admin'),
  userController.deleteUser
);

module.exports = router;

