const express = require('express');
const router = express.Router();
const aiGradingController = require('../controllers/aiGradingController');
const { authenticateToken } = require('../middleware/auth');

// 所有路由都需要认证
router.use(authenticateToken);

/**
 * @route   POST /api/ai-grading/start/:submissionId
 * @desc    启动 AI 批改任务（异步）
 * @access  Teacher, Admin
 */
router.post('/start/:submissionId', aiGradingController.startAIGrading);

/**
 * @route   GET /api/ai-grading/status/:submissionId
 * @desc    获取 AI 批改状态
 * @access  Teacher, Admin
 */
router.get('/status/:submissionId', aiGradingController.getAIGradingStatus);

/**
 * @route   POST /api/ai-grading/accept/:submissionId
 * @desc    采纳 AI 批改结果（提交为正式批改）
 * @access  Teacher, Admin
 */
router.post('/accept/:submissionId', aiGradingController.acceptAIGrading);

/**
 * @route   POST /api/ai-grading/retry/:submissionId
 * @desc    重新进行 AI 批改
 * @access  Teacher, Admin
 */
router.post('/retry/:submissionId', aiGradingController.retryAIGrading);

/**
 * @route   POST /api/ai-grading/cancel/:submissionId
 * @desc    取消 AI 批改
 * @access  Teacher, Admin
 */
router.post('/cancel/:submissionId', aiGradingController.cancelAIGrading);

module.exports = router;

