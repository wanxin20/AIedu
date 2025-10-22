const { Submission, Assignment, User } = require('../models');

/**
 * 提交作业（学生）
 * POST /api/submissions
 */
async function submitAssignment(req, res) {
  try {
    const { assignmentId, content, attachments } = req.body;

    if (!assignmentId) {
      return res.status(400).json({
        code: 400,
        message: '作业ID不能为空'
      });
    }

    // 验证作业是否存在且已发布
    const assignment = await Assignment.findOne({
      where: { id: assignmentId, deleted_at: null, status: 'published' }
    });

    if (!assignment) {
      return res.status(404).json({
        code: 404,
        message: '作业不存在或未发布'
      });
    }

    // 检查截止时间
    if (new Date() > assignment.deadline) {
      return res.status(400).json({
        code: 400,
        message: '作业已过截止时间'
      });
    }

    // 查找或创建提交记录
    let [submission, created] = await Submission.findOrCreate({
      where: {
        assignment_id: assignmentId,
        student_id: req.user.id
      },
      defaults: {
        assignment_id: assignmentId,
        student_id: req.user.id,
        content,
        attachments: attachments || null,
        status: 'submitted',
        submitted_at: new Date()
      }
    });

    // 如果已存在，更新提交内容
    if (!created) {
      submission.content = content;
      submission.attachments = attachments || null;
      submission.status = 'submitted';
      submission.submitted_at = new Date();
      await submission.save();
    }

    res.json({
      code: 200,
      message: '提交成功',
      data: {
        id: submission.id,
        status: submission.status,
        submittedAt: submission.submitted_at
      }
    });
  } catch (error) {
    console.error('提交作业失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 获取提交详情
 * GET /api/submissions/:id
 */
async function getSubmissionDetail(req, res) {
  try {
    const { id } = req.params;

    const submission = await Submission.findByPk(id, {
      include: [
        {
          model: Assignment,
          as: 'assignment',
          attributes: ['id', 'title', 'subject', 'deadline', 'total_score']
        },
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
      ]
    });

    if (!submission) {
      return res.status(404).json({
        code: 404,
        message: '提交记录不存在'
      });
    }

    // 权限检查
    if (req.user.role === 'student' && submission.student_id !== req.user.id) {
      return res.status(403).json({
        code: 403,
        message: '无权查看此提交'
      });
    }

    const data = submission.toJSON();

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        id: data.id,
        assignmentId: data.assignment_id,
        assignmentTitle: data.assignment ? data.assignment.title : null,
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
        createdAt: data.created_at
      }
    });
  } catch (error) {
    console.error('获取提交详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 批改作业（教师）
 * POST /api/submissions/:id/grade
 */
async function gradeSubmission(req, res) {
  try {
    const { id } = req.params;
    const { score, comment } = req.body;

    if (score === undefined) {
      return res.status(400).json({
        code: 400,
        message: '分数不能为空'
      });
    }

    const submission = await Submission.findByPk(id, {
      include: [
        {
          model: Assignment,
          as: 'assignment',
          attributes: ['id', 'teacher_id', 'total_score']
        }
      ]
    });

    if (!submission) {
      return res.status(404).json({
        code: 404,
        message: '提交记录不存在'
      });
    }

    // 权限检查
    if (submission.assignment.teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '无权批改此作业'
      });
    }

    // 验证分数范围
    if (score < 0 || score > submission.assignment.total_score) {
      return res.status(400).json({
        code: 400,
        message: `分数必须在0-${submission.assignment.total_score}之间`
      });
    }

    // 更新批改信息
    submission.score = score;
    submission.comment = comment || null;
    submission.status = 'graded';
    submission.graded_at = new Date();
    submission.graded_by = req.user.id;
    await submission.save();

    res.json({
      code: 200,
      message: '批改成功',
      data: {
        id: submission.id,
        score: submission.score,
        status: submission.status,
        gradedAt: submission.graded_at
      }
    });
  } catch (error) {
    console.error('批改作业失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 获取学生的所有提交记录
 * GET /api/submissions/my
 */
async function getMySubmissions(req, res) {
  try {
    const submissions = await Submission.findAll({
      where: { student_id: req.user.id },
      include: [
        {
          model: Assignment,
          as: 'assignment',
          attributes: ['id', 'title', 'subject', 'deadline', 'total_score', 'status'],
          where: { deleted_at: null },
          required: true
        }
      ],
      order: [['created_at', 'DESC']]
    });

    const items = submissions.map(submission => {
      const data = submission.toJSON();
      return {
        id: data.id,
        assignmentId: data.assignment_id,
        assignmentTitle: data.assignment ? data.assignment.title : null,
        subject: data.assignment ? data.assignment.subject : null,
        deadline: data.assignment ? data.assignment.deadline : null,
        totalScore: data.assignment ? data.assignment.total_score : null,
        score: data.score,
        comment: data.comment,
        status: data.status,
        submittedAt: data.submitted_at,
        gradedAt: data.graded_at,
        createdAt: data.created_at
      };
    });

    res.json({
      code: 200,
      message: '获取成功',
      data: items
    });
  } catch (error) {
    console.error('获取提交记录失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 根据作业ID获取学生的提交记录
 * GET /api/submissions/assignment/:assignmentId
 */
async function getSubmissionByAssignment(req, res) {
  try {
    const { assignmentId } = req.params;
    const studentId = req.user.id;

    // 查找提交记录
    const submission = await Submission.findOne({
      where: {
        assignment_id: assignmentId,
        student_id: studentId
      },
      include: [
        {
          model: Assignment,
          as: 'assignment',
          attributes: ['id', 'title', 'subject', 'deadline', 'description', 'attachments']
        },
        {
          model: User,
          as: 'grader',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!submission) {
      // 如果没有提交记录，返回空但不报错（学生可能还没提交）
      return res.json({
        code: 200,
        message: '暂无提交记录',
        data: null
      });
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        id: submission.id,
        assignmentId: submission.assignment_id,
        studentId: submission.student_id,
        content: submission.content,
        attachments: submission.attachments,
        status: submission.status,
        score: submission.score,
        comment: submission.comment,
        submittedAt: submission.submitted_at,
        gradedAt: submission.graded_at,
        gradedBy: submission.grader?.name || submission.graded_by,
        createdAt: submission.created_at
      }
    });
  } catch (error) {
    console.error('获取提交记录失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

module.exports = {
  submitAssignment,
  getSubmissionDetail,
  gradeSubmission,
  getMySubmissions,
  getSubmissionByAssignment
};

