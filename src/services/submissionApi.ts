// 作业提交 API 服务
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

interface Submission {
  id: number;
  assignmentId: number;
  assignmentTitle?: string;
  studentId: number;
  studentName?: string;
  content: string | null;
  attachments: any[];
  score: number | null;
  comment: string | null;
  status: 'pending' | 'submitted' | 'graded';
  submittedAt: string | null;
  gradedAt: string | null;
  gradedBy: number | null;
  createdAt: string;
  updatedAt: string;
}

interface SubmissionDetailResponse {
  code: number;
  message: string;
  data: Submission;
}

interface MySubmissionsResponse {
  code: number;
  message: string;
  data: Submission[];
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
 * 提交作业（学生）
 */
export async function submitAssignment(data: {
  assignmentId: number;
  content?: string;
  attachments?: any[];
}): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/submissions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '提交作业失败');
    }

    return result;
  } catch (error) {
    console.error('提交作业失败:', error);
    throw error;
  }
}

/**
 * 获取提交详情
 */
export async function getSubmissionDetail(id: number): Promise<SubmissionDetailResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/submissions/${id}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '获取提交详情失败');
    }

    return result;
  } catch (error) {
    console.error('获取提交详情失败:', error);
    throw error;
  }
}

/**
 * 批改作业（教师）
 */
export async function gradeSubmission(id: number, data: {
  score: number;
  comment?: string;
}): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/submissions/${id}/grade`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '批改作业失败');
    }

    return result;
  } catch (error) {
    console.error('批改作业失败:', error);
    throw error;
  }
}

/**
 * 获取我的提交记录（学生）
 */
export async function getMySubmissions(): Promise<MySubmissionsResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/submissions/my/list`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '获取提交记录失败');
    }

    return result;
  } catch (error) {
    console.error('获取提交记录失败:', error);
    throw error;
  }
}

/**
 * 获取学生对特定作业的提交状态
 */
export async function getSubmissionByAssignment(assignmentId: number): Promise<SubmissionDetailResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/submissions/assignment/${assignmentId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '获取提交状态失败');
    }

    return result;
  } catch (error) {
    console.error('获取提交状态失败:', error);
    throw error;
  }
}

