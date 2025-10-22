const User = require('../models/User');
const { generateToken, generateRefreshToken, verifyRefreshToken, JWT_EXPIRES_IN } = require('../utils/jwt');

/**
 * 密码登录
 * POST /api/auth/login/password
 */
async function loginWithPassword(req, res) {
  try {
    const { phone, password } = req.body;

    // 验证输入
    if (!phone || !password) {
      return res.status(400).json({
        code: 400,
        message: '手机号和密码不能为空'
      });
    }

    // 查找用户
    const user = await User.findOne({ where: { phone } });

    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '手机号或密码错误'
      });
    }

    // 检查账号状态
    if (user.status === 0) {
      return res.status(403).json({
        code: 403,
        message: '账号已被禁用，请联系管理员'
      });
    }

    // 检查是否被锁定
    if (user.locked_until && new Date() < user.locked_until) {
      const remainingMinutes = Math.ceil((user.locked_until - new Date()) / 60000);
      return res.status(403).json({
        code: 403,
        message: `账号已被锁定，请在 ${remainingMinutes} 分钟后重试`
      });
    }

    // 验证密码
    const isPasswordValid = await user.validatePassword(password);

    if (!isPasswordValid) {
      // 增加失败次数
      user.failed_login_count += 1;

      // 如果失败次数达到5次，锁定账号30分钟
      if (user.failed_login_count >= 5) {
        user.locked_until = new Date(Date.now() + 30 * 60 * 1000);
        await user.save();
        
        return res.status(403).json({
          code: 403,
          message: '登录失败次数过多，账号已被锁定30分钟'
        });
      }

      await user.save();

      return res.status(401).json({
        code: 401,
        message: `手机号或密码错误，还可尝试 ${5 - user.failed_login_count} 次`
      });
    }

    // 登录成功，重置失败次数和锁定时间
    user.failed_login_count = 0;
    user.locked_until = null;
    user.last_login_at = new Date();
    user.last_login_ip = req.ip || req.connection.remoteAddress;
    await user.save();

    // 生成 token
    const token = generateToken({
      id: user.id,
      phone: user.phone,
      role: user.role
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      phone: user.phone
    });

    // 返回用户信息（不包含密码）
    const safeUser = user.toSafeObject();

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        refreshToken,
        expiresIn: JWT_EXPIRES_IN,
        user: {
          id: safeUser.id,
          phone: safeUser.phone,
          name: safeUser.name,
          role: safeUser.role,
          avatar: safeUser.avatar,
          classId: safeUser.class_id,
          subject: safeUser.subject
        }
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 用户注册
 * POST /api/auth/register
 */
async function register(req, res) {
  try {
    const { phone, password, name, role, classId, subject } = req.body;

    // 验证必填字段
    if (!phone || !password || !name || !role) {
      return res.status(400).json({
        code: 400,
        message: '手机号、密码、姓名和角色不能为空'
      });
    }

    // 验证角色
    if (!['teacher', 'student'].includes(role)) {
      return res.status(400).json({
        code: 400,
        message: '角色只能是 teacher 或 student'
      });
    }

    // 学生必须提供班级ID
    if (role === 'student' && !classId) {
      return res.status(400).json({
        code: 400,
        message: '学生必须选择班级'
      });
    }

    // 教师必须提供任教学科
    if (role === 'teacher' && !subject) {
      return res.status(400).json({
        code: 400,
        message: '教师必须填写任教学科'
      });
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        code: 400,
        message: '手机号格式不正确'
      });
    }

    // 验证密码强度（至少8位，包含大小写字母和数字）
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        code: 400,
        message: '密码至少8位，且包含大小写字母和数字'
      });
    }

    // 检查手机号是否已注册
    const existingUser = await User.findOne({ where: { phone } });
    if (existingUser) {
      return res.status(409).json({
        code: 409,
        message: '该手机号已被注册'
      });
    }

    // 创建用户
    const userData = {
      phone,
      password, // 会在 beforeCreate 钩子中自动加密
      name,
      role,
      status: 1
    };

    if (role === 'student') {
      userData.class_id = classId;
    }

    if (role === 'teacher') {
      userData.subject = subject;
      // 教师也可以选择班级
      if (classId) {
        userData.class_id = classId;
      }
    }

    const user = await User.create(userData);

    // 生成 token（注册后自动登录）
    const token = generateToken({
      id: user.id,
      phone: user.phone,
      role: user.role
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      phone: user.phone
    });

    // 返回用户信息
    const safeUser = user.toSafeObject();

    res.status(201).json({
      code: 200,
      message: '注册成功',
      data: {
        token,
        refreshToken,
        expiresIn: JWT_EXPIRES_IN,
        user: {
          id: safeUser.id,
          phone: safeUser.phone,
          name: safeUser.name,
          role: safeUser.role,
          avatar: safeUser.avatar,
          classId: safeUser.class_id,
          subject: safeUser.subject
        }
      }
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 登出
 * POST /api/auth/logout
 */
async function logout(req, res) {
  try {
    // 在实际应用中，可以将 token 加入黑名单
    // 这里简单返回成功
    res.json({
      code: 200,
      message: '登出成功'
    });
  } catch (error) {
    console.error('登出失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
async function getCurrentUser(req, res) {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    const safeUser = user.toSafeObject();

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        id: safeUser.id,
        phone: safeUser.phone,
        name: safeUser.name,
        role: safeUser.role,
        avatar: safeUser.avatar,
        email: safeUser.email,
        classId: safeUser.class_id,
        subject: safeUser.subject,
        status: safeUser.status,
        lastLoginAt: safeUser.last_login_at,
        lastLoginIp: safeUser.last_login_ip,
        createdAt: safeUser.created_at
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 刷新 Token
 * POST /api/auth/refresh
 */
async function refreshTokenHandler(req, res) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        code: 400,
        message: '刷新令牌不能为空'
      });
    }

    // 验证刷新令牌
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      return res.status(401).json({
        code: 401,
        message: '刷新令牌无效或已过期'
      });
    }

    // 查找用户
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    // 检查账号状态
    if (user.status === 0) {
      return res.status(403).json({
        code: 403,
        message: '账号已被禁用'
      });
    }

    // 生成新的 token
    const newToken = generateToken({
      id: user.id,
      phone: user.phone,
      role: user.role
    });

    const newRefreshToken = generateRefreshToken({
      id: user.id,
      phone: user.phone
    });

    res.json({
      code: 200,
      message: '刷新成功',
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
        expiresIn: JWT_EXPIRES_IN,
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('刷新令牌失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

module.exports = {
  loginWithPassword,
  register,
  logout,
  getCurrentUser,
  refreshToken: refreshTokenHandler
};

