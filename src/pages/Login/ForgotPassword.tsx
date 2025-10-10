import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1); // 1: 输入手机号, 2: 验证码验证, 3: 设置新密码
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // 验证手机号格式
  const isValidPhone = (phoneNumber: string) => {
    return /^1[3-9]\d{9}$/.test(phoneNumber);
  };
  
  // 验证密码是否匹配
  const doPasswordsMatch = () => {
    return password === confirmPassword;
  };
  
  // 模拟发送验证码
  const handleSendCode = () => {
    if (!isValidPhone(phone)) {
      toast.error('请输入有效的手机号');
      return;
    }
    
    // 开始倒计时
    setCountdown(60);
    
    // 模拟发送验证码API请求
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success('验证码已发送，请注意查收');
      
      // 模拟验证码 - 仅用于演示
      if (phone === '13800138000') {
        setVerificationCode('123456');
      }
    }, 1500);
  };
  
  // 倒计时逻辑
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [countdown]);
  
  // 处理下一步
  const handleNext = () => {
    if (step === 1) {
      if (!isValidPhone(phone)) {
        toast.error('请输入有效的手机号');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (verificationCode.length !== 6) {
        toast.error('请输入6位验证码');
        return;
      }
      setStep(3);
    }
  };
  
  // 处理上一步
  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  
  // 处理密码重置
  const handleResetPassword = () => {
    if (password.length < 8) {
      toast.error('密码长度不能少于8位');
      return;
    }
    
    if (!doPasswordsMatch()) {
      toast.error('两次输入的密码不一致');
      return;
    }
    
    setIsLoading(true);
    
    // 模拟密码重置API请求
    setTimeout(() => {
      setIsLoading(false);
      toast.success('密码重置成功，请使用新密码登录');
      navigate('/login/phone?role=student');
    }, 1500);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 返回按钮 */}
        <div className="mb-8">
          <Link 
            to="/login" 
            className="inline-flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <i className="fa-solid fa-arrow-left mr-2"></i>
            <span>返回登录</span>
          </Link>
        </div>
        
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/50 mb-4">
                <i className="fa-solid fa-lock text-blue-600 dark:text-blue-400 text-3xl"></i>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">忘记密码</h1>
              <p className="text-gray-500 dark:text-gray-400">通过手机号找回您的密码</p>
              
              {/* 进度指示器 */}
              <div className="flex items-center justify-center mt-6">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>1</div>
                  <div className={`w-16 h-1 mx-2 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>2</div>
                  <div className={`w-16 h-1 mx-2 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>3</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              {step === 1 && (
                <>
                  {/* 手机号输入框 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      手机号
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <i className="fa-solid fa-phone text-gray-400"></i>
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        maxLength={11}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white transition-colors"
                        placeholder="请输入手机号"
                      />
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    <i className="fa-solid fa-info-circle mr-1"></i>
                    我们将发送验证码到您的手机
                  </div>
                </>
              )}
              
              {step === 2 && (
                <>
                  {/* 验证码输入框 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      验证码
                    </label>
                    <div className="flex space-x-3">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <i className="fa-solid fa-shield text-gray-400"></i>
                        </div>
                        <input
                          type="text"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                          maxLength={6}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white transition-colors"
                          placeholder="请输入验证码"
                        />
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleSendCode}
                        disabled={countdown > 0 || isLoading}
                        className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                          countdown > 0 || isLoading
                            ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {countdown > 0 ? `重新发送(${countdown}s)` : '获取验证码'}
                      </button>
                    </div>
                  </div>
                </>
              )}
              
              {step === 3 && (
                <>
                  {/* 新密码输入框 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      设置新密码
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <i className="fa-solid fa-lock text-gray-400"></i>
                      </div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white transition-colors"
                        placeholder="请设置新密码"
                      />
                    </div>
                  </div>
                  
                  {/* 确认密码输入框 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      确认新密码
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <i className="fa-solid fa-lock text-gray-400"></i>
                      </div>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-blue-500 dark:bg-gray-800 dark:text-white transition-colors ${
                          confirmPassword && !doPasswordsMatch()
                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300 dark:border-gray-700 focus:ring-blue-500'
                        }`}
                        placeholder="请再次输入新密码"
                      />
                    </div>
                    
                    {confirmPassword && !doPasswordsMatch() && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        <i className="fa-solid fa-exclamation-circle mr-1"></i>两次输入的密码不一致
                      </p>
                    )}
                  </div>
                </>
              )}
              
              {/* 操作按钮 */}
              <div className="flex gap-3">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={isLoading}
                    className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                      isLoading
                        ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white'
                    }`}
                  >
                    上一步
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={step < 3 ? handleNext : handleResetPassword}
                  disabled={isLoading}
                  className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                    isLoading
                      ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                      处理中...
                    </>
                  ) : step < 3 ? (
                    `下一步`
                  ) : (
                    `重置密码`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}