// PM2 配置文件 - 智慧教辅系统
// 使用方式：pm2 start ecosystem.config.js

module.exports = {
  apps: [{
    name: 'edu-platform',
    script: 'npx',
    args: 'vite preview --host 0.0.0.0 --port 3003',
    cwd: process.cwd(),
    
    // 实例配置
    instances: 1,
    exec_mode: 'fork',
    
    // 自动重启
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    
    // 环境变量
    env: {
      NODE_ENV: 'production',
      PORT: 3003
    },
    
    // 日志配置
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // 进程管理
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    
    // 其他选项
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 3000
  }]
}

