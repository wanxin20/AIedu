// AI 批改 API 服务
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
 * 启动 AI 批改任务（异步）
 * @param submissionId 提交ID
 */
export async function startAIGrading(submissionId: number): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/ai-grading/start/${submissionId}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '启动AI批改失败');
    }

    return result;
  } catch (error) {
    console.error('启动AI批改失败:', error);
    throw error;
  }
}

/**
 * 获取 AI 批改状态
 * @param submissionId 提交ID
 */
export async function getAIGradingStatus(submissionId: number): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/ai-grading/status/${submissionId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '获取AI批改状态失败');
    }

    return result;
  } catch (error) {
    console.error('获取AI批改状态失败:', error);
    throw error;
  }
}

/**
 * 采纳 AI 批改结果（提交为正式批改）
 * @param submissionId 提交ID
 * @param score 分数
 */
export async function acceptAIGrading(submissionId: number, score: number): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/ai-grading/accept/${submissionId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ score })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '提交批改失败');
    }

    return result;
  } catch (error) {
    console.error('提交批改失败:', error);
    throw error;
  }
}

/**
 * 重新进行 AI 批改
 * @param submissionId 提交ID
 */
export async function retryAIGrading(submissionId: number): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/ai-grading/retry/${submissionId}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '重新批改失败');
    }

    return result;
  } catch (error) {
    console.error('重新批改失败:', error);
    throw error;
  }
}

/**
 * 取消 AI 批改
 * @param submissionId 提交ID
 */
export async function cancelAIGrading(submissionId: number): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/ai-grading/cancel/${submissionId}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '取消批改失败');
    }

    return result;
  } catch (error) {
    console.error('取消批改失败:', error);
    throw error;
  }
}

