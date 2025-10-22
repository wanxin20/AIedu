-- AI智慧教育平台 - 数据库初始化脚本
-- 创建时间: 2025-10-20
-- 数据库: MySQL 8.0+
-- 字符集: utf8mb4

-- ============================================
-- 1. 创建数据库
-- ============================================

DROP DATABASE IF EXISTS aiedu;
CREATE DATABASE aiedu CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aiedu;

-- ============================================
-- 2. 创建用户表
-- ============================================

DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
  phone VARCHAR(11) NOT NULL UNIQUE COMMENT '手机号',
  password VARCHAR(255) NOT NULL COMMENT '密码（加密）',
  name VARCHAR(50) NOT NULL COMMENT '姓名',
  role ENUM('admin', 'teacher', 'student') NOT NULL COMMENT '角色',
  avatar VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
  email VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
  status TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-正常',
  class_id BIGINT DEFAULT NULL COMMENT '班级ID（学生）',
  subject VARCHAR(50) DEFAULT NULL COMMENT '任教学科（教师）',
  last_login_at DATETIME DEFAULT NULL COMMENT '最后登录时间',
  last_login_ip VARCHAR(50) DEFAULT NULL COMMENT '最后登录IP',
  failed_login_count INT DEFAULT 0 COMMENT '登录失败次数',
  locked_until DATETIME DEFAULT NULL COMMENT '锁定截止时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted_at DATETIME DEFAULT NULL COMMENT '删除时间（软删除）',
  INDEX idx_phone (phone),
  INDEX idx_role (role),
  INDEX idx_class_id (class_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================
-- 3. 创建班级表
-- ============================================

DROP TABLE IF EXISTS classes;
CREATE TABLE classes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '班级ID',
  name VARCHAR(100) NOT NULL COMMENT '班级名称',
  grade VARCHAR(50) NOT NULL COMMENT '年级',
  teacher_id BIGINT DEFAULT NULL COMMENT '班主任ID',
  student_count INT DEFAULT 0 COMMENT '学生人数',
  status TINYINT DEFAULT 1 COMMENT '状态: 0-停用, 1-正常',
  description TEXT DEFAULT NULL COMMENT '班级描述',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted_at DATETIME DEFAULT NULL COMMENT '删除时间（软删除）',
  INDEX idx_teacher_id (teacher_id),
  INDEX idx_grade (grade),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='班级表';

-- ============================================
-- 4. 创建作业表
-- ============================================

DROP TABLE IF EXISTS assignments;
CREATE TABLE assignments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '作业ID',
  title VARCHAR(200) NOT NULL COMMENT '作业标题',
  description TEXT DEFAULT NULL COMMENT '作业描述',
  subject VARCHAR(50) NOT NULL COMMENT '学科',
  teacher_id BIGINT NOT NULL COMMENT '教师ID',
  class_id BIGINT NOT NULL COMMENT '班级ID',
  deadline DATETIME NOT NULL COMMENT '截止时间',
  total_score INT DEFAULT 100 COMMENT '总分',
  attachments JSON DEFAULT NULL COMMENT '附件列表',
  status ENUM('draft', 'published', 'closed') DEFAULT 'draft' COMMENT '状态',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted_at DATETIME DEFAULT NULL COMMENT '删除时间（软删除）',
  INDEX idx_teacher_id (teacher_id),
  INDEX idx_class_id (class_id),
  INDEX idx_subject (subject),
  INDEX idx_status (status),
  INDEX idx_deadline (deadline)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='作业表';

-- ============================================
-- 5. 创建作业提交表
-- ============================================

DROP TABLE IF EXISTS submissions;
CREATE TABLE submissions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '提交ID',
  assignment_id BIGINT NOT NULL COMMENT '作业ID',
  student_id BIGINT NOT NULL COMMENT '学生ID',
  content TEXT DEFAULT NULL COMMENT '提交内容',
  attachments JSON DEFAULT NULL COMMENT '附件列表（图片/文件）',
  score INT DEFAULT NULL COMMENT '得分',
  comment TEXT DEFAULT NULL COMMENT '批改评语',
  status ENUM('pending', 'submitted', 'graded') DEFAULT 'pending' COMMENT '状态',
  submitted_at DATETIME DEFAULT NULL COMMENT '提交时间',
  graded_at DATETIME DEFAULT NULL COMMENT '批改时间',
  graded_by BIGINT DEFAULT NULL COMMENT '批改人ID',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_assignment_id (assignment_id),
  INDEX idx_student_id (student_id),
  INDEX idx_status (status),
  UNIQUE KEY uk_assignment_student (assignment_id, student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='作业提交表';

-- ============================================
-- 6. 创建教学资源表
-- ============================================

DROP TABLE IF EXISTS resources;
CREATE TABLE resources (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '资源ID',
  title VARCHAR(200) NOT NULL COMMENT '资源标题',
  description TEXT DEFAULT NULL COMMENT '资源描述',
  type ENUM('document', 'video', 'audio', 'image', 'other') NOT NULL COMMENT '资源类型',
  category VARCHAR(50) NOT NULL COMMENT '分类',
  subject VARCHAR(50) NOT NULL COMMENT '学科',
  file_name VARCHAR(255) NOT NULL COMMENT '文件名',
  file_url VARCHAR(500) NOT NULL COMMENT '文件URL',
  file_size BIGINT DEFAULT 0 COMMENT '文件大小（字节）',
  mime_type VARCHAR(100) DEFAULT NULL COMMENT 'MIME类型',
  uploader_id BIGINT NOT NULL COMMENT '上传者ID',
  download_count INT DEFAULT 0 COMMENT '下载次数',
  view_count INT DEFAULT 0 COMMENT '查看次数',
  status TINYINT DEFAULT 1 COMMENT '状态: 0-隐藏, 1-正常',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted_at DATETIME DEFAULT NULL COMMENT '删除时间（软删除）',
  INDEX idx_uploader_id (uploader_id),
  INDEX idx_category (category),
  INDEX idx_subject (subject),
  INDEX idx_type (type),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='教学资源表';

-- ============================================
-- 7. 创建教案表
-- ============================================

DROP TABLE IF EXISTS lesson_plans;
CREATE TABLE lesson_plans (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '教案ID',
  title VARCHAR(200) NOT NULL COMMENT '教案标题',
  subject VARCHAR(50) NOT NULL COMMENT '学科',
  grade VARCHAR(50) NOT NULL COMMENT '年级',
  teacher_id BIGINT NOT NULL COMMENT '教师ID',
  content LONGTEXT NOT NULL COMMENT '教案内容',
  objectives TEXT DEFAULT NULL COMMENT '教学目标',
  materials TEXT DEFAULT NULL COMMENT '教学材料',
  duration INT DEFAULT 45 COMMENT '课时（分钟）',
  tags JSON DEFAULT NULL COMMENT '标签',
  status ENUM('draft', 'published') DEFAULT 'draft' COMMENT '状态',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted_at DATETIME DEFAULT NULL COMMENT '删除时间（软删除）',
  INDEX idx_teacher_id (teacher_id),
  INDEX idx_subject (subject),
  INDEX idx_grade (grade),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='教案表';

-- ============================================
-- 8. 创建操作日志表
-- ============================================

DROP TABLE IF EXISTS logs;
CREATE TABLE logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '日志ID',
  user_id BIGINT DEFAULT NULL COMMENT '用户ID',
  action VARCHAR(100) NOT NULL COMMENT '操作类型',
  module VARCHAR(50) NOT NULL COMMENT '模块',
  description TEXT DEFAULT NULL COMMENT '操作描述',
  ip_address VARCHAR(50) DEFAULT NULL COMMENT 'IP地址',
  user_agent TEXT DEFAULT NULL COMMENT 'User Agent',
  request_data JSON DEFAULT NULL COMMENT '请求数据',
  response_status INT DEFAULT NULL COMMENT '响应状态码',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_module (module),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

-- ============================================
-- 9. 创建系统配置表
-- ============================================

DROP TABLE IF EXISTS system_configs;
CREATE TABLE system_configs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '配置ID',
  config_key VARCHAR(100) NOT NULL UNIQUE COMMENT '配置键',
  config_value TEXT NOT NULL COMMENT '配置值',
  description VARCHAR(255) DEFAULT NULL COMMENT '配置描述',
  type VARCHAR(50) DEFAULT 'string' COMMENT '值类型: string, number, boolean, json',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- ============================================
-- 10. 创建学习助手会话表
-- ============================================

DROP TABLE IF EXISTS conversations;
CREATE TABLE conversations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '会话ID',
  user_id BIGINT NOT NULL COMMENT '用户ID（学生）',
  title VARCHAR(200) NOT NULL COMMENT '会话标题',
  coze_conversation_id VARCHAR(100) DEFAULT NULL COMMENT 'Coze API会话ID',
  message_count INT DEFAULT 0 COMMENT '消息数量',
  last_message TEXT DEFAULT NULL COMMENT '最后一条消息',
  last_message_at DATETIME DEFAULT NULL COMMENT '最后消息时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted_at DATETIME DEFAULT NULL COMMENT '删除时间（软删除）',
  INDEX idx_user_id (user_id),
  INDEX idx_coze_conversation_id (coze_conversation_id),
  INDEX idx_last_message_at (last_message_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学习助手会话表';

-- ============================================
-- 11. 创建学习助手消息表
-- ============================================

DROP TABLE IF EXISTS conversation_messages;
CREATE TABLE conversation_messages (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '消息ID',
  conversation_id BIGINT NOT NULL COMMENT '会话ID',
  sender ENUM('user', 'assistant') NOT NULL COMMENT '发送者类型',
  content TEXT NOT NULL COMMENT '消息内容',
  suggested_questions JSON DEFAULT NULL COMMENT 'AI建议的快捷问题',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_conversation_id (conversation_id),
  INDEX idx_sender (sender),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学习助手消息表';

-- ============================================
-- 12. 初始化系统配置数据
-- ============================================

INSERT INTO system_configs (config_key, config_value, description, type) VALUES
('password_min_length', '8', '密码最小长度', 'number'),
('password_require_uppercase', 'true', '密码需要大写字母', 'boolean'),
('password_require_lowercase', 'true', '密码需要小写字母', 'boolean'),
('password_require_number', 'true', '密码需要数字', 'boolean'),
('password_require_special', 'false', '密码需要特殊字符', 'boolean'),
('max_login_attempts', '5', '最大登录失败次数', 'number'),
('login_lock_duration', '30', '登录锁定时长（分钟）', 'number'),
('session_timeout', '7200', '会话超时时间（秒）', 'number'),
('max_file_size', '10485760', '最大文件上传大小（字节，默认10MB）', 'number');

-- ============================================
-- 13. 初始化测试数据
-- ============================================

-- 插入管理员账号（密码: Admin123456）
INSERT INTO users (phone, password, name, role, status) VALUES
('admin', '$2a$10$uW63WKdeSxvA1ldOqetNGe2iDGCT6tuvfDmEWvG9igwQY21TfbwKW', '系统管理员', 'admin', 1);

-- 插入测试班级
INSERT INTO classes (name, grade, status, description) VALUES
('高一(1)班', '高一', 1, '理科实验班'),
('高一(2)班', '高一', 1, '文科实验班'),
('高二(1)班', '高二', 1, '理科普通班'),
('高二(2)班', '高二', 1, '文科普通班'),
('高三(1)班', '高三', 1, '理科冲刺班');

-- 插入测试教师账号（密码: Teacher123）
INSERT INTO users (phone, password, name, role, status, subject) VALUES
('13800001111', '$2a$10$YlP/gd9vJrfJikkjF37wq.1F12p.T6iP1452c1fChtHBZc80JvtQ6', '张老师', 'teacher', 1, '数学'),
('13800001112', '$2a$10$YlP/gd9vJrfJikkjF37wq.1F12p.T6iP1452c1fChtHBZc80JvtQ6', '李老师', 'teacher', 1, '语文'),
('13800001113', '$2a$10$YlP/gd9vJrfJikkjF37wq.1F12p.T6iP1452c1fChtHBZc80JvtQ6', '王老师', 'teacher', 1, '英语');

-- 插入测试学生账号（密码: Student123）
INSERT INTO users (phone, password, name, role, status, class_id) VALUES
('13900001111', '$2a$10$3i8sGIhQ2QRG2loZCPOhceqvqJlFk4/WVEKR0pzrQyKspUI.2ydbi', '张三', 'student', 1, 1),
('13900001112', '$2a$10$3i8sGIhQ2QRG2loZCPOhceqvqJlFk4/WVEKR0pzrQyKspUI.2ydbi', '李四', 'student', 1, 1),
('13900001113', '$2a$10$3i8sGIhQ2QRG2loZCPOhceqvqJlFk4/WVEKR0pzrQyKspUI.2ydbi', '王五', 'student', 1, 1),
('13900001114', '$2a$10$3i8sGIhQ2QRG2loZCPOhceqvqJlFk4/WVEKR0pzrQyKspUI.2ydbi', '赵六', 'student', 1, 2),
('13900001115', '$2a$10$3i8sGIhQ2QRG2loZCPOhceqvqJlFk4/WVEKR0pzrQyKspUI.2ydbi', '钱七', 'student', 1, 2);

-- 更新班级学生人数
UPDATE classes SET student_count = 3 WHERE id = 1;
UPDATE classes SET student_count = 2 WHERE id = 2;

-- 为班级分配班主任
UPDATE classes SET teacher_id = 2 WHERE id = 1;
UPDATE classes SET teacher_id = 3 WHERE id = 2;

-- 插入测试作业
INSERT INTO assignments (title, description, subject, teacher_id, class_id, deadline, total_score, status) VALUES
('第一章测试题', '请完成课本第一章所有习题', '数学', 2, 1, '2025-10-30 23:59:59', 100, 'published'),
('古诗词背诵', '背诵《静夜思》、《春晓》', '语文', 3, 1, '2025-10-25 23:59:59', 100, 'published'),
('英语单词测试', '背诵Unit 1-3所有单词', '英语', 4, 2, '2025-10-28 23:59:59', 100, 'published');

-- 插入测试资源
INSERT INTO resources (title, description, type, category, subject, file_name, file_url, file_size, uploader_id, status) VALUES
('第一章课件', '数学第一章PPT课件', 'document', '课件', '数学', 'chapter1.pdf', '/uploads/chapter1.pdf', 1024000, 2, 1),
('古诗词赏析', '古诗词赏析视频', 'video', '视频', '语文', 'poetry.mp4', '/uploads/poetry.mp4', 10240000, 3, 1),
('英语听力材料', 'Unit 1听力音频', 'audio', '听力', '英语', 'unit1.mp3', '/uploads/unit1.mp3', 5120000, 4, 1);

-- ============================================
-- 14. 创建视图（可选）
-- ============================================

-- 用户详情视图（包含班级和学科信息）
CREATE OR REPLACE VIEW v_user_details AS
SELECT 
  u.id,
  u.phone,
  u.name,
  u.role,
  u.avatar,
  u.email,
  u.status,
  u.class_id,
  c.name AS class_name,
  c.grade,
  u.subject,
  u.last_login_at,
  u.last_login_ip,
  u.created_at
FROM users u
LEFT JOIN classes c ON u.class_id = c.id
WHERE u.deleted_at IS NULL;

-- 作业统计视图
CREATE OR REPLACE VIEW v_assignment_stats AS
SELECT 
  a.id,
  a.title,
  a.subject,
  a.teacher_id,
  u.name AS teacher_name,
  a.class_id,
  c.name AS class_name,
  a.deadline,
  a.total_score,
  a.status,
  COUNT(s.id) AS total_submissions,
  COUNT(CASE WHEN s.status = 'submitted' THEN 1 END) AS submitted_count,
  COUNT(CASE WHEN s.status = 'graded' THEN 1 END) AS graded_count,
  a.created_at
FROM assignments a
LEFT JOIN users u ON a.teacher_id = u.id
LEFT JOIN classes c ON a.class_id = c.id
LEFT JOIN submissions s ON a.id = s.assignment_id
WHERE a.deleted_at IS NULL
GROUP BY a.id;

-- ============================================
-- 15. 完成
-- ============================================

-- 查看所有表
SHOW TABLES;

-- 查看表结构示例
-- DESC users;
-- DESC classes;
-- DESC assignments;

-- 查看测试数据
SELECT '管理员账号' AS type, phone, name, role FROM users WHERE role = 'admin'
UNION ALL
SELECT '教师账号' AS type, phone, name, role FROM users WHERE role = 'teacher'
UNION ALL
SELECT '学生账号' AS type, phone, name, role FROM users WHERE role = 'student';

SELECT * FROM classes;
SELECT * FROM system_configs;

-- ============================================
-- 备注
-- ============================================

/*
测试账号信息：

1. 管理员账号
   手机号: admin
   密码: Admin123456

2. 教师账号
   手机号: 13800001111
   密码: Teacher123
   学科: 数学

3. 学生账号
   手机号: 13900001111
   密码: Student123
   班级: 高一(1)班

数据库连接信息：
Host: localhost
Port: 3306
Database: aiedu
User: aiedu
Password: your_password

建议创建独立数据库用户：
CREATE USER 'aiedu'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON aiedu.* TO 'aiedu'@'localhost';
FLUSH PRIVILEGES;

*/

