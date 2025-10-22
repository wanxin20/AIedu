// 作业管理 API 服务
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

interface Assignment {
  id: number;
  title: string;
  description: string | null;
  subject: string;
  teacherId: number;
  teacherName: string;
  classId: number;
  className: string;
  deadline: string;
  totalScore: number;
  attachments: any[];
  status: 'draft' | 'published' | 'closed';
  submittedCount?: number;
  totalCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface AssignmentListResponse {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    pageSize: number;
    items: Assignment[];
  };
}

interface AssignmentDetailResponse {
  code: number;
  message: string;
  data: Assignment;
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
 * 获取作业列表
 */
export async function getAssignmentList(params?: {
  page?: number;
  pageSize?: number;
  classId?: number;
  status?: string;
  subject?: string;
  keyword?: string;
}): Promise<AssignmentListResponse> {
  try {
    const queryParams = new URLSearchParams();
    
    if (params) {
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.classId) queryParams.append('classId', params.classId.toString());
      if (params.status) queryParams.append('status', params.status);
      if (params.subject) queryParams.append('subject', params.subject);
      if (params.keyword) queryParams.append('keyword', params.keyword);
    }

    const url = `${API_BASE_URL}/assignments${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '获取作业列表失败');
    }

    return result;
  } catch (error) {
    console.error('获取作业列表失败:', error);
    throw error;
  }
}

/**
 * 获取作业详情
 */
export async function getAssignmentDetail(id: number): Promise<AssignmentDetailResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/assignments/${id}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '获取作业详情失败');
    }

    return result;
  } catch (error) {
    console.error('获取作业详情失败:', error);
    throw error;
  }
}

/**
 * 创建作业（教师）
 */
export async function createAssignment(data: {
  title: string;
  description?: string;
  subject: string;
  classId: number;
  deadline: string;
  totalScore: number;
  attachments?: any[];
}): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/assignments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '创建作业失败');
    }

    return result;
  } catch (error) {
    console.error('创建作业失败:', error);
    throw error;
  }
}

/**
 * 更新作业（教师）
 */
export async function updateAssignment(id: number, data: {
  title?: string;
  description?: string;
  subject?: string;
  classId?: number;
  deadline?: string;
  totalScore?: number;
  attachments?: any[];
  status?: 'draft' | 'published' | 'closed';
}): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/assignments/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '更新作业失败');
    }

    return result;
  } catch (error) {
    console.error('更新作业失败:', error);
    throw error;
  }
}

/**
 * 发布作业（教师）
 */
export async function publishAssignment(id: number): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/assignments/${id}/publish`, {
      method: 'POST',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '发布作业失败');
    }

    return result;
  } catch (error) {
    console.error('发布作业失败:', error);
    throw error;
  }
}

/**
 * 删除作业（教师）
 */
export async function deleteAssignment(id: number): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/assignments/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '删除作业失败');
    }

    return result;
  } catch (error) {
    console.error('删除作业失败:', error);
    throw error;
  }
}

/**
 * 获取作业的提交列表（教师）
 */
export async function getAssignmentSubmissions(id: number): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/assignments/${id}/submissions`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '获取提交列表失败');
    }

    return result;
  } catch (error) {
    console.error('获取提交列表失败:', error);
    throw error;
  }
}

// 导出别名，保持向后兼容
export { getAssignmentList as getAssignments };

