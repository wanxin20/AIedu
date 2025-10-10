# 部署文档 - 智慧教辅系统

域名：edu.gptpro.cn  
端口：3003

## 方案一：Nginx 静态托管（推荐）

### 1. 构建项目

在本地或服务器上执行：

```bash
# 安装依赖
npm install
# 或
pnpm install

# 构建生产版本
npm run build
```

构建完成后，会在 `dist/static` 目录生成静态文件。

### 2. 上传到服务器

```bash
# 在服务器上创建项目目录
mkdir -p /var/www/edu-platform

# 上传 dist/static 目录到服务器
scp -r dist/static/* root@your-server:/var/www/edu-platform/

# 或使用 rsync
rsync -avz dist/static/* root@your-server:/var/www/edu-platform/
```

### 3. 配置 Nginx

创建 Nginx 配置文件：`/etc/nginx/sites-available/edu.gptpro.cn`

```nginx
server {
    listen 80;
    server_name edu.gptpro.cn;

    # 网站根目录
    root /var/www/edu-platform;
    index index.html;

    # 开启 gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API 代理（如果需要）
    # location /api {
    #     proxy_pass http://localhost:3003;
    #     proxy_http_version 1.1;
    #     proxy_set_header Upgrade $http_upgrade;
    #     proxy_set_header Connection 'upgrade';
    #     proxy_set_header Host $host;
    #     proxy_cache_bypass $http_upgrade;
    # }
}
```

### 4. 启用站点并重启 Nginx

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/edu.gptpro.cn /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 5. 配置 SSL（推荐）

```bash
# 使用 Certbot 自动配置 SSL
sudo certbot --nginx -d edu.gptpro.cn

# 或手动配置，修改 Nginx 配置
server {
    listen 443 ssl http2;
    server_name edu.gptpro.cn;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # ... 其他配置同上
}

server {
    listen 80;
    server_name edu.gptpro.cn;
    return 301 https://$server_name$request_uri;
}
```

---

## 方案二：使用 Vite Preview + PM2

如果你想使用 3003 端口直接运行 Vite 的预览服务器：

### 1. 构建项目

```bash
npm run build
```

### 2. 创建 PM2 启动脚本

创建 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [{
    name: 'edu-platform',
    script: 'npx',
    args: 'vite preview --host 0.0.0.0 --port 3003',
    cwd: '/path/to/your/project',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
```

### 3. 使用 PM2 启动

```bash
# 安装 PM2（如果未安装）
npm install -g pm2

# 启动应用
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs edu-platform

# 设置开机自启
pm2 startup
pm2 save
```

### 4. 配置 Nginx 反向代理

创建 `/etc/nginx/sites-available/edu.gptpro.cn`：

```nginx
server {
    listen 80;
    server_name edu.gptpro.cn;

    location / {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 方案对比

| 特性 | 方案一（静态托管） | 方案二（Preview + PM2） |
|------|-------------------|----------------------|
| 性能 | ⭐⭐⭐⭐⭐ 最快 | ⭐⭐⭐⭐ 较快 |
| 资源占用 | ⭐⭐⭐⭐⭐ 最少 | ⭐⭐⭐ 中等 |
| 部署难度 | ⭐⭐⭐⭐⭐ 简单 | ⭐⭐⭐ 中等 |
| 维护成本 | ⭐⭐⭐⭐⭐ 低 | ⭐⭐⭐ 中 |
| 推荐度 | ✅ 强烈推荐 | 🔧 可选 |

**推荐使用方案一**，因为这是纯前端项目，静态托管性能最好且最稳定。

---

## 快速部署脚本

我为你创建了一个自动化部署脚本，详见 `deploy.sh`。

---

## 常见问题

### 1. 404 错误
确保 Nginx 配置了 `try_files $uri $uri/ /index.html`，支持 SPA 路由。

### 2. 静态资源 404
检查构建路径和 Nginx root 路径是否匹配。

### 3. 端口被占用
```bash
# 查看端口占用
sudo lsof -i :3003

# 杀死进程
sudo kill -9 <PID>
```

### 4. 权限问题
```bash
# 设置正确的权限
sudo chown -R www-data:www-data /var/www/edu-platform
sudo chmod -R 755 /var/www/edu-platform
```

---

## 更新部署

```bash
# 1. 本地构建新版本
npm run build

# 2. 上传到服务器
rsync -avz dist/static/* root@your-server:/var/www/edu-platform/

# 3. 清理 Nginx 缓存（如果使用了缓存）
sudo nginx -s reload
```

---

## 监控和日志

### Nginx 日志
```bash
# 访问日志
tail -f /var/log/nginx/access.log

# 错误日志
tail -f /var/log/nginx/error.log
```

### PM2 日志（如使用方案二）
```bash
pm2 logs edu-platform
```

