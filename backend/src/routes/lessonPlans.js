const express = require('express');
const router = express.Router();
const lessonPlanController = require('../controllers/lessonPlanController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

/**
 * 教案管理路由
 * 所有路由都需要认证
 */

// 获取教案列表（教师/管理员）
router.get(
  '/',
  authenticateToken,
  authorizeRoles('teacher', 'admin'),
  lessonPlanController.getLessonPlanList
);

// 获取教案详情（教师/管理员）
router.get(
  '/:id',
  authenticateToken,
  authorizeRoles('teacher', 'admin'),
  lessonPlanController.getLessonPlanDetail
);

// 创建教案（教师）
router.post(
  '/',
  authenticateToken,
  authorizeRoles('teacher'),
  lessonPlanController.createLessonPlan
);

// 更新教案（教师/管理员）
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('teacher', 'admin'),
  lessonPlanController.updateLessonPlan
);

// 删除教案（教师/管理员）
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('teacher', 'admin'),
  lessonPlanController.deleteLessonPlan
);

// 发布教案（教师/管理员）
router.post(
  '/:id/publish',
  authenticateToken,
  authorizeRoles('teacher', 'admin'),
  lessonPlanController.publishLessonPlan
);

module.exports = router;

