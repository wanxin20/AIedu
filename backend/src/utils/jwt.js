const jwt = require('jsonwebtoken');

// JWT 密钥配置
const JWT_SECRET = process.env.JWT_SECRET || 'aiedu_jwt_secret_key_change_this_in_production_2025';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7200'; // 2小时
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'aiedu_refresh_token_secret_key_2025';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '604800'; // 7天

/**
 * 生成访问令牌
 * @param {Object} payload - 要编码的数据（用户ID、角色等）
 * @returns {String} JWT token
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: parseInt(JWT_EXPIRES_IN)
  });
}

/**
 * 生成刷新令牌
 * @param {Object} payload - 要编码的数据
 * @returns {String} Refresh token
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: parseInt(REFRESH_TOKEN_EXPIRES_IN)
  });
}

/**
 * 验证访问令牌
 * @param {String} token - JWT token
 * @returns {Object} 解码后的数据
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Token无效或已过期');
  }
}

/**
 * 验证刷新令牌
 * @param {String} token - Refresh token
 * @returns {Object} 解码后的数据
 */
function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw new Error('Refresh token无效或已过期');
  }
}

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  JWT_EXPIRES_IN: parseInt(JWT_EXPIRES_IN)
};

