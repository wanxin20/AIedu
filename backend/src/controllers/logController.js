const { Log, User } = require('../models');
const { Op } = require('sequelize');

/**
 * 获取操作日志列表
 * GET /api/logs?page=1&pageSize=20&action=login&userId=1&startDate=2024-01-01&endDate=2024-12-31
 */
async function getLogList(req, res) {
  try {
    const { 
      page = 1, 
      pageSize = 20, 
      action,
      module,
      userId,
      startDate,
      endDate,
      keyword
    } = req.query;

    // 构建查询条件
    const where = {};

    // 操作类型筛选
    if (action) {
      where.action = action;
    }

    // 模块筛选
    if (module) {
      where.module = module;
    }

    // 用户ID筛选
    if (userId) {
      where.user_id = userId;
    }

    // 日期范围筛选
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) {
        where.created_at[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.created_at[Op.lte] = end;
      }
    }

    // 关键字搜索（描述或IP）
    if (keyword) {
      where[Op.or] = [
        { description: { [Op.like]: `%${keyword}%` } },
        { ip_address: { [Op.like]: `%${keyword}%` } }
      ];
    }

    // 计算偏移量
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    // 查询日志列表
    const { count, rows } = await Log.findAndCountAll({
      where,
      offset,
      limit,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'phone', 'role'],
          required: false
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // 格式化返回数据
    const items = rows.map(log => {
      const logData = log.toJSON();
      return {
        id: logData.id,
        userId: logData.user_id,
        userName: logData.user ? logData.user.name : '匿名',
        userRole: logData.user ? logData.user.role : null,
        action: logData.action,
        module: logData.module,
        description: logData.description,
        ipAddress: logData.ip_address,
        userAgent: logData.user_agent,
        requestData: logData.request_data,
        responseStatus: logData.response_status,
        createdAt: logData.created_at
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
    console.error('获取日志列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 获取日志详情
 * GET /api/logs/:id
 */
async function getLogDetail(req, res) {
  try {
    const { id } = req.params;

    const log = await Log.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'phone', 'role', 'email'],
          required: false
        }
      ]
    });

    if (!log) {
      return res.status(404).json({
        code: 404,
        message: '日志不存在'
      });
    }

    const logData = log.toJSON();

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        id: logData.id,
        userId: logData.user_id,
        user: logData.user ? {
          id: logData.user.id,
          name: logData.user.name,
          phone: logData.user.phone,
          role: logData.user.role,
          email: logData.user.email
        } : null,
        action: logData.action,
        module: logData.module,
        description: logData.description,
        ipAddress: logData.ip_address,
        userAgent: logData.user_agent,
        requestData: logData.request_data,
        responseStatus: logData.response_status,
        createdAt: logData.created_at
      }
    });
  } catch (error) {
    console.error('获取日志详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 获取日志统计信息
 * GET /api/logs/statistics
 */
async function getLogStatistics(req, res) {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) {
        where.created_at[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.created_at[Op.lte] = end;
      }
    }

    // 总日志数
    const totalLogs = await Log.count({ where });

    // 按模块统计
    const moduleStats = await Log.findAll({
      where,
      attributes: [
        'module',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['module']
    });

    // 按操作类型统计
    const actionStats = await Log.findAll({
      where,
      attributes: [
        'action',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['action'],
      limit: 10,
      order: [[require('sequelize').fn('COUNT', require('sequelize').col('id')), 'DESC']]
    });

    // 最活跃用户（前10）
    const activeUsers = await Log.findAll({
      where,
      attributes: [
        'user_id',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'role'],
          required: true
        }
      ],
      group: ['user_id', 'user.id'],
      limit: 10,
      order: [[require('sequelize').fn('COUNT', require('sequelize').col('id')), 'DESC']]
    });

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        totalLogs,
        moduleStats: moduleStats.map(m => ({
          module: m.module,
          count: parseInt(m.get('count'))
        })),
        actionStats: actionStats.map(a => ({
          action: a.action,
          count: parseInt(a.get('count'))
        })),
        activeUsers: activeUsers.map(u => ({
          userId: u.user_id,
          userName: u.user.name,
          userRole: u.user.role,
          count: parseInt(u.get('count'))
        }))
      }
    });
  } catch (error) {
    console.error('获取日志统计失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 清理旧日志
 * DELETE /api/logs/cleanup
 */
async function cleanupOldLogs(req, res) {
  try {
    const { days = 90 } = req.body; // 默认删除90天前的日志

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    const deletedCount = await Log.destroy({
      where: {
        created_at: {
          [Op.lt]: cutoffDate
        }
      }
    });

    res.json({
      code: 200,
      message: '清理成功',
      data: {
        deletedCount,
        cutoffDate: cutoffDate.toISOString()
      }
    });
  } catch (error) {
    console.error('清理日志失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

module.exports = {
  getLogList,
  getLogDetail,
  getLogStatistics,
  cleanupOldLogs
};

