const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/auth');
const { uploadSingle, uploadMultiple, handleUploadError } = require('../middleware/upload');

/**
 * 文件上传路由
 * 所有路由都需要认证
 */

// 上传单个文件
router.post(
  '/',
  authenticateToken,
  uploadSingle,
  handleUploadError,
  uploadController.uploadFile
);

// 上传多个文件
router.post(
  '/multiple',
  authenticateToken,
  uploadMultiple,
  handleUploadError,
  uploadController.uploadMultipleFiles
);

// 删除文件
router.delete(
  '/',
  authenticateToken,
  uploadController.deleteFile
);

module.exports = router;

