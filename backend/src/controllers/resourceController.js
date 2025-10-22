const { Resource, User } = require('../models');
const { Op } = require('sequelize');
const { deleteFile } = require('../config/storage');

/**
 * 获取资源列表
 * GET /api/resources?page=1&pageSize=20&category=课件&subject=数学
 */
async function getResourceList(req, res) {
  try {
    const { 
      page = 1, 
      pageSize = 20, 
      category,
      subject,
      type,
      uploaderId,
      keyword,
      status
    } = req.query;

    const where = { deleted_at: null };

    // 非管理员只能看到正常状态的资源
    if (req.user.role !== 'admin') {
      where.status = 1;
    } else if (status !== undefined) {
      where.status = parseInt(status);
    }

    // 教师只能看到自己上传的资源
    if (req.user.role === 'teacher') {
      where.uploader_id = req.user.id;
    }

    // 筛选条件
    if (category) where.category = category;
    if (subject) where.subject = subject;
    if (type) where.type = type;
    if (uploaderId && req.user.role === 'admin') where.uploader_id = uploaderId;
    
    // 关键字搜索
    if (keyword) {
      where[Op.or] = [
        { title: { [Op.like]: `%${keyword}%` } },
        { description: { [Op.like]: `%${keyword}%` } },
        { file_name: { [Op.like]: `%${keyword}%` } }
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    const { count, rows } = await Resource.findAndCountAll({
      where,
      offset,
      limit,
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'name', 'role']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    const items = rows.map(resource => {
      const data = resource.toJSON();
      return {
        id: data.id,
        title: data.title,
        description: data.description,
        type: data.type,
        category: data.category,
        subject: data.subject,
        fileName: data.file_name,
        fileUrl: data.file_url,
        fileSize: data.file_size,
        mimeType: data.mime_type,
        uploaderId: data.uploader_id,
        uploaderName: data.uploader ? data.uploader.name : null,
        downloadCount: data.download_count,
        viewCount: data.view_count,
        status: data.status,
        createdAt: data.created_at,
        // 为了向后兼容，也返回下划线命名的字段
        file_name: data.file_name,
        file_url: data.file_url,
        created_at: data.created_at,
        uploader_name: data.uploader ? data.uploader.name : null,
        view_count: data.view_count,
        download_count: data.download_count
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
    console.error('获取资源列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 获取资源详情
 * GET /api/resources/:id
 */
async function getResourceDetail(req, res) {
  try {
    const { id } = req.params;

    const resource = await Resource.findOne({
      where: { id, deleted_at: null },
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'name', 'role', 'phone']
        }
      ]
    });

    if (!resource) {
      return res.status(404).json({
        code: 404,
        message: '资源不存在'
      });
    }

    // 非管理员不能查看隐藏资源
    if (req.user.role !== 'admin' && resource.status === 0) {
      return res.status(403).json({
        code: 403,
        message: '无权访问此资源'
      });
    }

    // 增加查看次数
    resource.view_count += 1;
    await resource.save();

    const data = resource.toJSON();

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        id: data.id,
        title: data.title,
        description: data.description,
        type: data.type,
        category: data.category,
        subject: data.subject,
        fileName: data.file_name,
        fileUrl: data.file_url,
        fileSize: data.file_size,
        mimeType: data.mime_type,
        uploaderId: data.uploader_id,
        uploaderName: data.uploader ? data.uploader.name : null,
        downloadCount: data.download_count,
        viewCount: data.view_count,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    });
  } catch (error) {
    console.error('获取资源详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 创建资源（上传文件后调用）
 * POST /api/resources
 */
async function createResource(req, res) {
  try {
    const { title, description, type, category, subject, fileName, fileUrl, fileSize, mimeType } = req.body;

    // 验证必填字段
    if (!title || !type || !category || !subject || !fileName || !fileUrl) {
      return res.status(400).json({
        code: 400,
        message: '标题、类型、分类、学科、文件名和文件URL不能为空'
      });
    }

    // 创建资源记录
    const resource = await Resource.create({
      title,
      description,
      type,
      category,
      subject,
      file_name: fileName,
      file_url: fileUrl,
      file_size: fileSize || 0,
      mime_type: mimeType,
      uploader_id: req.user.id,
      status: 1
    });

    res.status(201).json({
      code: 200,
      message: '创建成功',
      data: {
        id: resource.id,
        title: resource.title,
        fileUrl: resource.file_url,
        createdAt: resource.created_at
      }
    });
  } catch (error) {
    console.error('创建资源失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 更新资源
 * PUT /api/resources/:id
 */
async function updateResource(req, res) {
  try {
    const { id } = req.params;
    const { title, description, category, subject, status } = req.body;

    const resource = await Resource.findOne({
      where: { id, deleted_at: null }
    });

    if (!resource) {
      return res.status(404).json({
        code: 404,
        message: '资源不存在'
      });
    }

    // 权限检查：只有管理员或资源上传者可以修改
    if (req.user.role !== 'admin' && resource.uploader_id !== req.user.id) {
      return res.status(403).json({
        code: 403,
        message: '无权修改此资源'
      });
    }

    // 更新字段
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (subject !== undefined) updateData.subject = subject;
    if (status !== undefined && req.user.role === 'admin') updateData.status = status;

    await resource.update(updateData);

    res.json({
      code: 200,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新资源失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 删除资源
 * DELETE /api/resources/:id
 */
async function deleteResource(req, res) {
  try {
    const { id } = req.params;

    const resource = await Resource.findOne({
      where: { id, deleted_at: null }
    });

    if (!resource) {
      return res.status(404).json({
        code: 404,
        message: '资源不存在'
      });
    }

    // 权限检查
    if (req.user.role !== 'admin' && resource.uploader_id !== req.user.id) {
      return res.status(403).json({
        code: 403,
        message: '无权删除此资源'
      });
    }

    // 软删除数据库记录
    resource.deleted_at = new Date();
    await resource.save();

    // 尝试删除对象存储中的文件
    try {
      if (resource.file_url) {
        // 从URL中提取objectName
        const urlParts = resource.file_url.split('/');
        const bucketIndex = urlParts.findIndex(part => part.includes('aiedu'));
        if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
          const objectName = urlParts.slice(bucketIndex + 1).join('/');
          await deleteFile(objectName);
        }
      }
    } catch (storageError) {
      console.error('删除对象存储文件失败:', storageError);
      // 不影响主流程
    }

    res.json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除资源失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 下载资源（增加下载次数和查看次数）
 * POST /api/resources/:id/download
 */
async function downloadResource(req, res) {
  try {
    const { id } = req.params;

    const resource = await Resource.findOne({
      where: { id, deleted_at: null }
    });

    if (!resource) {
      return res.status(404).json({
        code: 404,
        message: '资源不存在'
      });
    }

    // 非管理员不能下载隐藏资源
    if (req.user.role !== 'admin' && resource.status === 0) {
      return res.status(403).json({
        code: 403,
        message: '无权下载此资源'
      });
    }

    // 同时增加下载次数和查看次数
    resource.download_count += 1;
    resource.view_count += 1;
    await resource.save();

    res.json({
      code: 200,
      message: '获取下载链接成功',
      data: {
        fileUrl: resource.file_url,
        fileName: resource.file_name
      }
    });
  } catch (error) {
    console.error('下载资源失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

module.exports = {
  getResourceList,
  getResourceDetail,
  createResource,
  updateResource,
  deleteResource,
  downloadResource
};

