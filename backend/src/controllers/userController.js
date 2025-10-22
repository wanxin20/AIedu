const User = require('../models/User');
const Class = require('../models/Class');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

/**
 * 获取用户列表
 * GET /api/users?page=1&pageSize=20&role=teacher&keyword=张
 */
async function getUserList(req, res) {
  try {
    const { 
      page = 1, 
      pageSize = 20, 
      role, 
      keyword,
      status,
      classId 
    } = req.query;

    // 构建查询条件
    const where = {};

    // 角色筛选
    if (role) {
      where.role = role;
    }

    // 状态筛选
    if (status !== undefined) {
      where.status = parseInt(status);
    }

    // 班级筛选
    if (classId) {
      where.class_id = classId;
    }

    // 关键字搜索（姓名或手机号）
    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { phone: { [Op.like]: `%${keyword}%` } }
      ];
    }

    // 软删除过滤
    where.deleted_at = null;

    // 计算偏移量
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    // 查询用户列表
    const { count, rows } = await User.findAndCountAll({
      where,
      offset,
      limit,
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'grade'],
          required: false
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // 格式化返回数据
    const items = rows.map(user => {
      const userData = user.toJSON();
      return {
        id: userData.id,
        phone: userData.phone,
        name: userData.name,
        role: userData.role,
        avatar: userData.avatar,
        email: userData.email,
        status: userData.status,
        classId: userData.class_id,
        className: userData.class ? userData.class.name : null,
        subject: userData.subject,
        lastLoginAt: userData.last_login_at,
        lastLoginIp: userData.last_login_ip,
        createdAt: userData.created_at
      };
    });

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        items
      }
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 获取用户详情
 * GET /api/users/:id
 */
async function getUserDetail(req, res) {
  try {
    const { id } = req.params;

    // 查询用户
    const user = await User.findOne({
      where: { id, deleted_at: null },
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'grade'],
          required: false
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    const userData = user.toJSON();

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        id: userData.id,
        phone: userData.phone,
        name: userData.name,
        role: userData.role,
        avatar: userData.avatar,
        email: userData.email,
        status: userData.status,
        classId: userData.class_id,
        className: userData.class ? userData.class.name : null,
        subject: userData.subject,
        lastLoginAt: userData.last_login_at,
        lastLoginIp: userData.last_login_ip,
        failedLoginCount: userData.failed_login_count,
        lockedUntil: userData.locked_until,
        createdAt: userData.created_at,
        updatedAt: userData.updated_at
      }
    });
  } catch (error) {
    console.error('获取用户详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 更新用户信息
 * PUT /api/users/:id
 */
async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { name, email, avatar, subject, classId, status } = req.body;

    // 查询用户
    const user = await User.findOne({
      where: { id, deleted_at: null }
    });

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    // 权限检查：只有管理员可以修改其他用户信息，或用户自己修改自己的信息
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({
        code: 403,
        message: '权限不足'
      });
    }

    // 只有管理员可以修改状态
    if (status !== undefined && req.user.role !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '只有管理员可以修改用户状态'
      });
    }

    // 更新字段
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (subject !== undefined && user.role === 'teacher') updateData.subject = subject;
    if (classId !== undefined && user.role === 'student') updateData.class_id = classId;
    if (status !== undefined && req.user.role === 'admin') updateData.status = status;

    await user.update(updateData);

    res.json({
      code: 200,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 修改密码
 * PUT /api/users/:id/password
 */
async function changePassword(req, res) {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    // 验证输入
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        code: 400,
        message: '旧密码和新密码不能为空'
      });
    }

    // 权限检查：只能修改自己的密码
    if (req.user.id !== parseInt(id)) {
      return res.status(403).json({
        code: 403,
        message: '只能修改自己的密码'
      });
    }

    // 查询用户
    const user = await User.findOne({
      where: { id, deleted_at: null }
    });

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    // 验证旧密码
    const isPasswordValid = await user.validatePassword(oldPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        code: 401,
        message: '旧密码错误'
      });
    }

    // 验证新密码强度
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        code: 400,
        message: '新密码至少8位，且包含大小写字母和数字'
      });
    }

    // 更新密码（会在 beforeUpdate 钩子中自动加密）
    user.password = newPassword;
    await user.save();

    res.json({
      code: 200,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 重置密码（管理员）
 * POST /api/users/:id/reset-password
 */
async function resetPassword(req, res) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    // 验证输入
    if (!newPassword) {
      return res.status(400).json({
        code: 400,
        message: '新密码不能为空'
      });
    }

    // 查询用户
    const user = await User.findOne({
      where: { id, deleted_at: null }
    });

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    // 验证新密码强度
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        code: 400,
        message: '新密码至少8位，且包含大小写字母和数字'
      });
    }

    // 重置密码
    user.password = newPassword;
    user.failed_login_count = 0;
    user.locked_until = null;
    await user.save();

    res.json({
      code: 200,
      message: '密码重置成功'
    });
  } catch (error) {
    console.error('重置密码失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 删除用户（软删除）
 * DELETE /api/users/:id
 */
async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    // 查询用户
    const user = await User.findOne({
      where: { id, deleted_at: null }
    });

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    // 不能删除管理员
    if (user.role === 'admin') {
      return res.status(403).json({
        code: 403,
        message: '不能删除管理员账号'
      });
    }

    // 软删除
    user.deleted_at = new Date();
    await user.save();

    res.json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

module.exports = {
  getUserList,
  getUserDetail,
  updateUser,
  changePassword,
  resetPassword,
  deleteUser
};

