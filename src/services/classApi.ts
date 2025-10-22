// 班级 API 服务
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

interface ClassItem {
  id: number;
  name: string;
  grade: string;
  teacherId: number | null;
  teacherName: string | null;
  studentCount: number;
  status: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ClassListResponse {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    pageSize: number;
    items: ClassItem[];
  };
}

interface ClassDetailResponse {
  code: number;
  message: string;
  data: ClassItem;
}

/**
 * 获取班级列表
 */
export async function getClassList(params?: {
  page?: number;
  pageSize?: number;
  grade?: string;
  status?: number;
  keyword?: string;
}): Promise<ClassListResponse> {
  try {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams();
    
    if (params) {
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.grade) queryParams.append('grade', params.grade);
      if (params.status !== undefined) queryParams.append('status', params.status.toString());
      if (params.keyword) queryParams.append('keyword', params.keyword);
    }

    const url = `${API_BASE_URL}/classes${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '获取班级列表失败');
    }

    return result;
  } catch (error) {
    console.error('获取班级列表失败:', error);
    throw error;
  }
}

/**
 * 获取所有活跃班级（用于注册时选择，无需认证）
 */
export async function getActiveClasses(): Promise<{ id: number; name: string; grade?: string }[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/classes/public/active`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '获取活跃班级失败');
    }

    return result.data || [];
  } catch (error) {
    console.error('获取活跃班级失败:', error);
    // 返回空数组而不是抛出错误，避免阻塞注册流程
    return [];
  }
}

/**
 * 获取班级详情
 */
export async function getClassDetail(id: number): Promise<ClassDetailResponse> {
  try {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_BASE_URL}/classes/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '获取班级详情失败');
    }

    return result;
  } catch (error) {
    console.error('获取班级详情失败:', error);
    throw error;
  }
}

/**
 * 创建班级（管理员）
 */
export async function createClass(data: {
  name: string;
  grade: string;
  teacherId?: number;
  description?: string;
}): Promise<any> {
  try {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('未登录');
    }

    const response = await fetch(`${API_BASE_URL}/classes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '创建班级失败');
    }

    return result;
  } catch (error) {
    console.error('创建班级失败:', error);
    throw error;
  }
}

/**
 * 更新班级（管理员）
 */
export async function updateClass(id: number, data: {
  name?: string;
  grade?: string;
  teacherId?: number;
  description?: string;
  status?: number;
}): Promise<any> {
  try {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('未登录');
    }

    const response = await fetch(`${API_BASE_URL}/classes/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '更新班级失败');
    }

    return result;
  } catch (error) {
    console.error('更新班级失败:', error);
    throw error;
  }
}

/**
 * 删除班级（管理员）
 */
export async function deleteClass(id: number): Promise<any> {
  try {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('未登录');
    }

    const response = await fetch(`${API_BASE_URL}/classes/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '删除班级失败');
    }

    return result;
  } catch (error) {
    console.error('删除班级失败:', error);
    throw error;
  }
}

/**
 * 获取班级学生列表（管理员/教师）
 */
export async function getClassStudents(id: number): Promise<any> {
  try {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('未登录');
    }

    const response = await fetch(`${API_BASE_URL}/classes/${id}/students`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '获取学生列表失败');
    }

    return result;
  } catch (error) {
    console.error('获取学生列表失败:', error);
    throw error;
  }
}

