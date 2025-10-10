import { useEffect, useState } from 'react';

// 密码策略接口定义
interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

// 模拟从管理员设置获取密码策略
const getPasswordPolicy = (): PasswordPolicy => {
  // 在实际应用中，这里应该从API获取管理员设置的密码策略
  return {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true
  };
};

interface PasswordRulesProps {
  password?: string;
}

export default function PasswordRules({ password }: PasswordRulesProps) {
  const [policy, setPolicy] = useState<PasswordPolicy>({
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true
  });
  
  // 密码验证状态
  const [validation, setValidation] = useState({
    minLength: false,
    requireUppercase: false,
    requireLowercase: false,
    requireNumbers: false,
    requireSpecialChars: false
  });
  
  // 获取密码策略
  useEffect(() => {
    setPolicy(getPasswordPolicy());
  }, []);
  
  // 验证密码
  useEffect(() => {
    if (!password) {
      setValidation({
        minLength: false,
        requireUppercase: false,
        requireLowercase: false,
        requireNumbers: false,
        requireSpecialChars: false
      });
      return;
    }
    
    setValidation({
      minLength: password.length >= policy.minLength,
      requireUppercase: policy.requireUppercase ? /[A-Z]/.test(password) : true,
      requireLowercase: policy.requireLowercase ? /[a-z]/.test(password) : true,
      requireNumbers: policy.requireNumbers ? /[0-9]/.test(password) : true,
      requireSpecialChars: policy.requireSpecialChars ? /[!@#$%^&*]/.test(password) : true
    });
  }, [password, policy]);
  
  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">密码要求:</h4>
      <ul className="space-y-1 text-sm">
        <li className={`flex items-center ${validation.minLength ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
          <i className={`fa-solid ${validation.minLength ? 'fa-check text-green-500' : 'fa-circle text-gray-300 dark:text-gray-600'} mr-2`}></i>
          至少{policy.minLength}个字符
        </li>
        {policy.requireUppercase && (
          <li className={`flex items-center ${validation.requireUppercase ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
            <i className={`fa-solid ${validation.requireUppercase ? 'fa-check text-green-500' : 'fa-circle text-gray-300 dark:text-gray-600'} mr-2`}></i>
            包含至少一个大写字母
          </li>
        )}
        {policy.requireLowercase && (
          <li className={`flex items-center ${validation.requireLowercase ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
            <i className={`fa-solid ${validation.requireLowercase ? 'fa-check text-green-500' : 'fa-circle text-gray-300 dark:text-gray-600'} mr-2`}></i>
            包含至少一个小写字母
          </li>
        )}
        {policy.requireNumbers && (
          <li className={`flex items-center ${validation.requireNumbers ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
            <i className={`fa-solid ${validation.requireNumbers ? 'fa-check text-green-500' : 'fa-circle text-gray-300 dark:text-gray-600'} mr-2`}></i>
            包含至少一个数字
          </li>
        )}
        {policy.requireSpecialChars && (
          <li className={`flex items-center ${validation.requireSpecialChars ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
            <i className={`fa-solid ${validation.requireSpecialChars ? 'fa-check text-green-500' : 'fa-circle text-gray-300 dark:text-gray-600'} mr-2`}></i>
            包含至少一个特殊字符 (!@#$%^&*)
          </li>
        )}
      </ul>
    </div>
  );
}