import { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';

export default function PhoneLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login } = useContext(AuthContext);
  const [loginMethod, setLoginMethod] = useState('verification'); // 'verification' or 'password'
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState(null);
  
  // 从URL参数获取角色信息
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roleParam = params.get('role');
    
    if (roleParam && ['admin', 'teacher', 'student'].includes(roleParam)) {
      setRole(roleParam);
    } else {
      // 如果没有有效的角色参数，重定向到角色选择页面
      navigate('/login');
    }
  }, [location, navigate]);
  
  // 如果已登录，重定向到相应的仪表盘
  useEffect(() => {
    if (isAuthenticated) {
      navigate(
        role === 'admin' ? '/admin/dashboard' : 
        role === 'teacher' ? '/teacher/dashboard' : 
        '/student/dashboard'
      );
    }
  }, [isAuthenticated, navigate, role]);
  
  // 验证手机号格式
  const isValidPhone = (phoneNumber) => {
    return /^1[3-9]\d{9}$/.test(phoneNumber);
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
  
   // 处理登录
  const handleLogin = () => {
    if (!isValidPhone(phone)) {
      toast.error('请输入有效的手机号');
      return;
    }
    
    if (loginMethod === 'verification' && verificationCode.length !== 6) {
      toast.error('请输入6位验证码');
      return;
    }
    
    if (loginMethod === 'password' && (!password || password.length < 8)) {
      toast.error('请输入至少8位密码');
      return;
    }
    
    setIsLoading(true);
    
    // 模拟登录API请求
    setTimeout(() => {
      setIsLoading(false);
      
      // 模拟不同角色的用户信息
      const userInfo = {
        admin: { name: '系统管理员', phone },
        teacher: { name: '张老师', phone },
        student: { name: '李同学', phone }
      };
      
      // 调用登录函数
      login(role, phone, userInfo[role].name);
      
      // 导航到相应的仪表盘
      navigate(
        role === 'admin' ? '/admin/dashboard' : 
        role === 'teacher' ? '/teacher/dashboard' : 
        '/student/dashboard'
      );
      
      toast.success(`登录成功，欢迎回来，${userInfo[role].name}`);
    }, 1500);
  };
  
  // 根据角色设置页面标题和说明
  const getRoleInfo = () => {
    switch (role) {
      case 'admin':
        return {
          title: '管理员登录',
          description: '请使用管理员账号登录系统',
          icon: <i className="fa-solid fa-user-shield text-purple-600 dark:text-purple-400 text-3xl"></i>
        };
      case 'teacher':
        return {
          title: '教师登录',
          description: '请使用教师账号登录系统',
          icon: <i className="fa-solid fa-chalkboard-user text-green-600 dark:text-green-400 text-3xl"></i>
        };
      case 'student':
        return {
          title: '学生登录',
          description: '请使用学生账号登录系统',
          icon: <i className="fa-solid fa-user-graduate text-orange-600 dark:text-orange-400 text-3xl"></i>
        };
      default:
        return {
          title: '用户登录',
          description: '请使用手机号登录系统',
          icon: <i className="fa-solid fa-user-circle text-blue-600 dark:text-blue-400 text-3xl"></i>
        };
    }
  };
  
  const roleInfo = getRoleInfo();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
             <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/50 mb-4">
                {roleInfo.icon}
              </div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{roleInfo.title}</h1>
              <p className="text-gray-500 dark:text-gray-400">{roleInfo.description}</p>
            </div>
            
            {/* 登录方式选项卡 */}
            <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex">
                <button
                  onClick={() => setLoginMethod('verification')}
                  className={`py-2 px-4 text-sm font-medium border-b-2 ${
                    loginMethod === 'verification'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  验证码登录
                </button>
                <button
                  onClick={() => setLoginMethod('password')}
                  className={`py-2 px-4 text-sm font-medium border-b-2 ${
                    loginMethod === 'password'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  密码登录
                </button>
              </div>
            </div>
            
             <div className="space-y-6">
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
              
              {/* 验证码或密码输入框 */}
              {loginMethod === 'verification' ? (
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
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      密码
                    </label>
                    <Link 
                      to="/forgot-password" 
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      忘记密码?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i className="fa-solid fa-lock text-gray-400"></i>
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white transition-colors"
                      placeholder="请输入密码"
                    />
                  </div>
                </div>
              )}
              
               {/* 登录按钮 */}
              <button
                type="button"
                onClick={handleLogin}
                disabled={isLoading || !phone || (loginMethod === 'verification' ? !verificationCode : !password)}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  isLoading || !phone || (loginMethod === 'verification' ? !verificationCode : !password)
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                }`}
              >
                {isLoading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    登录中...
                  </>
                ) : (
                  '登录'
                )}
              </button>
            </div>
            
            {/* 模拟用户登录提示 */}
            <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
              <p>演示账号: <span className="font-medium">13800138000</span> (点击获取验证码后自动填充)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}