// 认证 API 服务
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

interface LoginRequest {
  phone: string;
  password: string;
}

interface RegisterRequest {
  phone: string;
  password: string;
  name: string;
  role: 'teacher' | 'student';
  classId?: number;
  subject?: string;
}

interface AuthResponse {
  code: number;
  message: string;
  data: {
    token: string;
    refreshToken: string;
    expiresIn: number;
    user: {
      id: number;
      phone: string;
      name: string;
      role: string;
      avatar: string | null;
      classId: number | null;
      subject: string | null;
    };
  };
}

/**
 * 密码登录
 */
export async function loginWithPassword(data: LoginRequest): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login/password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '登录失败');
    }

    // 保存 token 到 localStorage
    if (result.data?.token) {
      localStorage.setItem('token', result.data.token);
      localStorage.setItem('refreshToken', result.data.refreshToken);
    }

    return result;
  } catch (error) {
    console.error('登录失败:', error);
    throw error;
  }
}

/**
 * 用户注册
 */
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '注册失败');
    }

    // 保存 token 到 localStorage
    if (result.data?.token) {
      localStorage.setItem('token', result.data.token);
      localStorage.setItem('refreshToken', result.data.refreshToken);
    }

    return result;
  } catch (error) {
    console.error('注册失败:', error);
    throw error;
  }
}

/**
 * 登出
 */
export async function logout(): Promise<void> {
  try {
    const token = localStorage.getItem('token');
    
    if (token) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    }

    // 清除本地存储
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('smartTeachingAssistantUser');
  } catch (error) {
    console.error('登出失败:', error);
    // 即使请求失败也清除本地存储
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('smartTeachingAssistantUser');
  }
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser() {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('未登录');
    }

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '获取用户信息失败');
    }

    return result;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    throw error;
  }
}

/**
 * 检查 Token 是否有效
 */
export function isTokenValid(): boolean {
  const token = localStorage.getItem('token');
  return !!token;
}

/**
 * 获取 Token
 */
export function getToken(): string | null {
  return localStorage.getItem('token');
}

/**
 * 刷新 Token
 */
export async function refreshToken(): Promise<AuthResponse> {
  try {
    const token = localStorage.getItem('refreshToken');
    
    if (!token) {
      throw new Error('未找到刷新令牌');
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken: token })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '刷新令牌失败');
    }

    // 保存新的 token
    if (result.data?.token) {
      localStorage.setItem('token', result.data.token);
      localStorage.setItem('refreshToken', result.data.refreshToken);
    }

    return result;
  } catch (error) {
    console.error('刷新令牌失败:', error);
    // 刷新失败，清除所有认证信息
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('smartTeachingAssistantUser');
    throw error;
  }
}

