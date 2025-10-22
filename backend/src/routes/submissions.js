const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

/**
 * 作业提交路由
 * 所有路由都需要认证
 */

// 提交作业（学生）
router.post(
  '/',
  authenticateToken,
  authorizeRoles('student'),
  submissionController.submitAssignment
);

// 获取提交详情（所有角色）
router.get(
  '/:id',
  authenticateToken,
  submissionController.getSubmissionDetail
);

// 批改作业（教师/管理员）
router.post(
  '/:id/grade',
  authenticateToken,
  authorizeRoles('teacher', 'admin'),
  submissionController.gradeSubmission
);

// 获取我的提交记录（学生）
router.get(
  '/my/list',
  authenticateToken,
  authorizeRoles('student'),
  submissionController.getMySubmissions
);

// 根据作业ID获取提交记录（学生查看自己的提交）
router.get(
  '/assignment/:assignmentId',
  authenticateToken,
  authorizeRoles('student'),
  submissionController.getSubmissionByAssignment
);

module.exports = router;

