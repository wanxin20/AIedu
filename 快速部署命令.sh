#!/bin/bash

# 智慧教辅系统 - 后端快速部署脚本
# 使用方法：在服务器上执行 bash 快速部署命令.sh

set -e  # 遇到错误立即退出

echo "🚀 开始部署后端服务..."

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 配置
BACKEND_DIR="/var/www/aiedu-backend"
PORT=5006

echo -e "${YELLOW}📁 后端目录: $BACKEND_DIR${NC}"
echo -e "${YELLOW}🔌 后端端口: $PORT${NC}"

# 1. 进入后端目录
echo -e "\n${GREEN}[1/5] 进入后端目录...${NC}"
cd $BACKEND_DIR

# 2. 安装依赖
echo -e "\n${GREEN}[2/5] 安装依赖...${NC}"
npm install --production

# 3. 检查 PM2
echo -e "\n${GREEN}[3/5] 检查 PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2 未安装，正在安装...${NC}"
    npm install -g pm2
else
    echo -e "${GREEN}✅ PM2 已安装${NC}"
fi

# 4. 启动/重启后端服务
echo -e "\n${GREEN}[4/5] 启动后端服务...${NC}"
if pm2 list | grep -q "aiedu-backend"; then
    echo -e "${YELLOW}服务已存在，正在重启...${NC}"
    pm2 restart aiedu-backend
else
    echo -e "${YELLOW}首次启动服务...${NC}"
    pm2 start ecosystem.config.js
fi

# 5. 保存 PM2 配置
echo -e "\n${GREEN}[5/5] 保存 PM2 配置...${NC}"
pm2 save

# 显示状态
echo -e "\n${GREEN}✅ 部署完成！${NC}\n"
pm2 status

# 测试后端服务
echo -e "\n${YELLOW}🧪 测试后端服务...${NC}"
sleep 2
if curl -s http://localhost:$PORT/api/health > /dev/null; then
    echo -e "${GREEN}✅ 后端服务运行正常！${NC}"
    echo -e "${GREEN}📡 健康检查: http://localhost:$PORT/api/health${NC}"
else
    echo -e "${RED}❌ 后端服务可能未正常启动，请检查日志${NC}"
    echo -e "${YELLOW}查看日志命令: pm2 logs aiedu-backend${NC}"
fi

echo -e "\n${GREEN}🎉 部署完成！${NC}"
echo -e "${YELLOW}常用命令：${NC}"
echo -e "  查看状态: pm2 status"
echo -e "  查看日志: pm2 logs aiedu-backend"
echo -e "  重启服务: pm2 restart aiedu-backend"
echo -e "  停止服务: pm2 stop aiedu-backend"

