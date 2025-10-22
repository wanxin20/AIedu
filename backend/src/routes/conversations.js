const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

/**
 * 学习助手会话管理路由
 * 所有路由都需要认证，仅学生可访问
 */

// 获取会话列表（学生）
router.get(
  '/',
  authenticateToken,
  authorizeRoles('student'),
  conversationController.getConversationList
);

// 获取会话详情（学生）
router.get(
  '/:id',
  authenticateToken,
  authorizeRoles('student'),
  conversationController.getConversationDetail
);

// 创建新会话（学生）
router.post(
  '/',
  authenticateToken,
  authorizeRoles('student'),
  conversationController.createConversation
);

// 更新会话（学生）
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('student'),
  conversationController.updateConversation
);

// 删除会话（学生）
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('student'),
  conversationController.deleteConversation
);

// 保存单条消息到会话（学生）
router.post(
  '/:id/messages',
  authenticateToken,
  authorizeRoles('student'),
  conversationController.saveMessage
);

// 批量保存消息到会话（学生）
router.post(
  '/:id/messages/batch',
  authenticateToken,
  authorizeRoles('student'),
  conversationController.saveMessagesBatch
);

module.exports = router;

