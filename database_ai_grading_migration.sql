-- AI 智能批改功能 - 数据库迁移脚本
-- 为 submissions 表添加 AI 批改相关字段

USE aiedu;

-- 1. 添加 AI 批改状态字段
ALTER TABLE submissions 
ADD COLUMN ai_grading_status ENUM('none', 'pending', 'processing', 'completed', 'failed') 
DEFAULT 'none' 
COMMENT 'AI批改状态: none-未批改, pending-等待中, processing-批改中, completed-已完成, failed-失败'
AFTER status;

-- 2. 添加 AI 批改结果字段
ALTER TABLE submissions 
ADD COLUMN ai_comment TEXT DEFAULT NULL 
COMMENT 'AI批改评语'
AFTER comment;

-- 3. 添加 AI 批改时间字段
ALTER TABLE submissions 
ADD COLUMN ai_graded_at DATETIME DEFAULT NULL 
COMMENT 'AI批改完成时间'
AFTER graded_at;

-- 4. 添加 AI 批改错误信息字段
ALTER TABLE submissions 
ADD COLUMN ai_error_message TEXT DEFAULT NULL 
COMMENT 'AI批改错误信息'
AFTER ai_comment;

-- 5. 添加索引
ALTER TABLE submissions 
ADD INDEX idx_ai_grading_status (ai_grading_status);

-- 6. 查看表结构
DESC submissions;

-- 7. 查看修改后的数据
SELECT id, assignment_id, student_id, status, ai_grading_status, score, comment, ai_comment
FROM submissions
LIMIT 5;

