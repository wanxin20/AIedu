// 操作日志 API 服务
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

interface Log {
  id: number;
  userId: number | null;
  userName?: string;
  action: string;
  module: string;
  description: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestData: any;
  responseStatus: number | null;
  createdAt: string;
}

interface LogListResponse {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    pageSize: number;
    items: Log[];
  };
}

interface LogDetailResponse {
  code: number;
  message: string;
  data: Log;
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
 * 获取日志列表
 */
export async function getLogs(params?: {
  page?: number;
  pageSize?: number;
  action?: string;
  module?: string;
  userId?: number;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}): Promise<LogListResponse> {
  try {
    const queryParams = new URLSearchParams();
    
    if (params) {
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.action) queryParams.append('action', params.action);
      if (params.module) queryParams.append('module', params.module);
      if (params.userId) queryParams.append('userId', params.userId.toString());
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.keyword) queryParams.append('keyword', params.keyword);
    }

    const url = `${API_BASE_URL}/logs${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '获取日志列表失败');
    }

    return result;
  } catch (error) {
    console.error('获取日志列表失败:', error);
    throw error;
  }
}

/**
 * 获取日志详情
 */
export async function getLogDetail(id: number): Promise<LogDetailResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/logs/${id}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '获取日志详情失败');
    }

    return result;
  } catch (error) {
    console.error('获取日志详情失败:', error);
    throw error;
  }
}

/**
 * 获取日志统计
 */
export async function getLogStatistics(params?: {
  startDate?: string;
  endDate?: string;
}): Promise<any> {
  try {
    const queryParams = new URLSearchParams();
    
    if (params) {
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
    }

    const url = `${API_BASE_URL}/logs/statistics${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '获取日志统计失败');
    }

    return result;
  } catch (error) {
    console.error('获取日志统计失败:', error);
    throw error;
  }
}

/**
 * 清理旧日志（管理员）
 */
export async function cleanupOldLogs(days: number): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/logs/cleanup`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ days })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '清理日志失败');
    }

    return result;
  } catch (error) {
    console.error('清理日志失败:', error);
    throw error;
  }
}

/**
 * 导出日志（管理员）
 */
export async function exportLogs(params?: {
  startDate?: string;
  endDate?: string;
  action?: string;
  module?: string;
}): Promise<void> {
  try {
    const queryParams = new URLSearchParams();
    
    if (params) {
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.action) queryParams.append('action', params.action);
      if (params.module) queryParams.append('module', params.module);
    }

    const token = localStorage.getItem('token');
    const url = `${API_BASE_URL}/logs/export${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || '导出日志失败');
    }

    // 下载文件
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `logs_${new Date().getTime()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  } catch (error) {
    console.error('导出日志失败:', error);
    throw error;
  }
}

