const { User, Class } = require('../models');
const { Op } = require('sequelize');

/**
 * 获取活跃班级列表（公开接口，用于注册）
 * GET /api/classes/public/active
 */
async function getActiveClassesForRegistration(req, res) {
  try {
    // 只返回状态为1（活跃）的班级
    const classes = await Class.findAll({
      where: { 
        status: 1,
        deleted_at: null 
      },
      attributes: ['id', 'name', 'grade'],
      order: [['grade', 'ASC'], ['name', 'ASC']],
      limit: 100
    });

    const items = classes.map(cls => ({
      id: cls.id,
      name: cls.name,
      grade: cls.grade
    }));

    res.json({
      code: 200,
      message: '获取成功',
      data: items
    });
  } catch (error) {
    console.error('获取活跃班级列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 获取班级列表
 * GET /api/classes?page=1&pageSize=20&grade=高一&status=1
 */
async function getClassList(req, res) {
  try {
    const { 
      page = 1, 
      pageSize = 20, 
      grade,
      status,
      keyword 
    } = req.query;

    // 构建查询条件
    const where = {};

    // 年级筛选
    if (grade) {
      where.grade = grade;
    }

    // 状态筛选
    if (status !== undefined) {
      where.status = parseInt(status);
    }

    // 关键字搜索（班级名称）
    if (keyword) {
      where.name = { [Op.like]: `%${keyword}%` };
    }

    // 软删除过滤
    where.deleted_at = null;

    // 计算偏移量
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    // 查询班级列表
    const { count, rows } = await Class.findAndCountAll({
      where,
      offset,
      limit,
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'phone'],
          required: false
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // 格式化返回数据
    const items = rows.map(cls => {
      const classData = cls.toJSON();
      return {
        id: classData.id,
        name: classData.name,
        grade: classData.grade,
        teacherId: classData.teacher_id,
        teacherName: classData.teacher ? classData.teacher.name : null,
        studentCount: classData.student_count,
        status: classData.status,
        description: classData.description,
        createdAt: classData.created_at,
        updatedAt: classData.updated_at
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
    console.error('获取班级列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 获取班级详情
 * GET /api/classes/:id
 */
async function getClassDetail(req, res) {
  try {
    const { id } = req.params;

    // 查询班级
    const cls = await Class.findOne({
      where: { id, deleted_at: null },
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'phone', 'subject'],
          required: false
        }
      ]
    });

    if (!cls) {
      return res.status(404).json({
        code: 404,
        message: '班级不存在'
      });
    }

    const classData = cls.toJSON();

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        id: classData.id,
        name: classData.name,
        grade: classData.grade,
        teacherId: classData.teacher_id,
        teacherName: classData.teacher ? classData.teacher.name : null,
        teacherPhone: classData.teacher ? classData.teacher.phone : null,
        teacherSubject: classData.teacher ? classData.teacher.subject : null,
        studentCount: classData.student_count,
        status: classData.status,
        description: classData.description,
        createdAt: classData.created_at,
        updatedAt: classData.updated_at
      }
    });
  } catch (error) {
    console.error('获取班级详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 创建班级
 * POST /api/classes
 */
async function createClass(req, res) {
  try {
    const { name, grade, teacherId, description } = req.body;

    // 验证必填字段
    if (!name || !grade) {
      return res.status(400).json({
        code: 400,
        message: '班级名称和年级不能为空'
      });
    }

    // 如果指定了班主任，验证教师是否存在
    if (teacherId) {
      const teacher = await User.findOne({
        where: { 
          id: teacherId, 
          role: 'teacher',
          deleted_at: null 
        }
      });

      if (!teacher) {
        return res.status(404).json({
          code: 404,
          message: '指定的教师不存在'
        });
      }
    }

    // 检查班级名称是否已存在
    const existingClass = await Class.findOne({
      where: { name, deleted_at: null }
    });

    if (existingClass) {
      return res.status(409).json({
        code: 409,
        message: '班级名称已存在'
      });
    }

    // 创建班级
    const cls = await Class.create({
      name,
      grade,
      teacher_id: teacherId || null,
      description: description || null,
      status: 1,
      student_count: 0
    });

    res.status(201).json({
      code: 200,
      message: '创建成功',
      data: {
        id: cls.id,
        name: cls.name,
        grade: cls.grade,
        teacherId: cls.teacher_id,
        status: cls.status,
        createdAt: cls.created_at
      }
    });
  } catch (error) {
    console.error('创建班级失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 更新班级
 * PUT /api/classes/:id
 */
async function updateClass(req, res) {
  try {
    const { id } = req.params;
    const { name, grade, teacherId, description, status } = req.body;

    // 查询班级
    const cls = await Class.findOne({
      where: { id, deleted_at: null }
    });

    if (!cls) {
      return res.status(404).json({
        code: 404,
        message: '班级不存在'
      });
    }

    // 如果要更新班主任，验证教师是否存在
    if (teacherId !== undefined && teacherId !== null) {
      const teacher = await User.findOne({
        where: { 
          id: teacherId, 
          role: 'teacher',
          deleted_at: null 
        }
      });

      if (!teacher) {
        return res.status(404).json({
          code: 404,
          message: '指定的教师不存在'
        });
      }
    }

    // 如果要更新班级名称，检查是否与其他班级重复
    if (name && name !== cls.name) {
      const existingClass = await Class.findOne({
        where: { 
          name, 
          id: { [Op.ne]: id },
          deleted_at: null 
        }
      });

      if (existingClass) {
        return res.status(409).json({
          code: 409,
          message: '班级名称已存在'
        });
      }
    }

    // 更新字段
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (grade !== undefined) updateData.grade = grade;
    if (teacherId !== undefined) updateData.teacher_id = teacherId;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;

    await cls.update(updateData);

    res.json({
      code: 200,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新班级失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 删除班级（软删除）
 * DELETE /api/classes/:id
 */
async function deleteClass(req, res) {
  try {
    const { id } = req.params;

    // 查询班级
    const cls = await Class.findOne({
      where: { id, deleted_at: null }
    });

    if (!cls) {
      return res.status(404).json({
        code: 404,
        message: '班级不存在'
      });
    }

    // 检查班级是否还有学生
    const studentCount = await User.count({
      where: { 
        class_id: id,
        role: 'student',
        deleted_at: null 
      }
    });

    if (studentCount > 0) {
      return res.status(400).json({
        code: 400,
        message: `班级还有 ${studentCount} 名学生，无法删除。请先转移学生到其他班级。`
      });
    }

    // 软删除
    cls.deleted_at = new Date();
    await cls.save();

    res.json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除班级失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 获取班级学生列表
 * GET /api/classes/:id/students
 */
async function getClassStudents(req, res) {
  try {
    const { id } = req.params;

    // 查询班级是否存在
    const cls = await Class.findOne({
      where: { id, deleted_at: null }
    });

    if (!cls) {
      return res.status(404).json({
        code: 404,
        message: '班级不存在'
      });
    }

    // 查询该班级的所有学生
    const students = await User.findAll({
      where: { 
        class_id: id,
        role: 'student',
        deleted_at: null 
      },
      attributes: { exclude: ['password'] },
      order: [['name', 'ASC']]
    });

    // 格式化返回数据
    const items = students.map(student => {
      const studentData = student.toJSON();
      return {
        id: studentData.id,
        name: studentData.name,
        phone: studentData.phone,
        avatar: studentData.avatar,
        email: studentData.email,
        status: studentData.status,
        lastLoginAt: studentData.last_login_at,
        createdAt: studentData.created_at
      };
    });

    // 更新班级学生人数（如果不一致）
    if (cls.student_count !== students.length) {
      cls.student_count = students.length;
      await cls.save();
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: items
    });
  } catch (error) {
    console.error('获取班级学生失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

module.exports = {
  getActiveClassesForRegistration,
  getClassList,
  getClassDetail,
  createClass,
  updateClass,
  deleteClass,
  getClassStudents
};

