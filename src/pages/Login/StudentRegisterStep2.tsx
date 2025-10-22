import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import PasswordRules from './PasswordRules';
import { register as registerApi } from '@/services/authApi';

export default function StudentRegisterStep2() {
  const navigate = useNavigate();
  const { register } = useContext(AuthContext);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step1Data, setStep1Data] = useState<any>(null);

  // 从localStorage获取第一步数据
  useEffect(() => {
    const data = localStorage.getItem('register_student_step1');
    if (data) {
      setStep1Data(JSON.parse(data));
    } else {
      // 如果没有第一步数据，重定向到第一步
      navigate('/register/student/step1');
    }
  }, [navigate]);

  // 验证密码是否匹配
  const doPasswordsMatch = () => {
    return password === confirmPassword;
  };

  // 处理注册
  const handleRegister = async () => {
    if (!name.trim()) {
      toast.error('请输入姓名');
      return;
    }

    if (password.length < 8) {
      toast.error('密码长度不能少于8位');
      return;
    }

    if (!doPasswordsMatch()) {
      toast.error('两次输入的密码不一致');
      return;
    }

    if (!step1Data) return;

    setIsLoading(true);

    try {
      // 调用真实的注册 API
      const result = await registerApi({
        phone: step1Data.phone,
        password,
        name,
        role: 'student',
        classId: step1Data.classId
      });
      
      const userData = result.data.user;
      
      // 调用登录函数，更新认证状态
      register(
        userData.role,
        userData.phone,
        userData.name,
        password,
        userData.classId
      );
      
      // 清除localStorage中的注册数据
      localStorage.removeItem('register_student_step1');
      
      toast.success('注册成功，欢迎加入智慧教辅系统！');
      
      // 导航到学生仪表盘
      navigate('/student/dashboard');
    } catch (error: any) {
      console.error('注册失败:', error);
      toast.error(error.message || '注册失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/50 mb-4">
                <i className="fa-solid fa-user-graduate text-orange-600 dark:text-orange-400 text-3xl"></i>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">学生注册</h1>
              <p className="text-gray-500 dark:text-gray-400">第二步：完善信息</p>
              
              {/* 进度指示器 */}
              <div className="flex items-center justify-center mt-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center">1</div>
                  <div className="w-16 h-1 bg-orange-600 mx-2"></div>
                  <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center">2</div>
                </div>
              </div>
            </div>
            
            {step1Data && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <p><span className="font-medium">手机号：</span>{step1Data.phone}</p>
                  <p><span className="font-medium">班级：</span>{step1Data.className}</p>
                </div>
              </div>
            )}
            
            <div className="space-y-6">
              {/* 姓名输入框 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  姓名
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fa-solid fa-user text-gray-400"></i>
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-800 dark:text-white transition-colors"
                    placeholder="请输入您的姓名"
                  />
                </div>
              </div>
              
              {/* 密码输入框 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  设置密码
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fa-solid fa-lock text-gray-400"></i>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-800 dark:text-white transition-colors"
                    placeholder="请设置密码"
                  />
                </div>
                
                {/* 密码规则 */}
                <PasswordRules password={password} />
              </div>
              
              {/* 确认密码输入框 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  确认密码
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fa-solid fa-lock text-gray-400"></i>
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-orange-500 dark:bg-gray-800 dark:text-white transition-colors ${
                      confirmPassword && !doPasswordsMatch()
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 dark:border-gray-700 focus:ring-orange-500'
                    }`}
                    placeholder="请再次输入密码"
                  />
                </div>
                
                {confirmPassword && !doPasswordsMatch() && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    <i className="fa-solid fa-exclamation-circle mr-1"></i>两次输入的密码不一致
                  </p>
                )}
              </div>
              
              {/* 注册按钮 */}
              <button
                type="button"
                onClick={handleRegister}
                disabled={isLoading || !name || !password || !confirmPassword || !doPasswordsMatch()}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  isLoading || !name || !password || !confirmPassword || !doPasswordsMatch()
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg'
                }`}
              >
                {isLoading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    注册中...
                  </>
                ) : (
                  '完成注册'
                )}
              </button>
              
              {/* 返回和登录选项 */}
              <div className="flex justify-between text-sm">
                <button
                  onClick={() => navigate('/register/student/step1')}
                  className="text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400"
                >
                  <i className="fa-solid fa-arrow-left mr-1"></i> 返回上一步
                </button>
                
                <div>
                  <span className="text-gray-500 dark:text-gray-400">已有账号？</span>
                  <Link 
                    to="/login" 
                    className="text-orange-600 dark:text-orange-400 hover:underline ml-1"
                  >
                    前往登录
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}