const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { testConnection } = require('./config/database');
const { ensureBucket } = require('./config/storage');

// 创建 Express 应用
const app = express();

// 中间件配置
app.use(cors()); // 允许跨域
app.use(express.json()); // 解析 JSON
app.use(express.urlencoded({ extended: true })); // 解析 URL 编码
app.use(morgan('dev')); // HTTP 请求日志

// 操作日志中间件
const { loggerMiddleware } = require('./middleware/logger');
app.use(loggerMiddleware);

// 健康检查路由
app.get('/api/health', (req, res) => {
  res.json({
    code: 200,
    message: '服务运行正常',
    data: {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      env: process.env.NODE_ENV || 'development'
    }
  });
});

// 认证路由
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// 用户管理路由
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

// 班级管理路由
const classRoutes = require('./routes/classes');
app.use('/api/classes', classRoutes);

// 文件上传路由
const uploadRoutes = require('./routes/upload');
app.use('/api/upload', uploadRoutes);

// 统计数据路由
const statisticsRoutes = require('./routes/statistics');
app.use('/api/statistics', statisticsRoutes);

// 日志管理路由
const logRoutes = require('./routes/logs');
app.use('/api/logs', logRoutes);

// 系统配置路由
const configRoutes = require('./routes/configs');
app.use('/api/system-configs', configRoutes);

// 作业管理路由
const assignmentRoutes = require('./routes/assignments');
app.use('/api/assignments', assignmentRoutes);

// 作业提交路由
const submissionRoutes = require('./routes/submissions');
app.use('/api/submissions', submissionRoutes);

// 教学资源路由
const resourceRoutes = require('./routes/resources');
app.use('/api/resources', resourceRoutes);

// 教案管理路由
const lessonPlanRoutes = require('./routes/lessonPlans');
app.use('/api/lesson-plans', lessonPlanRoutes);

// 学习助手会话路由
const conversationRoutes = require('./routes/conversations');
app.use('/api/conversations', conversationRoutes);

// AI 批改路由
const aiGradingRoutes = require('./routes/aiGrading');
app.use('/api/ai-grading', aiGradingRoutes);

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '请求的资源不存在'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 启动服务器
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';

async function startServer() {
  try {
    // 测试数据库连接
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ 无法启动服务器：数据库连接失败');
      process.exit(1);
    }

    // 初始化对象存储桶
    await ensureBucket();

    // 启动服务器
    app.listen(PORT, HOST, () => {
      console.log('\n🚀 ================================');
      console.log(`✅ 后端服务已启动`);
      console.log(`📡 地址: http://${HOST}:${PORT}`);
      console.log(`🔗 API: http://${HOST}:${PORT}/api`);
      console.log(`💚 健康检查: http://${HOST}:${PORT}/api/health`);
      console.log(`🕐 时间: ${new Date().toLocaleString('zh-CN')}`);
      console.log('================================\n');
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 启动服务器
startServer();

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n收到 SIGINT 信号，正在关闭服务器...');
  process.exit(0);
});

module.exports = app;

