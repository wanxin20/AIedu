#!/bin/bash

# 智慧教辅系统自动化部署脚本
# 域名：edu.gptpro.cn

set -e

echo "🚀 开始部署智慧教辅系统..."

# 配置变量
SERVER_USER="root"
SERVER_HOST="your-server-ip"  # 请修改为实际服务器IP
SERVER_PATH="/var/www/edu-platform"
LOCAL_BUILD_PATH="dist/static"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. 清理旧的构建文件
echo -e "${YELLOW}📦 清理旧的构建文件...${NC}"
rm -rf dist

# 2. 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📥 安装依赖...${NC}"
    npm install
fi

# 3. 构建项目
echo -e "${YELLOW}🔨 构建生产版本...${NC}"
npm run build

if [ ! -d "$LOCAL_BUILD_PATH" ]; then
    echo -e "${RED}❌ 构建失败，dist/static 目录不存在${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 构建成功${NC}"

# 4. 上传到服务器
echo -e "${YELLOW}📤 上传文件到服务器...${NC}"

# 创建远程目录（如果不存在）
ssh ${SERVER_USER}@${SERVER_HOST} "mkdir -p ${SERVER_PATH}"

# 使用 rsync 上传（保持权限和增量更新）
rsync -avz --delete \
    ${LOCAL_BUILD_PATH}/ \
    ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/

echo -e "${GREEN}✅ 文件上传成功${NC}"

# 5. 设置权限
echo -e "${YELLOW}🔒 设置文件权限...${NC}"
ssh ${SERVER_USER}@${SERVER_HOST} "
    sudo chown -R www-data:www-data ${SERVER_PATH}
    sudo chmod -R 755 ${SERVER_PATH}
"

# 6. 重启 Nginx
echo -e "${YELLOW}🔄 重启 Nginx...${NC}"
ssh ${SERVER_USER}@${SERVER_HOST} "
    sudo nginx -t && sudo systemctl reload nginx
"

echo -e "${GREEN}✅ Nginx 重启成功${NC}"

# 7. 完成
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 部署完成！${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "访问地址: ${YELLOW}http://edu.gptpro.cn${NC}"
echo -e "或: ${YELLOW}https://edu.gptpro.cn${NC} (如已配置SSL)"
echo ""

# 可选：自动打开浏览器
# open http://edu.gptpro.cn

