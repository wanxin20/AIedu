const SystemConfig = require('../models/SystemConfig');

/**
 * 获取所有系统配置
 * GET /api/system-configs
 */
async function getAllConfigs(req, res) {
  try {
    const configs = await SystemConfig.findAll({
      order: [['config_key', 'ASC']]
    });

    // 将配置转换为键值对格式
    const configMap = {};
    configs.forEach(config => {
      const key = config.config_key
        .split('_')
        .map((word, index) => 
          index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
        )
        .join('');
      configMap[key] = config.getValue();
    });

    res.json({
      code: 200,
      message: '获取成功',
      data: configMap
    });
  } catch (error) {
    console.error('获取系统配置失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 获取单个配置
 * GET /api/system-configs/:key
 */
async function getConfig(req, res) {
  try {
    const { key } = req.params;

    const config = await SystemConfig.findOne({
      where: { config_key: key }
    });

    if (!config) {
      return res.status(404).json({
        code: 404,
        message: '配置不存在'
      });
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        key: config.config_key,
        value: config.getValue(),
        description: config.description,
        type: config.type
      }
    });
  } catch (error) {
    console.error('获取配置失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 更新系统配置
 * PUT /api/system-configs
 */
async function updateConfigs(req, res) {
  try {
    const updates = req.body;

    // 将驼峰命名转换为下划线命名
    const configKeys = {
      passwordMinLength: 'password_min_length',
      passwordRequireUppercase: 'password_require_uppercase',
      passwordRequireLowercase: 'password_require_lowercase',
      passwordRequireNumber: 'password_require_number',
      passwordRequireSpecial: 'password_require_special',
      maxLoginAttempts: 'max_login_attempts',
      loginLockDuration: 'login_lock_duration',
      sessionTimeout: 'session_timeout',
      maxFileSize: 'max_file_size'
    };

    const updatePromises = [];

    for (const [camelKey, value] of Object.entries(updates)) {
      const dbKey = configKeys[camelKey];
      if (dbKey) {
        updatePromises.push(
          SystemConfig.findOne({ where: { config_key: dbKey } })
            .then(config => {
              if (config) {
                config.setValue(value);
                return config.save();
              }
            })
        );
      }
    }

    await Promise.all(updatePromises);

    res.json({
      code: 200,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新系统配置失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 创建配置
 * POST /api/system-configs
 */
async function createConfig(req, res) {
  try {
    const { key, value, description, type = 'string' } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({
        code: 400,
        message: '配置键和值不能为空'
      });
    }

    // 检查是否已存在
    const existing = await SystemConfig.findOne({
      where: { config_key: key }
    });

    if (existing) {
      return res.status(409).json({
        code: 409,
        message: '配置键已存在'
      });
    }

    const config = await SystemConfig.create({
      config_key: key,
      config_value: String(value),
      description,
      type
    });

    res.status(201).json({
      code: 200,
      message: '创建成功',
      data: {
        key: config.config_key,
        value: config.getValue(),
        description: config.description,
        type: config.type
      }
    });
  } catch (error) {
    console.error('创建配置失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 删除配置
 * DELETE /api/system-configs/:key
 */
async function deleteConfig(req, res) {
  try {
    const { key } = req.params;

    const config = await SystemConfig.findOne({
      where: { config_key: key }
    });

    if (!config) {
      return res.status(404).json({
        code: 404,
        message: '配置不存在'
      });
    }

    await config.destroy();

    res.json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除配置失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 重置为默认配置
 * POST /api/system-configs/reset
 */
async function resetToDefault(req, res) {
  try {
    const defaultConfigs = [
      { key: 'password_min_length', value: '8', description: '密码最小长度', type: 'number' },
      { key: 'password_require_uppercase', value: 'true', description: '密码需要大写字母', type: 'boolean' },
      { key: 'password_require_lowercase', value: 'true', description: '密码需要小写字母', type: 'boolean' },
      { key: 'password_require_number', value: 'true', description: '密码需要数字', type: 'boolean' },
      { key: 'password_require_special', value: 'false', description: '密码需要特殊字符', type: 'boolean' },
      { key: 'max_login_attempts', value: '5', description: '最大登录失败次数', type: 'number' },
      { key: 'login_lock_duration', value: '30', description: '登录锁定时长（分钟）', type: 'number' },
      { key: 'session_timeout', value: '7200', description: '会话超时时间（秒）', type: 'number' },
      { key: 'max_file_size', value: '10485760', description: '最大文件上传大小（字节，默认10MB）', type: 'number' }
    ];

    for (const config of defaultConfigs) {
      const [record] = await SystemConfig.findOrCreate({
        where: { config_key: config.key },
        defaults: {
          config_key: config.key,
          config_value: config.value,
          description: config.description,
          type: config.type
        }
      });

      // 如果已存在，更新为默认值
      if (record) {
        record.config_value = config.value;
        await record.save();
      }
    }

    res.json({
      code: 200,
      message: '重置成功'
    });
  } catch (error) {
    console.error('重置配置失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

module.exports = {
  getAllConfigs,
  getConfig,
  updateConfigs,
  createConfig,
  deleteConfig,
  resetToDefault
};

