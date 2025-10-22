/**
 * 模型关系定义
 * 集中管理所有模型的关联关系，避免循环依赖
 */

const User = require('./User');
const Class = require('./Class');
const Log = require('./Log');
const SystemConfig = require('./SystemConfig');
const Assignment = require('./Assignment');
const Submission = require('./Submission');
const Resource = require('./Resource');
const LessonPlan = require('./LessonPlan');
const Conversation = require('./Conversation');
const ConversationMessage = require('./ConversationMessage');

/**
 * 定义模型关联关系
 */

// User 和 Class 的关联
// 一个学生属于一个班级
User.belongsTo(Class, {
  foreignKey: 'class_id',
  as: 'class'
});

// 一个班级有多个学生
Class.hasMany(User, {
  foreignKey: 'class_id',
  as: 'students'
});

// 一个班级有一个班主任（教师）
Class.belongsTo(User, {
  foreignKey: 'teacher_id',
  as: 'teacher'
});

// User 和 Log 的关联
// 一个用户有多个日志
User.hasMany(Log, {
  foreignKey: 'user_id',
  as: 'logs'
});

// 一个日志属于一个用户
Log.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Assignment 和 User 的关联
// 一个教师有多个作业
User.hasMany(Assignment, {
  foreignKey: 'teacher_id',
  as: 'assignments'
});

// 一个作业属于一个教师
Assignment.belongsTo(User, {
  foreignKey: 'teacher_id',
  as: 'teacher'
});

// Assignment 和 Class 的关联
// 一个班级有多个作业
Class.hasMany(Assignment, {
  foreignKey: 'class_id',
  as: 'assignments'
});

// 一个作业属于一个班级
Assignment.belongsTo(Class, {
  foreignKey: 'class_id',
  as: 'class'
});

// Assignment 和 Submission 的关联
// 一个作业有多个提交
Assignment.hasMany(Submission, {
  foreignKey: 'assignment_id',
  as: 'submissions'
});

// 一个提交属于一个作业
Submission.belongsTo(Assignment, {
  foreignKey: 'assignment_id',
  as: 'assignment'
});

// Submission 和 User 的关联
// 一个学生有多个提交
User.hasMany(Submission, {
  foreignKey: 'student_id',
  as: 'submissions'
});

// 一个提交属于一个学生
Submission.belongsTo(User, {
  foreignKey: 'student_id',
  as: 'student'
});

// 批改人关联
User.hasMany(Submission, {
  foreignKey: 'graded_by',
  as: 'graded_submissions'
});

Submission.belongsTo(User, {
  foreignKey: 'graded_by',
  as: 'grader'
});

// Resource 和 User 的关联
// 一个用户上传多个资源
User.hasMany(Resource, {
  foreignKey: 'uploader_id',
  as: 'resources'
});

// 一个资源属于一个上传者
Resource.belongsTo(User, {
  foreignKey: 'uploader_id',
  as: 'uploader'
});

// LessonPlan 和 User 的关联
// 一个教师有多个教案
User.hasMany(LessonPlan, {
  foreignKey: 'teacher_id',
  as: 'lessonPlans'
});

// 一个教案属于一个教师
LessonPlan.belongsTo(User, {
  foreignKey: 'teacher_id',
  as: 'teacher'
});

// Conversation 和 User 的关联
// 一个用户有多个会话
User.hasMany(Conversation, {
  foreignKey: 'user_id',
  as: 'conversations'
});

// 一个会话属于一个用户
Conversation.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Conversation 和 ConversationMessage 的关联
// 一个会话有多个消息
Conversation.hasMany(ConversationMessage, {
  foreignKey: 'conversation_id',
  as: 'messages'
});

// 一个消息属于一个会话
ConversationMessage.belongsTo(Conversation, {
  foreignKey: 'conversation_id',
  as: 'conversation'
});

module.exports = {
  User,
  Class,
  Log,
  SystemConfig,
  Assignment,
  Submission,
  Resource,
  LessonPlan,
  Conversation,
  ConversationMessage
};

