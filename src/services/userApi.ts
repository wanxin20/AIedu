// 用户管理 API 服务
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

interface User {
  id: number;
  phone: string;
  name: string;
  role: 'admin' | 'teacher' | 'student';
  avatar: string | null;
  email: string | null;
  status: number;
  classId: number | null;
  className?: string;
  subject: string | null;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  failedLoginCount: number;
  lockedUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UserListResponse {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    pageSize: number;
    items: User[];
  };
}

interface UserDetailResponse {
  code: number;
  message: string;
  data: User;
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
 * 获取用户列表（管理员）
 */
export async function getUserList(params?: {
  page?: number;
  pageSize?: number;
  role?: string;
  status?: number;
  keyword?: string;
}): Promise<UserListResponse> {
  try {
    const queryParams = new URLSearchParams();
    
    if (params) {
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.role) queryParams.append('role', params.role);
      if (params.status !== undefined) queryParams.append('status', params.status.toString());
      if (params.keyword) queryParams.append('keyword', params.keyword);
    }

    const url = `${API_BASE_URL}/users${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '获取用户列表失败');
    }

    return result;
  } catch (error) {
    console.error('获取用户列表失败:', error);
    throw error;
  }
}

/**
 * 获取用户详情
 */
export async function getUserDetail(id: number): Promise<UserDetailResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '获取用户详情失败');
    }

    return result;
  } catch (error) {
    console.error('获取用户详情失败:', error);
    throw error;
  }
}

/**
 * 更新用户信息
 */
export async function updateUser(id: number, data: {
  name?: string;
  email?: string;
  avatar?: string;
  status?: number;
  classId?: number;
  subject?: string;
}): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '更新用户信息失败');
    }

    return result;
  } catch (error) {
    console.error('更新用户信息失败:', error);
    throw error;
  }
}

/**
 * 修改密码
 */
export async function changePassword(id: number, data: {
  oldPassword: string;
  newPassword: string;
}): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${id}/password`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '修改密码失败');
    }

    return result;
  } catch (error) {
    console.error('修改密码失败:', error);
    throw error;
  }
}

/**
 * 重置密码（管理员）
 */
export async function resetPassword(id: number, newPassword: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${id}/reset-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ newPassword })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '重置密码失败');
    }

    return result;
  } catch (error) {
    console.error('重置密码失败:', error);
    throw error;
  }
}

/**
 * 删除用户（管理员）
 */
export async function deleteUser(id: number): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '删除用户失败');
    }

    return result;
  } catch (error) {
    console.error('删除用户失败:', error);
    throw error;
  }
}

/**
 * 批量重置密码（管理员）
 */
export async function batchResetPassword(userIds: number[], newPassword: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/batch-reset-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userIds, newPassword })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '批量重置密码失败');
    }

    return result;
  } catch (error) {
    console.error('批量重置密码失败:', error);
    throw error;
  }
}

// 导出别名，保持向后兼容
export { getUserList as getUsers };

