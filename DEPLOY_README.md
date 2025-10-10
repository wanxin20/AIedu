# 快速部署指南

## 🚀 推荐部署方式（Nginx 静态托管）

### 步骤 1：准备服务器

```bash
# SSH 连接到服务器
ssh root@your-server-ip

# 安装 Nginx（如果未安装）
sudo apt update
sudo apt install nginx

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 步骤 2：本地构建项目

```bash
# 在项目根目录执行
npm install
npm run build
```

### 步骤 3：上传文件到服务器

**方式 A：使用自动化脚本（推荐）**

```bash
# 1. 修改 deploy.sh 中的服务器信息
vim deploy.sh

# 修改以下内容：
# SERVER_HOST="your-server-ip"  # 改为实际服务器IP

# 2. 添加执行权限
chmod +x deploy.sh

# 3. 运行部署脚本
./deploy.sh
```

**方式 B：手动上传**

```bash
# 在服务器创建目录
ssh root@your-server "mkdir -p /var/www/edu-platform"

# 上传文件
scp -r dist/static/* root@your-server:/var/www/edu-platform/

# 设置权限
ssh root@your-server "
    sudo chown -R www-data:www-data /var/www/edu-platform
    sudo chmod -R 755 /var/www/edu-platform
"
```

### 步骤 4：配置 Nginx

```bash
# 1. 上传 Nginx 配置文件到服务器
scp nginx.conf root@your-server:/etc/nginx/sites-available/edu.gptpro.cn

# 2. 创建软链接
ssh root@your-server "
    sudo ln -s /etc/nginx/sites-available/edu.gptpro.cn /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
"
```

### 步骤 5：配置域名

在域名管理后台添加 A 记录：

```
主机记录: edu
记录类型: A
记录值: your-server-ip
TTL: 600
```

### 步骤 6：配置 SSL（可选但推荐）

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 自动配置 SSL
sudo certbot --nginx -d edu.gptpro.cn

# 自动续期
sudo certbot renew --dry-run
```

### 完成！

访问 https://edu.gptpro.cn 查看部署效果。

---

## 🔧 备选部署方式（PM2）

如果需要使用 3003 端口运行服务：

### 步骤 1：安装 PM2

```bash
npm install -g pm2
```

### 步骤 2：构建并启动

```bash
# 构建
npm run build

# 启动服务
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs edu-platform

# 设置开机自启
pm2 startup
pm2 save
```

### 步骤 3：配置 Nginx 反向代理

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
        proxy_cache_bypass $http_upgrade;
    }
}
```

然后重启 Nginx：

```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## 📋 部署检查清单

- [ ] 服务器已安装 Nginx
- [ ] 项目已构建（`npm run build`）
- [ ] 文件已上传到 `/var/www/edu-platform`
- [ ] 文件权限已设置（www-data:www-data, 755）
- [ ] Nginx 配置已添加并启用
- [ ] Nginx 已重启
- [ ] 域名 DNS 已配置（A 记录指向服务器 IP）
- [ ] SSL 证书已配置（可选）
- [ ] 网站可以正常访问

---

## 🔍 故障排查

### 问题 1：访问域名显示 Nginx 默认页面

**原因：** Nginx 配置未正确加载

**解决：**
```bash
# 检查配置是否启用
ls -la /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 问题 2：404 Not Found

**原因：** SPA 路由配置不正确

**解决：** 确保 Nginx 配置包含：
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### 问题 3：静态资源 404

**原因：** 文件路径不正确

**解决：**
```bash
# 检查文件是否存在
ls -la /var/www/edu-platform/

# 检查 Nginx 配置中的 root 路径
sudo nginx -T | grep root
```

### 问题 4：Permission Denied

**原因：** 文件权限不正确

**解决：**
```bash
sudo chown -R www-data:www-data /var/www/edu-platform
sudo chmod -R 755 /var/www/edu-platform
```

---

## 📊 监控和维护

### 查看 Nginx 日志

```bash
# 实时查看访问日志
tail -f /var/log/nginx/edu-platform-access.log

# 查看错误日志
tail -f /var/log/nginx/edu-platform-error.log
```

### 更新部署

```bash
# 1. 本地构建新版本
npm run build

# 2. 运行部署脚本
./deploy.sh

# 或手动上传
rsync -avz dist/static/* root@your-server:/var/www/edu-platform/
```

### 备份网站

```bash
# 在服务器上
tar -czf edu-platform-backup-$(date +%Y%m%d).tar.gz /var/www/edu-platform

# 下载备份到本地
scp root@your-server:/root/edu-platform-backup-*.tar.gz ./backups/
```

---

## 🆘 获取帮助

如果遇到问题，请检查：

1. Nginx 错误日志：`/var/log/nginx/error.log`
2. 系统日志：`journalctl -xe`
3. Nginx 配置测试：`sudo nginx -t`

---

## 📞 联系方式

如有问题，请联系技术支持。

