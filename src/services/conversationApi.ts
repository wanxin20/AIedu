// 学习助手会话管理 API 服务
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// 消息接口（后端格式）
export interface ApiMessage {
  id?: number | string;
  sender: 'user' | 'assistant';
  content: string;
  suggestedQuestions?: string[];
  timestamp?: Date | string;
}

// 会话接口
export interface Conversation {
  id: number;
  title: string;
  cozeConversationId?: string | null;
  messageCount: number;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  messages?: ApiMessage[];
}

interface ConversationListResponse {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    pageSize: number;
    items: Conversation[];
  };
}

interface ConversationDetailResponse {
  code: number;
  message: string;
  data: Conversation;
}

interface BaseResponse {
  code: number;
  message: string;
  data?: any;
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
 * 获取会话列表
 */
export async function getConversations(params?: {
  page?: number;
  pageSize?: number;
  keyword?: string;
}): Promise<ConversationListResponse> {
  try {
    const queryParams = new URLSearchParams();
    
    if (params) {
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.keyword) queryParams.append('keyword', params.keyword);
    }

    const url = `${API_BASE_URL}/conversations${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '获取会话列表失败');
    }

    return result;
  } catch (error) {
    console.error('获取会话列表失败:', error);
    throw error;
  }
}

/**
 * 获取会话详情（包含所有消息）
 */
export async function getConversationDetail(id: number): Promise<ConversationDetailResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/conversations/${id}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '获取会话详情失败');
    }

    return result;
  } catch (error) {
    console.error('获取会话详情失败:', error);
    throw error;
  }
}

/**
 * 创建新会话
 */
export async function createConversation(data: {
  title: string;
  cozeConversationId?: string;
}): Promise<BaseResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/conversations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '创建会话失败');
    }

    return result;
  } catch (error) {
    console.error('创建会话失败:', error);
    throw error;
  }
}

/**
 * 更新会话信息
 */
export async function updateConversation(id: number, data: {
  title?: string;
  cozeConversationId?: string;
}): Promise<BaseResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/conversations/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '更新会话失败');
    }

    return result;
  } catch (error) {
    console.error('更新会话失败:', error);
    throw error;
  }
}

/**
 * 删除会话
 */
export async function deleteConversation(id: number): Promise<BaseResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/conversations/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '删除会话失败');
    }

    return result;
  } catch (error) {
    console.error('删除会话失败:', error);
    throw error;
  }
}

/**
 * 保存单条消息到会话
 */
export async function saveMessage(conversationId: number, data: {
  sender: 'user' | 'assistant';
  content: string;
  suggestedQuestions?: string[];
}): Promise<BaseResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '保存消息失败');
    }

    return result;
  } catch (error) {
    console.error('保存消息失败:', error);
    throw error;
  }
}

/**
 * 批量保存消息到会话（用于保存一轮对话）
 */
export async function saveMessagesBatch(conversationId: number, messages: {
  sender: 'user' | 'assistant';
  content: string;
  suggestedQuestions?: string[];
}[]): Promise<BaseResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages/batch`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ messages })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '批量保存消息失败');
    }

    return result;
  } catch (error) {
    console.error('批量保存消息失败:', error);
    throw error;
  }
}

