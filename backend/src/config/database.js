const { Sequelize } = require('sequelize');

// 数据库配置
const sequelize = new Sequelize('aiedu', 'root', 'q5qdbq27', {
  host: 'dbconn.sealosgzg.site',
  port: 35819,
  dialect: 'mysql',
  logging: false, // 设置为 console.log 可以看到 SQL 语句
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  timezone: '+08:00', // 设置时区为中国标准时间
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
});

// 测试连接
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
}

module.exports = { sequelize, testConnection };

