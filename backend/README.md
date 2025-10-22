# AI智慧教育平台 - 后端服务

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
后端配置已经内置在代码中，使用以下数据库连接：
- 主机: dbconn.sealosgzg.site
- 端口: 35819
- 数据库: aiedu
- 用户: root
- 密码: q5qdbq27

如需修改，请编辑 `src/config/database.js` 文件。

### 3. 启动服务器

#### 开发模式（自动重启）
```bash
npm run dev
```

#### 生产模式
```bash
npm start
```

服务器将在 `http://localhost:5000` 启动

## 📡 API 接口

### 认证接口

#### 1. 密码登录
```http
POST /api/auth/login/password
Content-Type: application/json

{
  "phone": "13800001111",
  "password": "Teacher123"
}
```

**响应:**
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUz...",
    "refreshToken": "eyJhbGciOiJIUz...",
    "expiresIn": 7200,
    "user": {
      "id": 1,
      "phone": "13800001111",
      "name": "张老师",
      "role": "teacher",
      "avatar": null,
      "classId": null,
      "subject": "数学"
    }
  }
}
```

#### 2. 用户注册
```http
POST /api/auth/register
Content-Type: application/json

// 教师注册
{
  "phone": "13900001234",
  "password": "Teacher123",
  "name": "王老师",
  "role": "teacher",
  "subject": "语文"
}

// 学生注册
{
  "phone": "13900005678",
  "password": "Student123",
  "name": "张三",
  "role": "student",
  "classId": 1
}
```

**响应:**
```json
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "token": "eyJhbGciOiJIUz...",
    "refreshToken": "eyJhbGciOiJIUz...",
    "expiresIn": 7200,
    "user": {
      "id": 2,
      "phone": "13900001234",
      "name": "王老师",
      "role": "teacher",
      "avatar": null,
      "classId": null,
      "subject": "语文"
    }
  }
}
```

#### 3. 登出
```http
POST /api/auth/logout
Authorization: Bearer {token}
```

**响应:**
```json
{
  "code": 200,
  "message": "登出成功"
}
```

#### 4. 获取当前用户信息
```http
GET /api/auth/me
Authorization: Bearer {token}
```

**响应:**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 1,
    "phone": "13800001111",
    "name": "张老师",
    "role": "teacher",
    "avatar": null,
    "email": null,
    "classId": null,
    "subject": "数学",
    "status": 1,
    "lastLoginAt": "2025-10-20T08:00:00.000Z",
    "lastLoginIp": "::1",
    "createdAt": "2025-10-20T00:00:00.000Z"
  }
}
```

### 健康检查
```http
GET /api/health
```

**响应:**
```json
{
  "code": 200,
  "message": "服务运行正常",
  "data": {
    "timestamp": "2025-10-20T08:00:00.000Z",
    "version": "1.0.0",
    "env": "development"
  }
}
```

## 📦 项目结构

```
backend/
├── src/
│   ├── config/           # 配置文件
│   │   └── database.js   # 数据库配置
│   ├── controllers/      # 控制器
│   │   └── authController.js  # 认证控制器
│   ├── middleware/       # 中间件
│   │   └── auth.js       # 认证中间件
│   ├── models/           # 数据模型
│   │   ├── User.js       # 用户模型
│   │   └── Class.js      # 班级模型
│   ├── routes/           # 路由
│   │   └── auth.js       # 认证路由
│   ├── utils/            # 工具函数
│   │   └── jwt.js        # JWT 工具
│   └── app.js            # 主应用
├── uploads/              # 文件上传目录
├── logs/                 # 日志目录
├── package.json
└── README.md
```

### 用户管理接口

#### 1. 获取用户列表（管理员）
```http
GET /api/users?page=1&pageSize=20&role=teacher&keyword=张
Authorization: Bearer {token}
```

**响应:**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "items": [...]
  }
}
```

#### 2. 获取用户详情
```http
GET /api/users/:id
Authorization: Bearer {token}
```

#### 3. 更新用户信息
```http
PUT /api/users/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "张三",
  "email": "zhang@example.com"
}
```

#### 4. 修改密码
```http
PUT /api/users/:id/password
Authorization: Bearer {token}
Content-Type: application/json

{
  "oldPassword": "OldPassword123",
  "newPassword": "NewPassword456"
}
```

#### 5. 重置密码（管理员）
```http
POST /api/users/:id/reset-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "newPassword": "DefaultPassword123"
}
```

#### 6. 删除用户（管理员）
```http
DELETE /api/users/:id
Authorization: Bearer {token}
```

### 班级管理接口

#### 1. 获取班级列表
```http
GET /api/classes?page=1&pageSize=20&grade=高一
Authorization: Bearer {token}
```

**响应:**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "total": 50,
    "page": 1,
    "pageSize": 20,
    "items": [...]
  }
}
```

#### 2. 获取班级详情
```http
GET /api/classes/:id
Authorization: Bearer {token}
```

#### 3. 创建班级（管理员）
```http
POST /api/classes
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "高一(1)班",
  "grade": "高一",
  "teacherId": 1,
  "description": "班级描述"
}
```

