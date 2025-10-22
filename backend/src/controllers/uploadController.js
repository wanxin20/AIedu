const path = require('path');
const { uploadFile, deleteFile } = require('../config/storage');

/**
 * 生成唯一文件名
 * 格式：类型/时间戳_原始文件名
 * 这样既保持了原始文件名的可读性，又避免了同名文件覆盖
 */
function generateUniqueFilename(originalname, fileType) {
  const timestamp = Date.now();
  // 直接使用原始文件名，在前面加上时间戳避免覆盖
  return `${fileType}/${timestamp}_${originalname}`;
}

/**
 * 上传单个文件到对象存储
 * POST /api/upload
 */
async function uploadFileToStorage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        code: 400,
        message: '未选择文件'
      });
    }

    const file = req.file;
    const fileType = req.body.type || 'other';

    // 生成对象名称
    const objectName = generateUniqueFilename(file.originalname, fileType);

    // 准备元数据
    const metadata = {
      'Content-Type': file.mimetype,
      'Original-Name': Buffer.from(file.originalname).toString('base64')
    };

    // 上传到对象存储
    const fileUrl = await uploadFile(
      objectName,
      file.buffer,
      file.size,
      metadata
    );

    res.json({
      code: 200,
      message: '上传成功',
      data: {
        url: fileUrl,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        objectName: objectName
      }
    });
  } catch (error) {
    console.error('文件上传失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 上传多个文件到对象存储
 * POST /api/upload/multiple
 */
async function uploadMultipleFilesToStorage(req, res) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '未选择文件'
      });
    }

    const fileType = req.body.type || 'other';
    const uploadPromises = [];

    // 批量上传
    for (const file of req.files) {
      const objectName = generateUniqueFilename(file.originalname, fileType);
      const metadata = {
        'Content-Type': file.mimetype,
        'Original-Name': Buffer.from(file.originalname).toString('base64')
      };

      uploadPromises.push(
        uploadFile(objectName, file.buffer, file.size, metadata).then(url => ({
          url,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          objectName: objectName
        }))
      );
    }

    const files = await Promise.all(uploadPromises);

    res.json({
      code: 200,
      message: '上传成功',
      data: {
        files,
        count: files.length
      }
    });
  } catch (error) {
    console.error('批量上传失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 从对象存储删除文件
 * DELETE /api/upload
 */
async function deleteFileFromStorage(req, res) {
  try {
    const { objectName } = req.body;

    if (!objectName) {
      return res.status(400).json({
        code: 400,
        message: '对象名称不能为空'
      });
    }

    // 从URL中提取objectName（如果传入的是完整URL）
    let finalObjectName = objectName;
    if (objectName.startsWith('http')) {
      const urlParts = objectName.split('/');
      // 获取bucket后面的部分
      const bucketIndex = urlParts.findIndex(part => part.includes('aiedu'));
      if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
        finalObjectName = urlParts.slice(bucketIndex + 1).join('/');
      }
    }

    await deleteFile(finalObjectName);

    res.json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除文件失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

module.exports = {
  uploadFile: uploadFileToStorage,
  uploadMultipleFiles: uploadMultipleFilesToStorage,
  deleteFile: deleteFileFromStorage
};
