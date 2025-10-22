const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const Log = require('../models/Log');
const { Op } = require('sequelize');

// 用于缓存今日已记录活跃度的用户ID（避免重复查询数据库）
const dailyActiveUsersCache = new Set();

// 每天凌晨清空缓存
let lastClearDate = new Date().toDateString();
function clearDailyCache() {
  const today = new Date().toDateString();
  if (today !== lastClearDate) {
    dailyActiveUsersCache.clear();
    lastClearDate = today;
  }
}

/**
 * 记录用户日活跃度（异步执行，不阻塞请求）
 */
async function recordDailyActivity(userId, ipAddress) {
  try {
    // 检查缓存，避免重复查询
    clearDailyCache();
    const cacheKey = `${userId}_${new Date().toDateString()}`;
    
    if (dailyActiveUsersCache.has(cacheKey)) {
      return; // 今天已经记录过了
    }

    // 获取今天的开始和结束时间
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // 检查今天是否已有该用户的活跃记录
    const existingLog = await Log.findOne({
      where: {
        user_id: userId,
        action: 'daily_active',
        created_at: {
          [Op.between]: [startOfDay, endOfDay]
        }
      }
    });

    if (!existingLog) {
      // 创建日活跃记录
      await Log.create({
        user_id: userId,
        action: 'daily_active',
        module: 'system',
        description: '用户访问系统',
        ip_address: ipAddress,
        user_agent: null
      });
      
      // 添加到缓存
      dailyActiveUsersCache.add(cacheKey);
    } else {
      // 已有记录，添加到缓存避免下次查询
      dailyActiveUsersCache.add(cacheKey);
    }
  } catch (error) {
    // 记录活跃度失败不应影响正常请求，只打印错误
    console.error('记录用户日活跃度失败:', error.message);
  }
}

/**
 * 验证 JWT Token 中间件
 */
async function authenticateToken(req, res, next) {
  try {
    // 从请求头获取 token
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '未提供认证令牌'
      });
    }

    // 验证 token
    const decoded = verifyToken(token);
    
    // 查询用户是否存在
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户不存在'
      });
    }

    // 检查用户状态
    if (user.status === 0) {
      return res.status(403).json({
        code: 403,
        message: '账号已被禁用'
      });
    }

    // 将用户信息附加到请求对象
    req.user = {
      id: user.id,
      phone: user.phone,
      role: user.role,
      name: user.name
    };

    // 异步记录用户日活跃度（不阻塞请求）
    const ipAddress = req.ip || req.connection.remoteAddress;
    recordDailyActivity(user.id, ipAddress).catch(err => {
      // 静默处理错误，不影响主流程
    });

    next();
  } catch (error) {
    console.error('Token验证失败:', error.message);
    return res.status(401).json({
      code: 401,
      message: 'Token无效或已过期'
    });
  }
}

/**
 * 角色权限验证中间件
 * @param {Array} roles - 允许的角色列表
 */
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        message: '未认证'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        code: 403,
        message: '权限不足'
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  authorizeRoles
};

