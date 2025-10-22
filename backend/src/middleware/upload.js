const multer = require('multer');
const path = require('path');

/**
 * 文件上传中间件配置
 * 使用内存存储，然后上传到对象存储
 */

// 使用内存存储
const storage = multer.memoryStorage();

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 允许的文件类型
  const allowedMimes = [
    // 图片
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    // 视频
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-ms-wmv',
    'video/webm',
    // 文档
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // 压缩文件
    'application/zip',
    'application/x-rar-compressed',
    // 文本
    'text/plain',
    'text/csv'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'), false);
  }
};

// 创建 multer 实例
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB，支持较大的视频文件
  }
});

/**
 * 单文件上传中间件
 */
const uploadSingle = upload.single('file');

/**
 * 多文件上传中间件
 */
const uploadMultiple = upload.array('files', 10); // 最多10个文件

/**
 * 错误处理中间件
 */
function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    // Multer 错误
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        code: 400,
        message: '文件大小超过限制（最大100MB）'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        code: 400,
        message: '文件数量超过限制（最多10个）'
      });
    }
    return res.status(400).json({
      code: 400,
      message: '文件上传错误: ' + err.message
    });
  } else if (err) {
    // 其他错误
    return res.status(400).json({
      code: 400,
      message: err.message
    });
  }
  next();
}

module.exports = {
  uploadSingle,
  uploadMultiple,
  handleUploadError
};

