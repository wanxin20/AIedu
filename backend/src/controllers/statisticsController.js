const { User, Class, Assignment, Submission, Resource } = require('../models');
const { Op } = require('sequelize');

/**
 * 获取管理员仪表盘统计数据
 * GET /api/statistics/admin-dashboard
 */
async function getAdminDashboard(req, res) {
  try {
    // 1. 用户数统计
    const totalUsers = await User.count({
      where: { deleted_at: null }
    });

    const adminCount = await User.count({
      where: { role: 'admin', deleted_at: null }
    });

    const teacherCount = await User.count({
      where: { role: 'teacher', deleted_at: null }
    });

    const studentCount = await User.count({
      where: { role: 'student', deleted_at: null }
    });

    // 2. 班级数统计
    const classCount = await Class.count({
      where: { deleted_at: null }
    });

    const activeClassCount = await Class.count({
      where: { status: 1, deleted_at: null }
    });

    // 3. 最近7天活跃度趋势（登录次数 + 作业提交）
    const Log = require('../models/Log');
    const activityTrend = [];
    const now = new Date();
    
    // 从6天前到今天，共7天
    for (let i = 6; i >= 0; i--) {
      // 计算目标日期（不包含时间）
      const year = now.getFullYear();
      const month = now.getMonth();
      const day = now.getDate();
      
      // 设置一天的开始时间（00:00:00）
      const startOfDay = new Date(year, month, day - i, 0, 0, 0, 0);
      
      // 设置一天的结束时间（23:59:59.999）
      const endOfDay = new Date(year, month, day - i, 23, 59, 59, 999);
      
      // 格式化日期字符串（YYYY-MM-DD）- 使用本地时区
      const targetDate = new Date(year, month, day - i);
      const dateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;

      // 查询当天的活跃用户数（包括登录和日常访问）
      // 使用 COUNT(DISTINCT user_id) 统计不重复的用户
      const loginResult = await Log.findAll({
        where: {
          action: {
            [Op.in]: ['login', 'daily_active']
          },
          created_at: {
            [Op.between]: [startOfDay, endOfDay]
          }
        },
        attributes: [[Log.sequelize.fn('COUNT', Log.sequelize.fn('DISTINCT', Log.sequelize.col('user_id'))), 'count']],
        raw: true
      });
      const loginCount = loginResult[0]?.count || 0;

      // 查询当天的作业提交次数
      const submissionCount = await Submission.count({
        where: {
          submitted_at: {
            [Op.between]: [startOfDay, endOfDay]
          },
          status: {
            [Op.in]: ['submitted', 'graded']
          }
        }
      });

      activityTrend.push({
        date: dateStr,
        活跃用户: loginCount,
        作业提交: submissionCount
      });
    }

    // 4. 最近注册的用户
    const recentUsers = await User.findAll({
      where: { deleted_at: null },
      attributes: ['id', 'name', 'role', 'phone', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 5
    });

    // 5. 活跃班级统计
    const activeClasses = await Class.findAll({
      where: { status: 1, deleted_at: null },
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name'],
          required: false
        }
      ],
      order: [['student_count', 'DESC']],
      limit: 5
    });

    // 6. 作业数量统计
    const assignmentCount = await Assignment.count({
      where: { deleted_at: null }
    });

    // 7. 资源数量统计
    const resourceCount = await Resource.count({
      where: { deleted_at: null }
    });

    // 8. 获取最近的操作日志
    const recentLogs = await Log.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name'],
          required: false
        }
      ]
    });

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        userCount: {
          total: totalUsers,
          admin: adminCount,
          teacher: teacherCount,
          student: studentCount
        },
        classCount: {
          total: classCount,
          active: activeClassCount
        },
        assignmentCount,
        resourceCount,
        activityTrend,
        recentUsers: recentUsers.map(u => ({
          id: u.id,
          name: u.name,
          role: u.role,
          phone: u.phone,
          createdAt: u.created_at
        })),
        activeClasses: activeClasses.map(c => ({
          id: c.id,
          name: c.name,
          grade: c.grade,
          teacherName: c.teacher ? c.teacher.name : null,
          studentCount: c.student_count,
          status: 1 // 活跃班级状态为1
        })),
        recentLogs: recentLogs.map(log => ({
          id: log.id,
          userName: log.user ? log.user.name : '匿名',
          action: log.action,
          description: log.description,
          ipAddress: log.ip_address,
          createdAt: log.created_at
        })),
        storage: {
          used: 0, // 后续补充对象存储使用量
          total: 10737418240 // 10GB
        }
      }
    });
  } catch (error) {
    console.error('获取管理员仪表盘数据失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 获取教师仪表盘统计数据
 * GET /api/statistics/teacher-dashboard
 */
async function getTeacherDashboard(req, res) {
  try {
    const teacherId = req.user.id;

    // 获取教师信息（包含 class_id）
    const teacher = await User.findByPk(teacherId, {
      attributes: ['id', 'class_id']
    });

    // 1. 获取教师相关的所有班级ID（三个来源）
    const classIdsSet = new Set();

    // 来源1: 教师作为班主任的班级
    const classesByTeacher = await Class.findAll({
      where: { 
        teacher_id: teacherId,
        deleted_at: null 
      },
      attributes: ['id']
    });
    classesByTeacher.forEach(c => classIdsSet.add(c.id));

    // 来源2: 教师所在的班级（users.class_id）
    if (teacher && teacher.class_id) {
      classIdsSet.add(teacher.class_id);
    }

    // 来源3: 教师创建的作业涉及的班级
    const assignmentClasses = await Assignment.findAll({
      where: {
        teacher_id: teacherId,
        deleted_at: null
      },
      attributes: ['class_id'],
      group: ['class_id']
    });
    assignmentClasses.forEach(a => {
      if (a.class_id) classIdsSet.add(a.class_id);
    });

    const classIds = Array.from(classIdsSet);
    
    // 2. 获取班级数和学生总数
    const classCount = classIds.length;
    const studentCount = classIds.length > 0 ? await User.count({
      where: {
        role: 'student',
        class_id: { [Op.in]: classIds },
        deleted_at: null
      }
    }) : 0;

    // 3. 获取作业数量统计
    const totalAssignments = await Assignment.count({
      where: {
        teacher_id: teacherId,
        deleted_at: null
      }
    });

    const publishedAssignments = await Assignment.count({
      where: {
        teacher_id: teacherId,
        status: 'published',
        deleted_at: null
      }
    });

    const draftAssignments = await Assignment.count({
      where: {
        teacher_id: teacherId,
        status: 'draft',
        deleted_at: null
      }
    });

    // 4. 获取待批改作业数量
    const teacherAssignments = await Assignment.findAll({
      where: {
        teacher_id: teacherId,
        deleted_at: null
      },
      attributes: ['id']
    });

    const assignmentIds = teacherAssignments.map(a => a.id);

    const pendingGrading = assignmentIds.length > 0 ? await Submission.count({
      where: {
        assignment_id: { [Op.in]: assignmentIds },
        status: 'submitted'
      }
    }) : 0;

    // 5. 获取资源数量
    const resourceCount = await Resource.count({
      where: {
        uploader_id: teacherId,
        deleted_at: null
      }
    });

    // 6. 获取最近的作业列表（前5条）
    const recentAssignments = await Assignment.findAll({
      where: {
        teacher_id: teacherId,
        deleted_at: null
      },
      attributes: ['id', 'title', 'subject', 'status', 'deadline', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 5
    });

    // 7. 教师相关的班级列表（来自前面计算的 classIds）
    const classes = classIds.length > 0 ? await Class.findAll({
      where: { 
        id: { [Op.in]: classIds },
        deleted_at: null 
      },
      attributes: ['id', 'name', 'grade', 'student_count'],
      order: [['created_at', 'DESC']],
      limit: 10
    }) : [];

    // 8. 获取最近上传的资源（前3条）
    const recentResources = await Resource.findAll({
      where: {
        uploader_id: teacherId,
        deleted_at: null
      },
      attributes: ['id', 'title', 'subject', 'category', 'type', 'file_name', 'file_url', 'file_size', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 3
    });

    // 9. 各学科作业完成情况统计
    const subjectStats = [];
    if (assignmentIds.length > 0) {
      // 获取各学科的作业统计
      const assignments = await Assignment.findAll({
        where: {
          teacher_id: teacherId,
          deleted_at: null,
          status: 'published'
        },
        attributes: ['id', 'subject']
      });

      // 按学科分组统计
      const subjectMap = new Map();
      for (const assignment of assignments) {
        const subject = assignment.subject || '其他';
        if (!subjectMap.has(subject)) {
          subjectMap.set(subject, { total: 0, submitted: 0 });
        }
        const stats = subjectMap.get(subject);
        stats.total++;
        
        // 统计该作业的提交数
        const submissionCount = await Submission.count({
          where: {
            assignment_id: assignment.id,
            status: { [Op.in]: ['submitted', 'graded'] }
          }
        });
        stats.submitted += submissionCount;
      }

      // 转换为数组格式
      for (const [subject, stats] of subjectMap.entries()) {
        subjectStats.push({
          subject,
          total: stats.total,
          submitted: stats.submitted,
          completionRate: stats.total > 0 ? Math.round((stats.submitted / stats.total) * 100) : 0
        });
      }
    }

    // 10. 学生周活跃度趋势（最近7天）
    const Log = require('../models/Log');
    const studentActivityTrend = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const year = now.getFullYear();
      const month = now.getMonth();
      const day = now.getDate();
      
      const startOfDay = new Date(year, month, day - i, 0, 0, 0, 0);
      const endOfDay = new Date(year, month, day - i, 23, 59, 59, 999);
      
      const targetDate = new Date(year, month, day - i);
      const dateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;

      // 统计教师班级学生的活跃数
      let activeStudents = 0;
      let submissions = 0;
      
      if (classIds.length > 0) {
        // 获取班级内的学生ID列表
        const students = await User.findAll({
          where: {
            role: 'student',
            class_id: { [Op.in]: classIds },
            deleted_at: null
          },
          attributes: ['id']
        });
        const studentIds = students.map(s => s.id);

        if (studentIds.length > 0) {
          // 统计活跃学生数（登录或访问）
          const activeResult = await Log.findAll({
            where: {
              user_id: { [Op.in]: studentIds },
              action: { [Op.in]: ['login', 'daily_active'] },
              created_at: { [Op.between]: [startOfDay, endOfDay] }
            },
            attributes: [[Log.sequelize.fn('COUNT', Log.sequelize.fn('DISTINCT', Log.sequelize.col('user_id'))), 'count']],
            raw: true
          });
          activeStudents = activeResult[0]?.count || 0;

          // 统计作业提交数
          if (assignmentIds.length > 0) {
            submissions = await Submission.count({
              where: {
                student_id: { [Op.in]: studentIds },
                assignment_id: { [Op.in]: assignmentIds },
                submitted_at: { [Op.between]: [startOfDay, endOfDay] },
                status: { [Op.in]: ['submitted', 'graded'] }
              }
            });
          }
        }
      }

      studentActivityTrend.push({
        date: dateStr,
        活跃学生: activeStudents,
        作业提交: submissions
      });
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        classCount,
        studentCount,
        assignmentCount: {
          total: totalAssignments,
          published: publishedAssignments,
          draft: draftAssignments
        },
        pendingGrading,
        resourceCount,
        classes: classes.map(c => ({
          id: c.id,
          name: c.name,
          grade: c.grade,
          studentCount: c.student_count
        })),
        recentAssignments: recentAssignments.map(a => ({
          id: a.id,
          title: a.title,
          subject: a.subject,
          status: a.status,
          deadline: a.deadline,
          createdAt: a.created_at
        })),
        recentResources: recentResources.map(r => ({
          id: r.id,
          title: r.title,
          subject: r.subject,
          category: r.category,
          type: r.type,
          fileName: r.file_name,
          fileUrl: r.file_url,
          fileSize: r.file_size,
          createdAt: r.created_at
        })),
        subjectStats,
        studentActivityTrend
      }
    });
  } catch (error) {
    console.error('获取教师仪表盘数据失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 获取学生仪表盘统计数据
 * GET /api/statistics/student-dashboard
 */
async function getStudentDashboard(req, res) {
  try {
    const studentId = req.user.id;

    // 获取学生信息
    const student = await User.findByPk(studentId, {
      include: [{
        model: Class,
        as: 'class',
        attributes: ['id', 'name', 'grade']
      }]
    });

    if (!student) {
      return res.status(404).json({
        code: 404,
        message: '学生不存在'
      });
    }

    // 获取学生班级的所有作业
    let totalAssignments = 0;
    let assignmentIds = [];

    if (student.class_id) {
      const assignments = await Assignment.findAll({
        where: {
          class_id: student.class_id,
          status: 'published',
          deleted_at: null
        },
        attributes: ['id']
      });
      totalAssignments = assignments.length;
      assignmentIds = assignments.map(a => a.id);
    }

    // 获取学生的提交记录
    const mySubmissions = await Submission.findAll({
      where: {
        student_id: studentId
      },
      include: [{
        model: Assignment,
        as: 'assignment',
        attributes: ['id', 'title', 'subject', 'deadline'],
        required: false
      }]
    });

    // 统计作业数量
    const submittedCount = mySubmissions.filter(s => s.status === 'submitted' || s.status === 'graded').length;
    const pendingCount = totalAssignments - submittedCount;

    // 计算平均分
    const gradedSubmissions = mySubmissions.filter(s => s.score !== null && s.status === 'graded');
    const averageScore = gradedSubmissions.length > 0 
      ? Math.round(gradedSubmissions.reduce((sum, s) => sum + s.score, 0) / gradedSubmissions.length * 10) / 10
      : 0;

    // 获取最近的提交记录（包含已批改和已提交的）
    const recentSubmissions = mySubmissions
      .filter(s => s.status === 'submitted' || s.status === 'graded')
      .sort((a, b) => {
        const dateA = a.graded_at || a.submitted_at || a.created_at;
        const dateB = b.graded_at || b.submitted_at || b.created_at;
        return new Date(dateB) - new Date(dateA);
      })
      .slice(0, 5)
      .map(s => ({
        id: s.id,
        assignment_id: s.assignment_id,
        assignment_title: s.assignment ? s.assignment.title : null,
        subject: s.assignment ? s.assignment.subject : null,
        score: s.score,
        status: s.status,
        submitted_at: s.submitted_at,
        graded_at: s.graded_at
      }));

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        classInfo: student.class ? {
          id: student.class.id,
          name: student.class.name,
          grade: student.class.grade
        } : null,
        assignmentCount: {
          total: totalAssignments,
          submitted: submittedCount,
          pending: pendingCount
        },
        averageScore,
        recentSubmissions,
        learningProgress: [] // 学习进度数据，可后续补充
      }
    });
  } catch (error) {
    console.error('获取学生仪表盘数据失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

module.exports = {
  getAdminDashboard,
  getTeacherDashboard,
  getStudentDashboard
};

