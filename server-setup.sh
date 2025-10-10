#!/bin/bash

# 服务器端环境配置脚本
# 在服务器上运行此脚本以快速配置环境

set -e

echo "🔧 开始配置服务器环境..."

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. 更新系统
echo -e "${YELLOW}📦 更新系统包...${NC}"
sudo apt update && sudo apt upgrade -y

# 2. 安装 Nginx
echo -e "${YELLOW}🌐 安装 Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    sudo apt install nginx -y
    sudo systemctl start nginx
    sudo systemctl enable nginx
    echo -e "${GREEN}✅ Nginx 安装成功${NC}"
else
    echo -e "${GREEN}✅ Nginx 已安装${NC}"
fi

# 3. 创建网站目录
echo -e "${YELLOW}📁 创建网站目录...${NC}"
sudo mkdir -p /var/www/edu-platform
sudo chown -R www-data:www-data /var/www/edu-platform
sudo chmod -R 755 /var/www/edu-platform
echo -e "${GREEN}✅ 目录创建成功${NC}"

# 4. 创建日志目录
echo -e "${YELLOW}📝 创建日志目录...${NC}"
sudo mkdir -p /var/log/nginx
sudo touch /var/log/nginx/edu-platform-access.log
sudo touch /var/log/nginx/edu-platform-error.log
sudo chown -R www-data:www-data /var/log/nginx
echo -e "${GREEN}✅ 日志目录创建成功${NC}"

# 5. 配置防火墙
echo -e "${YELLOW}🔒 配置防火墙...${NC}"
if command -v ufw &> /dev/null; then
    sudo ufw allow 'Nginx Full'
    sudo ufw allow 22/tcp
    echo -e "${GREEN}✅ 防火墙配置完成${NC}"
else
    echo -e "${YELLOW}⚠️  UFW 未安装，跳过防火墙配置${NC}"
fi

# 6. 安装 Certbot（SSL 证书）
echo -e "${YELLOW}🔐 安装 Certbot...${NC}"
if ! command -v certbot &> /dev/null; then
    sudo apt install certbot python3-certbot-nginx -y
    echo -e "${GREEN}✅ Certbot 安装成功${NC}"
else
    echo -e "${GREEN}✅ Certbot 已安装${NC}"
fi

# 7. 测试 Nginx
echo -e "${YELLOW}🧪 测试 Nginx 配置...${NC}"
sudo nginx -t
echo -e "${GREEN}✅ Nginx 配置正常${NC}"

# 8. 显示服务器信息
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ 服务器环境配置完成！${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📋 配置信息："
echo "  - Nginx 状态：$(systemctl is-active nginx)"
echo "  - 网站目录：/var/www/edu-platform"
echo "  - 日志目录：/var/log/nginx/"
echo "  - 服务器 IP：$(curl -s ifconfig.me)"
echo ""
echo "📝 下一步："
echo "  1. 配置域名 DNS（A 记录指向上述 IP）"
echo "  2. 上传 Nginx 配置文件到 /etc/nginx/sites-available/"
echo "  3. 启用站点并上传网站文件"
echo "  4. 配置 SSL 证书（推荐）"
echo ""

