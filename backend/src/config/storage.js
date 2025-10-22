const Minio = require('minio');

/**
 * Sealos 对象存储配置
 */
const storageConfig = {
  endPoint: 'objectstorageapi.gzg.sealos.run',
  port: 443,
  useSSL: true,
  accessKey: 'ytzlf94p',
  secretKey: 'k7lvfqgtl876jfr9',
  bucket: 'ytzlf94p-edu' // 存储桶名称
};

/**
 * 创建 MinIO 客户端实例
 */
const minioClient = new Minio.Client({
  endPoint: storageConfig.endPoint,
  port: storageConfig.port,
  useSSL: storageConfig.useSSL,
  accessKey: storageConfig.accessKey,
  secretKey: storageConfig.secretKey,
  region: 'guangzhou' // 添加 region 参数
});

/**
 * 确保存储桶存在
 */
async function ensureBucket() {
  try {
    const exists = await minioClient.bucketExists(storageConfig.bucket);
    if (!exists) {
      console.log(`创建存储桶: ${storageConfig.bucket}`);
      await minioClient.makeBucket(storageConfig.bucket, 'us-east-1');
      
      // 设置存储桶为公共读权限（可选）
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${storageConfig.bucket}/*`]
          }
        ]
      };
      await minioClient.setBucketPolicy(storageConfig.bucket, JSON.stringify(policy));
    }
    console.log(`✅ 对象存储桶已就绪: ${storageConfig.bucket}`);
    return true;
  } catch (error) {
    console.error('❌ 对象存储桶初始化失败:', error.message);
    return false;
  }
}

/**
 * 上传文件到对象存储
 * @param {String} objectName - 对象名称（包含路径）
 * @param {Buffer|Stream} fileData - 文件数据
 * @param {Number} size - 文件大小
 * @param {Object} metadata - 文件元数据
 * @returns {Promise<String>} 文件URL
 */
async function uploadFile(objectName, fileData, size, metadata = {}) {
  try {
    await minioClient.putObject(
      storageConfig.bucket,
      objectName,
      fileData,
      size,
      metadata
    );
    
    // 返回文件访问URL
    const url = `https://${storageConfig.endPoint}/${storageConfig.bucket}/${objectName}`;
    return url;
  } catch (error) {
    console.error('上传文件失败:', error);
    throw new Error('文件上传失败: ' + error.message);
  }
}

/**
 * 删除文件
 * @param {String} objectName - 对象名称
 */
async function deleteFile(objectName) {
  try {
    await minioClient.removeObject(storageConfig.bucket, objectName);
    return true;
  } catch (error) {
    console.error('删除文件失败:', error);
    throw new Error('文件删除失败: ' + error.message);
  }
}

/**
 * 获取文件访问URL
 * @param {String} objectName - 对象名称
 * @param {Number} expiry - 过期时间（秒），默认7天
 * @returns {Promise<String>} 预签名URL
 */
async function getFileUrl(objectName, expiry = 7 * 24 * 60 * 60) {
  try {
    const url = await minioClient.presignedGetObject(
      storageConfig.bucket,
      objectName,
      expiry
    );
    return url;
  } catch (error) {
    console.error('获取文件URL失败:', error);
    throw new Error('获取文件URL失败: ' + error.message);
  }
}

module.exports = {
  minioClient,
  storageConfig,
  ensureBucket,
  uploadFile,
  deleteFile,
  getFileUrl
};

