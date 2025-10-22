const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

/**
 * 认证路由
 */

// 密码登录
router.post('/login/password', authController.loginWithPassword);

// 用户注册
router.post('/register', authController.register);

// 登出（需要认证）
router.post('/logout', authenticateToken, authController.logout);

// 获取当前用户信息（需要认证）
router.get('/me', authenticateToken, authController.getCurrentUser);

// 刷新 Token
router.post('/refresh', authController.refreshToken);

module.exports = router;

