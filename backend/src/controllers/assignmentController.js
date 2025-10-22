const { Assignment, Submission, User, Class } = require('../models');
const { Op } = require('sequelize');

/**
 * 获取作业列表
 * GET /api/assignments?page=1&pageSize=20&classId=1&status=published
 */
async function getAssignmentList(req, res) {
  try {
    const { 
      page = 1, 
      pageSize = 20, 
      classId,
      subject,
      status,
      teacherId,
      keyword
    } = req.query;

    const where = { deleted_at: null };

    // 根据角色限制查询范围
    if (req.user.role === 'teacher') {
      where.teacher_id = req.user.id;
    } else if (req.user.role === 'student') {
      // 学生只能看到自己班级的已发布作业
      const student = await User.findByPk(req.user.id);
      where.class_id = student.class_id;
      where.status = 'published';
    }

    // 筛选条件
    if (classId) where.class_id = classId;
    if (subject) where.subject = subject;
    if (status) where.status = status;
    if (teacherId) where.teacher_id = teacherId;
    
    // 关键字搜索
    if (keyword) {
      where[Op.or] = [
        { title: { [Op.like]: `%${keyword}%` } },
        { description: { [Op.like]: `%${keyword}%` } }
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    const { count, rows } = await Assignment.findAndCountAll({
      where,
      offset,
      limit,
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'phone']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'grade']
        },
        {
          model: Submission,
          as: 'submissions',
          attributes: ['id', 'status', 'student_id'],
          required: false
        }
      ],
      order: [['created_at', 'DESC']]
    });

    const items = rows.map(assignment => {
      const data = assignment.toJSON();
      const submittedCount = data.submissions.filter(s => s.status !== 'pending').length;
      const gradedCount = data.submissions.filter(s => s.status === 'graded').length;
      
      return {
        id: data.id,
        title: data.title,
        description: data.description,
        subject: data.subject,
        teacherId: data.teacher_id,
        teacherName: data.teacher ? data.teacher.name : null,
        classId: data.class_id,
        className: data.class ? data.class.name : null,
        deadline: data.deadline,
        totalScore: data.total_score,
        attachments: data.attachments,
        status: data.status,
        submittedCount,
        gradedCount,
        totalCount: data.submissions.length,
        createdAt: data.created_at,
        // 为了向后兼容，也返回下划线命名的字段
        created_at: data.created_at,
        teacher_id: data.teacher_id,
        class_id: data.class_id
      };
    });

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        items
      }
    });
  } catch (error) {
    console.error('获取作业列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 获取作业详情
 * GET /api/assignments/:id
 */
async function getAssignmentDetail(req, res) {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findOne({
      where: { id, deleted_at: null },
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'phone', 'subject']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'grade', 'student_count']
        }
      ]
    });

    if (!assignment) {
      return res.status(404).json({
        code: 404,
        message: '作业不存在'
      });
    }

    // 权限检查
    if (req.user.role === 'student') {
      const student = await User.findByPk(req.user.id);
      if (assignment.class_id !== student.class_id || assignment.status !== 'published') {
        return res.status(403).json({
          code: 403,
          message: '无权访问此作业'
        });
      }
    } else if (req.user.role === 'teacher' && assignment.teacher_id !== req.user.id) {
      return res.status(403).json({
        code: 403,
        message: '无权访问此作业'
      });
    }

    const data = assignment.toJSON();

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        id: data.id,
        title: data.title,
        description: data.description,
        subject: data.subject,
        teacherId: data.teacher_id,
        teacherName: data.teacher ? data.teacher.name : null,
        classId: data.class_id,
        className: data.class ? data.class.name : null,
        deadline: data.deadline,
        totalScore: data.total_score,
        attachments: data.attachments,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    });
  } catch (error) {
    console.error('获取作业详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 创建作业
 * POST /api/assignments
 */
async function createAssignment(req, res) {
  try {
    const { title, description, subject, classId, deadline, totalScore, attachments } = req.body;

    // 验证必填字段
    if (!title || !subject || !classId || !deadline) {
      return res.status(400).json({
        code: 400,
        message: '标题、学科、班级和截止时间不能为空'
      });
    }

    // 验证班级是否存在
    const classExists = await Class.findOne({
      where: { id: classId, deleted_at: null }
    });

    if (!classExists) {
      return res.status(404).json({
        code: 404,
        message: '班级不存在'
      });
    }

    // 创建作业
    const assignment = await Assignment.create({
      title,
      description,
      subject,
      teacher_id: req.user.id,
      class_id: classId,
      deadline,
      total_score: totalScore || 100,
      attachments: attachments || null,
      status: 'draft'
    });

    res.status(201).json({
      code: 200,
      message: '创建成功',
      data: {
        id: assignment.id,
        title: assignment.title,
        status: assignment.status,
        createdAt: assignment.created_at
      }
    });
  } catch (error) {
    console.error('创建作业失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 更新作业
 * PUT /api/assignments/:id
 */
async function updateAssignment(req, res) {
  try {
    const { id } = req.params;
    const { title, description, subject, classId, deadline, totalScore, attachments, status } = req.body;

    const assignment = await Assignment.findOne({
      where: { id, deleted_at: null }
    });

    if (!assignment) {
      return res.status(404).json({
        code: 404,
        message: '作业不存在'
      });
    }

    // 权限检查
    if (assignment.teacher_id !== req.user.id) {
      return res.status(403).json({
        code: 403,
        message: '无权修改此作业'
      });
    }

    // 更新字段
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (subject !== undefined) updateData.subject = subject;
    if (classId !== undefined) updateData.class_id = classId;
    if (deadline !== undefined) updateData.deadline = deadline;
    if (totalScore !== undefined) updateData.total_score = totalScore;
    if (attachments !== undefined) updateData.attachments = attachments;
    if (status !== undefined) updateData.status = status;

    await assignment.update(updateData);

    res.json({
      code: 200,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新作业失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 发布作业
 * POST /api/assignments/:id/publish
 */
async function publishAssignment(req, res) {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findOne({
      where: { id, deleted_at: null }
    });

    if (!assignment) {
      return res.status(404).json({
        code: 404,
        message: '作业不存在'
      });
    }

    // 权限检查
    if (assignment.teacher_id !== req.user.id) {
      return res.status(403).json({
        code: 403,
        message: '无权发布此作业'
      });
    }

    // 发布作业
    assignment.status = 'published';
    await assignment.save();

    // 为班级所有学生创建提交记录
    const students = await User.findAll({
      where: {
        role: 'student',
        class_id: assignment.class_id,
        deleted_at: null
      }
    });

    const submissionPromises = students.map(student =>
      Submission.findOrCreate({
        where: {
          assignment_id: assignment.id,
          student_id: student.id
        },
        defaults: {
          assignment_id: assignment.id,
          student_id: student.id,
          status: 'pending'
        }
      })
    );

    await Promise.all(submissionPromises);

    res.json({
      code: 200,
      message: '发布成功'
    });
  } catch (error) {
    console.error('发布作业失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 删除作业
 * DELETE /api/assignments/:id
 */
async function deleteAssignment(req, res) {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findOne({
      where: { id, deleted_at: null }
    });

    if (!assignment) {
      return res.status(404).json({
        code: 404,
        message: '作业不存在'
      });
    }

    // 权限检查
    if (assignment.teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '无权删除此作业'
      });
    }

    // 软删除
    assignment.deleted_at = new Date();
    await assignment.save();

    res.json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除作业失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 获取作业提交列表
 * GET /api/assignments/:id/submissions
 */
async function getSubmissionList(req, res) {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findOne({
      where: { id, deleted_at: null }
    });

    if (!assignment) {
      return res.status(404).json({
        code: 404,
        message: '作业不存在'
      });
    }

    // 权限检查
    if (assignment.teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '无权查看作业提交'
      });
    }

    const submissions = await Submission.findAll({
      where: { assignment_id: id },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'phone', 'class_id']
        },
        {
          model: User,
          as: 'grader',
          attributes: ['id', 'name'],
          required: false
        }
      ],
      order: [['submitted_at', 'DESC']]
    });

    const items = submissions.map(submission => {
      const data = submission.toJSON();
      return {
        id: data.id,
        assignmentId: data.assignment_id,
        studentId: data.student_id,
        studentName: data.student ? data.student.name : null,
        content: data.content,
        attachments: data.attachments,
        score: data.score,
        comment: data.comment,
        status: data.status,
        submittedAt: data.submitted_at,
        gradedAt: data.graded_at,
        gradedBy: data.graded_by,
        graderName: data.grader ? data.grader.name : null,
        createdAt: data.created_at,
        // AI 批改字段
        aiGradingStatus: data.ai_grading_status || 'none',
        aiComment: data.ai_comment,
        aiGradedAt: data.ai_graded_at,
        aiErrorMessage: data.ai_error_message
      };
    });

    res.json({
      code: 200,
      message: '获取成功',
      data: items
    });
  } catch (error) {
    console.error('获取提交列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

module.exports = {
  getAssignmentList,
  getAssignmentDetail,
  createAssignment,
  updateAssignment,
  publishAssignment,
  deleteAssignment,
  getSubmissionList
};

