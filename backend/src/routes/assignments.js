const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

/**
 * 作业管理路由
 * 所有路由都需要认证
 */

// 获取作业列表（所有角色）
router.get(
  '/',
  authenticateToken,
  assignmentController.getAssignmentList
);

// 获取作业详情（所有角色）
router.get(
  '/:id',
  authenticateToken,
  assignmentController.getAssignmentDetail
);

// 创建作业（教师）
router.post(
  '/',
  authenticateToken,
  authorizeRoles('teacher'),
  assignmentController.createAssignment
);

// 更新作业（教师）
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('teacher'),
  assignmentController.updateAssignment
);

// 发布作业（教师）
router.post(
  '/:id/publish',
  authenticateToken,
  authorizeRoles('teacher'),
  assignmentController.publishAssignment
);

// 删除作业（教师/管理员）
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('teacher', 'admin'),
  assignmentController.deleteAssignment
);

// 获取作业提交列表（教师/管理员）
router.get(
  '/:id/submissions',
  authenticateToken,
  authorizeRoles('teacher', 'admin'),
  assignmentController.getSubmissionList
);

module.exports = router;

