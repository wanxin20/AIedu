// 教案管理 API 服务（保存的教案，与 lessonPlanApi.ts 不同）
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

interface LessonPlan {
  id: number;
  title: string;
  subject: string;
  grade: string;
  teacherId: number;
  teacherName?: string;
  content: string;
  objectives: string | null;
  materials: string | null;
  duration: number;
  tags: string[] | null;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

interface LessonPlanListResponse {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    pageSize: number;
    items: LessonPlan[];
  };
}

interface LessonPlanDetailResponse {
  code: number;
  message: string;
  data: LessonPlan;
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
 * 获取教案列表
 */
export async function getLessonPlanList(params?: {
  page?: number;
  pageSize?: number;
  subject?: string;
  grade?: string;
  status?: string;
  keyword?: string;
}): Promise<LessonPlanListResponse> {
  try {
    const queryParams = new URLSearchParams();
    
    if (params) {
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.subject) queryParams.append('subject', params.subject);
      if (params.grade) queryParams.append('grade', params.grade);
      if (params.status) queryParams.append('status', params.status);
      if (params.keyword) queryParams.append('keyword', params.keyword);
    }

    const url = `${API_BASE_URL}/lesson-plans${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '获取教案列表失败');
    }

    return result;
  } catch (error) {
    console.error('获取教案列表失败:', error);
    throw error;
  }
}

/**
 * 获取教案详情
 */
export async function getLessonPlanDetail(id: number): Promise<LessonPlanDetailResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/lesson-plans/${id}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '获取教案详情失败');
    }

    return result;
  } catch (error) {
    console.error('获取教案详情失败:', error);
    throw error;
  }
}

/**
 * 创建教案（教师）
 */
export async function createLessonPlan(data: {
  title: string;
  subject: string;
  grade: string;
  content: string;
  objectives?: string;
  materials?: string;
  duration?: number;
  tags?: string[];
}): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/lesson-plans`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '创建教案失败');
    }

    return result;
  } catch (error) {
    console.error('创建教案失败:', error);
    throw error;
  }
}

/**
 * 更新教案（教师）
 */
export async function updateLessonPlan(id: number, data: {
  title?: string;
  subject?: string;
  grade?: string;
  content?: string;
  objectives?: string;
  materials?: string;
  duration?: number;
  tags?: string[];
  status?: 'draft' | 'published';
}): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/lesson-plans/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '更新教案失败');
    }

    return result;
  } catch (error) {
    console.error('更新教案失败:', error);
    throw error;
  }
}

/**
 * 发布教案（教师）
 */
export async function publishLessonPlan(id: number): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/lesson-plans/${id}/publish`, {
      method: 'POST',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '发布教案失败');
    }

    return result;
  } catch (error) {
    console.error('发布教案失败:', error);
    throw error;
  }
}

/**
 * 删除教案（教师）
 */
export async function deleteLessonPlan(id: number): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/lesson-plans/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '删除教案失败');
    }

    return result;
  } catch (error) {
    console.error('删除教案失败:', error);
    throw error;
  }
}

