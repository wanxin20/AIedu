// 统计数据 API 服务
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

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
 * 获取管理员仪表盘数据
 */
export async function getAdminDashboard(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/statistics/admin-dashboard`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '获取仪表盘数据失败');
    }

    return result;
  } catch (error) {
    console.error('获取管理员仪表盘数据失败:', error);
    throw error;
  }
}

/**
 * 获取教师仪表盘数据
 */
export async function getTeacherDashboard(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/statistics/teacher-dashboard`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '获取仪表盘数据失败');
    }

    return result;
  } catch (error) {
    console.error('获取教师仪表盘数据失败:', error);
    throw error;
  }
}

/**
 * 获取学生仪表盘数据
 */
export async function getStudentDashboard(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/statistics/student-dashboard`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '获取仪表盘数据失败');
    }

    return result;
  } catch (error) {
    console.error('获取学生仪表盘数据失败:', error);
    throw error;
  }
}

