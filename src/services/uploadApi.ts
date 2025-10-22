// 文件上传 API 服务
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

interface UploadResponse {
  code: number;
  message: string;
  data: {
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  };
}

/**
 * 上传单个文件
 */
export async function uploadFile(
  file: File,
  type?: 'assignment' | 'resource' | 'avatar'
): Promise<UploadResponse> {
  try {
    const token = localStorage.getItem('token');
    
    const formData = new FormData();
    formData.append('file', file);
    if (type) {
      formData.append('type', type);
    }

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
        // 不设置 Content-Type，让浏览器自动设置 multipart/form-data 边界
      },
      body: formData
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '上传文件失败');
    }

    return result;
  } catch (error) {
    console.error('上传文件失败:', error);
    throw error;
  }
}

/**
 * 上传多个文件
 */
export async function uploadMultipleFiles(
  files: File[],
  type?: 'assignment' | 'resource' | 'avatar'
): Promise<any> {
  try {
    const token = localStorage.getItem('token');
    
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    if (type) {
      formData.append('type', type);
    }

    const response = await fetch(`${API_BASE_URL}/upload/multiple`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: formData
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '上传文件失败');
    }

    return result;
  } catch (error) {
    console.error('上传多个文件失败:', error);
    throw error;
  }
}

/**
 * 删除文件
 */
export async function deleteFile(fileUrl: string): Promise<any> {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fileUrl })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '删除文件失败');
    }

    return result;
  } catch (error) {
    console.error('删除文件失败:', error);
    throw error;
  }
}

/**
 * 获取文件访问URL（用于对象存储）
 */
export function getFileUrl(fileName: string): string {
  // 如果是完整URL，直接返回
  if (fileName.startsWith('http://') || fileName.startsWith('https://')) {
    return fileName;
  }
  
  // 否则拼接完整URL
  return `${API_BASE_URL}/uploads/${fileName}`;
}