#### 4. 更新班级（管理员）
```http
PUT /api/classes/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "高一(2)班",
  "status": 1
}
```

#### 5. 删除班级（管理员）
```http
DELETE /api/classes/:id
Authorization: Bearer {token}
```

#### 6. 获取班级学生列表（管理员/教师）
```http
GET /api/classes/:id/students
Authorization: Bearer {token}
```

### 文件上传接口

#### 1. 上传单个文件
```http
POST /api/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "file": <File>,
  "type": "assignment" | "resource" | "avatar"
}
```

**响应:**
```json
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "url": "/uploads/assignment/file-123456.jpg",
    "fileName": "作业.jpg",
    "fileSize": 102400,
    "mimeType": "image/jpeg"
  }
}
```

#### 2. 上传多个文件
```http
POST /api/upload/multiple
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "files": [<File>, <File>, ...],
  "type": "resource"
}
```

#### 3. 删除文件
```http
DELETE /api/upload
Authorization: Bearer {token}
Content-Type: application/json

{
  "fileUrl": "/uploads/assignment/file-123456.jpg"
}
```

### 统计数据接口

#### 1. 管理员仪表盘数据
```http
GET /api/statistics/admin-dashboard
Authorization: Bearer {token}
```

**响应:**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "userCount": { "total": 500, "admin": 5, "teacher": 50, "student": 445 },
    "classCount": { "total": 15, "active": 15 },
    "activityTrend": [...],
    "recentUsers": [...],
    "activeClasses": [...]
  }
}
```

#### 2. 教师仪表盘数据
```http
GET /api/statistics/teacher-dashboard
Authorization: Bearer {token}
```

#### 3. 学生仪表盘数据
```http
GET /api/statistics/student-dashboard
Authorization: Bearer {token}
```

### 日志管理接口

#### 1. 获取日志列表（管理员）
```http
GET /api/logs?page=1&pageSize=20&action=login&userId=1
Authorization: Bearer {token}
```

**响应:**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "total": 1000,
    "page": 1,
    "pageSize": 20,
    "items": [...]
  }
}
```

#### 2. 获取日志详情（管理员）
```http
GET /api/logs/:id
Authorization: Bearer {token}
```

#### 3. 获取日志统计（管理员）
```http
GET /api/logs/statistics?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer {token}
```

#### 4. 清理旧日志（管理员）
```http
DELETE /api/logs/cleanup
Authorization: Bearer {token}
Content-Type: application/json

{
  "days": 90
}
```

### 系统配置接口

#### 1. 获取所有配置
```http
GET /api/system-configs
Authorization: Bearer {token}
```

**响应:**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "passwordMinLength": 8,
    "passwordRequireUppercase": true,
    "maxLoginAttempts": 5,
    "loginLockDuration": 30,
    "sessionTimeout": 7200
  }
}
```

#### 2. 更新配置（管理员）
```http
PUT /api/system-configs
Authorization: Bearer {token}
Content-Type: application/json

{
  "passwordMinLength": 10,
  "maxLoginAttempts": 3
}
```

#### 3. 重置为默认配置（管理员）
```http
POST /api/system-configs/reset
Authorization: Bearer {token}
```

## 🔒 安全特性

1. **密码加密**: 使用 bcryptjs 加密存储密码
2. **JWT 认证**: 使用 JWT 进行用户认证
3. **登录保护**: 
   - 5次登录失败后锁定账号30分钟
   - 记录登录IP和时间
4. **密码策略**: 
   - 至少8位
   - 包含大小写字母
   - 包含数字

## 🧪 测试账号

### 管理员
- 手机号: admin
- 密码: Admin123456

### 教师
- 手机号: 13800001111
- 密码: Teacher123
- 学科: 数学

### 学生
- 手机号: 13900001111
- 密码: Student123
- 班级: 高一(1)班

## 📝 开发说明

### 添加新的路由
1. 在 `src/routes/` 创建路由文件
2. 在 `src/controllers/` 创建控制器
3. 在 `src/app.js` 中注册路由

### 添加新的模型
1. 在 `src/models/` 创建模型文件
2. 使用 Sequelize 定义模型
3. 在控制器中导入使用

### 使用认证中间件
```javascript
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// 需要认证
router.get('/protected', authenticateToken, controller.method);

// 需要特定角色
router.get('/admin-only', authenticateToken, authorizeRoles('admin'), controller.method);
```

## 🐛 常见问题

### 1. 数据库连接失败
- 检查数据库配置是否正确
- 确认数据库服务是否运行
- 检查网络连接

### 2. Token 验证失败
- 检查 Token 是否过期
- 确认请求头格式: `Authorization: Bearer {token}`
- 检查 JWT 密钥配置

### 3. 端口被占用
- 修改 `src/app.js` 中的 PORT 配置
- 或杀死占用端口的进程

## 📚 相关文档

- [开发文档](../开发文档.md)
- [开发进度表](../开发进度表.md)
- [数据库设计](../database.sql)

## 👨‍💻 开发者

- 后端框架: Node.js + Express
- ORM: Sequelize
- 数据库: MySQL
- 认证: JWT

---

**最后更新**: 2025-10-20

