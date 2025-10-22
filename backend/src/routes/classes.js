const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

/**
 * 班级管理路由
 */

// 公开路由：获取活跃班级列表（用于注册时选择，无需认证）
router.get(
  '/public/active',
  classController.getActiveClassesForRegistration
);

// 获取班级列表（所有角色都可以查看，需要认证）
router.get(
  '/',
  authenticateToken,
  classController.getClassList
);

// 获取班级详情（所有角色都可以查看）
router.get(
  '/:id',
  authenticateToken,
  classController.getClassDetail
);

// 创建班级（仅管理员）
router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin'),
  classController.createClass
);

// 更新班级（仅管理员）
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('admin'),
  classController.updateClass
);

// 删除班级（仅管理员）
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('admin'),
  classController.deleteClass
);

// 获取班级学生列表（管理员和教师）
router.get(
  '/:id/students',
  authenticateToken,
  authorizeRoles('admin', 'teacher'),
  classController.getClassStudents
);

module.exports = router;

