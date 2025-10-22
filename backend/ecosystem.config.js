module.exports = {
  apps: [{
    name: 'aiedu-backend',
    script: 'src/app.js',
    cwd: '/var/www/aiedu-backend',  // 修改为你的实际路径
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 5006
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true
  }]
};

