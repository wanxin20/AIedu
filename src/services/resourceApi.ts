// 教学资源 API 服务
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

interface Resource {
  id: number;
  title: string;
  description: string | null;
  type: 'document' | 'video' | 'audio' | 'image' | 'other';
  category: string;
  subject: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string | null;
  uploaderId: number;
  uploaderName?: string;
  downloadCount: number;
  viewCount: number;
  status: number;
  createdAt: string;
  updatedAt: string;
}

interface ResourceListResponse {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    pageSize: number;
    items: Resource[];
  };
}

interface ResourceDetailResponse {
  code: number;
  message: string;
  data: Resource;
}

/**
 * 获取 Token
 */
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json'
  };
}

/**
 * 获取资源列表
 */
export async function getResourceList(params?: {
  page?: number;
  pageSize?: number;
  category?: string;
  subject?: string;
  type?: string;
  keyword?: string;
}): Promise<ResourceListResponse> {
  try {
    const queryParams = new URLSearchParams();
    
    if (params) {
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.category) queryParams.append('category', params.category);
      if (params.subject) queryParams.append('subject', params.subject);
      if (params.type) queryParams.append('type', params.type);
      if (params.keyword) queryParams.append('keyword', params.keyword);
    }

    const url = `${API_BASE_URL}/resources${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '获取资源列表失败');
    }

    return result;
  } catch (error) {
    console.error('获取资源列表失败:', error);
    throw error;
  }
}

/**
 * 获取资源详情
 */
export async function getResourceDetail(id: number): Promise<ResourceDetailResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/resources/${id}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '获取资源详情失败');
    }

    return result;
  } catch (error) {
    console.error('获取资源详情失败:', error);
    throw error;
  }
}

/**
 * 创建资源（教师）
 */
export async function createResource(data: {
  title: string;
  description?: string;
  type: string;
  category: string;
  subject: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType?: string;
}): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/resources`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '创建资源失败');
    }

    return result;
  } catch (error) {
    console.error('创建资源失败:', error);
    throw error;
  }
}

/**
 * 更新资源（教师）
 */
export async function updateResource(id: number, data: {
  title?: string;
  description?: string;
  category?: string;
  subject?: string;
  status?: number;
}): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/resources/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '更新资源失败');
    }

    return result;
  } catch (error) {
    console.error('更新资源失败:', error);
    throw error;
  }
}

/**
 * 删除资源（教师）
 */
export async function deleteResource(id: number): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/resources/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '删除资源失败');
    }

    return result;
  } catch (error) {
    console.error('删除资源失败:', error);
    throw error;
  }
}

/**
 * 下载资源
 */
export async function downloadResource(id: number): Promise<void> {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/resources/${id}/download`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || '下载资源失败');
    }

    // 获取文件名
    const contentDisposition = response.headers.get('Content-Disposition');
    let fileName = 'download';
    
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (fileNameMatch) {
        fileName = decodeURIComponent(fileNameMatch[1]);
      }
    }

    // 下载文件
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('下载资源失败:', error);
    throw error;
  }
}

// 导出别名，保持向后兼容
export { getResourceList as getResources };

