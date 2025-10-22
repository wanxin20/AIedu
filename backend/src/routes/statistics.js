const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

/**
 * 统计数据路由
 * 所有路由都需要认证
 */

// 管理员仪表盘数据
router.get(
  '/admin-dashboard',
  authenticateToken,
  authorizeRoles('admin'),
  statisticsController.getAdminDashboard
);

// 教师仪表盘数据
router.get(
  '/teacher-dashboard',
  authenticateToken,
  authorizeRoles('teacher'),
  statisticsController.getTeacherDashboard
);

// 学生仪表盘数据
router.get(
  '/student-dashboard',
  authenticateToken,
  authorizeRoles('student'),
  statisticsController.getStudentDashboard
);

module.exports = router;

