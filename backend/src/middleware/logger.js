const Log = require('../models/Log');

/**
 * 操作日志记录中间件
 * 记录用户的重要操作
 */

// 需要记录日志的操作映射
const actionMap = {
  'POST /api/auth/login/password': { action: 'login', module: 'auth', description: '用户登录' },
  'POST /api/auth/register': { action: 'register', module: 'auth', description: '用户注册' },
  'POST /api/auth/logout': { action: 'logout', module: 'auth', description: '用户登出' },
  
  'POST /api/users': { action: 'create_user', module: 'user', description: '创建用户' },
  'PUT /api/users/:id': { action: 'update_user', module: 'user', description: '更新用户信息' },
  'DELETE /api/users/:id': { action: 'delete_user', module: 'user', description: '删除用户' },
  'PUT /api/users/:id/password': { action: 'change_password', module: 'user', description: '修改密码' },
  'POST /api/users/:id/reset-password': { action: 'reset_password', module: 'user', description: '重置密码' },
  
  'POST /api/classes': { action: 'create_class', module: 'class', description: '创建班级' },
  'PUT /api/classes/:id': { action: 'update_class', module: 'class', description: '更新班级' },
  'DELETE /api/classes/:id': { action: 'delete_class', module: 'class', description: '删除班级' },
  
  'POST /api/upload': { action: 'upload_file', module: 'upload', description: '上传文件' },
  'DELETE /api/upload': { action: 'delete_file', module: 'upload', description: '删除文件' }
};

/**
 * 获取客户端IP地址
 */
function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown'
  );
}

/**
 * 生成日志key（用于匹配actionMap）
 */
function generateLogKey(method, path) {
  // 将路径中的ID参数替换为 :id
  const normalizedPath = path.replace(/\/\d+/g, '/:id');
  return `${method} ${normalizedPath}`;
}

/**
 * 日志记录中间件
 */
function loggerMiddleware(req, res, next) {
  // 保存原始的res.json方法
  const originalJson = res.json.bind(res);

  // 重写res.json方法以捕获响应
  res.json = function(data) {
    // 使用完整的 URL 路径（包括 baseUrl）
    const fullPath = req.baseUrl + req.path;
    const logKey = generateLogKey(req.method, fullPath);
    const logConfig = actionMap[logKey];

    // 调试日志（开发环境）
    if (process.env.NODE_ENV === 'development') {
      console.log(`📝 日志中间件检查: ${logKey}`);
      if (logConfig) {
        console.log(`✅ 匹配到日志配置: ${logConfig.action} - ${logConfig.description}`);
      }
    }

    // 如果该操作需要记录日志
    if (logConfig) {
      // 异步记录日志，不阻塞响应
      setImmediate(async () => {
        try {
          const logData = {
            user_id: req.user?.id || null,
            action: logConfig.action,
            module: logConfig.module,
            description: logConfig.description,
            ip_address: getClientIp(req),
            user_agent: req.headers['user-agent'] || null,
            request_data: {
              method: req.method,
              path: fullPath,
              query: req.query,
              // 敏感信息脱敏
              body: req.body ? {
                ...req.body,
                password: req.body.password ? '******' : undefined,
                oldPassword: req.body.oldPassword ? '******' : undefined,
                newPassword: req.body.newPassword ? '******' : undefined
              } : null
            },
            response_status: res.statusCode
          };

          console.log('📋 准备记录日志:', {
            action: logData.action,
            module: logData.module,
            user_id: logData.user_id,
            path: fullPath
          });

          const result = await Log.create(logData);
          console.log('✅ 日志记录成功, ID:', result.id);
        } catch (error) {
          console.error('❌ 记录日志失败:', error.message);
          console.error('错误详情:', error);
          // 日志记录失败不影响主流程
        }
      });
    }

    // 调用原始的json方法
    return originalJson(data);
  };

  next();
}

/**
 * 手动记录日志
 * @param {Object} logData - 日志数据
 */
async function createLog(logData) {
  try {
    await Log.create(logData);
  } catch (error) {
    console.error('创建日志失败:', error);
  }
}

module.exports = {
  loggerMiddleware,
  createLog
};

