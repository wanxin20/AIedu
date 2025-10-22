// 系统配置 API 服务
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

interface SystemConfig {
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumber: boolean;
  passwordRequireSpecial: boolean;
  maxLoginAttempts: number;
  loginLockDuration: number;
  sessionTimeout: number;
  maxFileSize: number;
}

interface SystemConfigResponse {
  code: number;
  message: string;
  data: SystemConfig;
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
 * 获取系统配置
 */
export async function getSystemConfigs(): Promise<SystemConfigResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/system-configs`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '获取系统配置失败');
    }

    return result;
  } catch (error) {
    console.error('获取系统配置失败:', error);
    throw error;
  }
}

/**
 * 更新系统配置（管理员）
 */
export async function updateSystemConfigs(data: Partial<SystemConfig>): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/system-configs`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '更新系统配置失败');
    }

    return result;
  } catch (error) {
    console.error('更新系统配置失败:', error);
    throw error;
  }
}

/**
 * 重置系统配置为默认值（管理员）
 */
export async function resetSystemConfigs(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/system-configs/reset`, {
      method: 'POST',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '重置系统配置失败');
    }

    return result;
  } catch (error) {
    console.error('重置系统配置失败:', error);
    throw error;
  }
}

// 导出别名，保持向后兼容
export { getSystemConfigs as getSystemConfig };
export { updateSystemConfigs as updateSystemConfig };

