const { LessonPlan, User } = require('../models');
const { Op } = require('sequelize');

/**
 * 获取教案列表
 * GET /api/lesson-plans?page=1&pageSize=20&subject=数学&grade=高一
 */
async function getLessonPlanList(req, res) {
  try {
    const { 
      page = 1, 
      pageSize = 20, 
      subject,
      grade,
      teacherId,
      status,
      keyword
    } = req.query;

    const where = { deleted_at: null };

    // 根据角色限制查询范围
    if (req.user.role === 'teacher') {
      where.teacher_id = req.user.id;
    }

    // 筛选条件
    if (subject) where.subject = subject;
    if (grade) where.grade = grade;
    if (teacherId) where.teacher_id = teacherId;
    if (status) where.status = status;
    
    // 关键字搜索
    if (keyword) {
      where[Op.or] = [
        { title: { [Op.like]: `%${keyword}%` } },
        { objectives: { [Op.like]: `%${keyword}%` } }
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    const { count, rows } = await LessonPlan.findAndCountAll({
      where,
      offset,
      limit,
      attributes: { exclude: ['content'] }, // 列表不返回完整内容
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'subject']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    const items = rows.map(plan => {
      const data = plan.toJSON();
      return {
        id: data.id,
        title: data.title,
        subject: data.subject,
        grade: data.grade,
        teacherId: data.teacher_id,
        teacherName: data.teacher ? data.teacher.name : null,
        objectives: data.objectives,
        duration: data.duration,
        tags: data.tags,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at
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
    console.error('获取教案列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 获取教案详情
 * GET /api/lesson-plans/:id
 */
async function getLessonPlanDetail(req, res) {
  try {
    const { id } = req.params;

    const plan = await LessonPlan.findOne({
      where: { id, deleted_at: null },
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'phone', 'subject']
        }
      ]
    });

    if (!plan) {
      return res.status(404).json({
        code: 404,
        message: '教案不存在'
      });
    }

    // 权限检查：教师只能查看自己的教案
    if (req.user.role === 'teacher' && plan.teacher_id !== req.user.id) {
      return res.status(403).json({
        code: 403,
        message: '无权查看此教案'
      });
    }

    const data = plan.toJSON();

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        id: data.id,
        title: data.title,
        subject: data.subject,
        grade: data.grade,
        teacherId: data.teacher_id,
        teacherName: data.teacher ? data.teacher.name : null,
        content: data.content,
        objectives: data.objectives,
        materials: data.materials,
        duration: data.duration,
        tags: data.tags,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    });
  } catch (error) {
    console.error('获取教案详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 创建教案
 * POST /api/lesson-plans
 */
async function createLessonPlan(req, res) {
  try {
    const { title, subject, grade, content, objectives, materials, duration, tags } = req.body;

    // 验证必填字段
    if (!title || !subject || !grade || !content) {
      return res.status(400).json({
        code: 400,
        message: '标题、学科、年级和内容不能为空'
      });
    }

    // 创建教案
    const plan = await LessonPlan.create({
      title,
      subject,
      grade,
      teacher_id: req.user.id,
      content,
      objectives: objectives || null,
      materials: materials || null,
      duration: duration || 45,
      tags: tags || null,
      status: 'draft'
    });

    res.status(201).json({
      code: 200,
      message: '创建成功',
      data: {
        id: plan.id,
        title: plan.title,
        status: plan.status,
        createdAt: plan.created_at
      }
    });
  } catch (error) {
    console.error('创建教案失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 更新教案
 * PUT /api/lesson-plans/:id
 */
async function updateLessonPlan(req, res) {
  try {
    const { id } = req.params;
    const { title, subject, grade, content, objectives, materials, duration, tags, status } = req.body;

    const plan = await LessonPlan.findOne({
      where: { id, deleted_at: null }
    });

    if (!plan) {
      return res.status(404).json({
        code: 404,
        message: '教案不存在'
      });
    }

    // 权限检查
    if (plan.teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '无权修改此教案'
      });
    }

    // 更新字段
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (subject !== undefined) updateData.subject = subject;
    if (grade !== undefined) updateData.grade = grade;
    if (content !== undefined) updateData.content = content;
    if (objectives !== undefined) updateData.objectives = objectives;
    if (materials !== undefined) updateData.materials = materials;
    if (duration !== undefined) updateData.duration = duration;
    if (tags !== undefined) updateData.tags = tags;
    if (status !== undefined) updateData.status = status;

    await plan.update(updateData);

    res.json({
      code: 200,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新教案失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 删除教案
 * DELETE /api/lesson-plans/:id
 */
async function deleteLessonPlan(req, res) {
  try {
    const { id } = req.params;

    const plan = await LessonPlan.findOne({
      where: { id, deleted_at: null }
    });

    if (!plan) {
      return res.status(404).json({
        code: 404,
        message: '教案不存在'
      });
    }

    // 权限检查
    if (plan.teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '无权删除此教案'
      });
    }

    // 软删除
    plan.deleted_at = new Date();
    await plan.save();

    res.json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除教案失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 发布教案
 * POST /api/lesson-plans/:id/publish
 */
async function publishLessonPlan(req, res) {
  try {
    const { id } = req.params;

    const plan = await LessonPlan.findOne({
      where: { id, deleted_at: null }
    });

    if (!plan) {
      return res.status(404).json({
        code: 404,
        message: '教案不存在'
      });
    }

    // 权限检查
    if (plan.teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '无权发布此教案'
      });
    }

    // 发布教案
    plan.status = 'published';
    await plan.save();

    res.json({
      code: 200,
      message: '发布成功'
    });
  } catch (error) {
    console.error('发布教案失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

module.exports = {
  getLessonPlanList,
  getLessonPlanDetail,
  createLessonPlan,
  updateLessonPlan,
  deleteLessonPlan,
  publishLessonPlan
};

