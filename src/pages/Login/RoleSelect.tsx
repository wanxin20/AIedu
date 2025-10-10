import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';

export default function RoleSelect() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useContext(AuthContext);
  const [selectedRole, setSelectedRole] = useState(null);
  
      // 如果已登录，重定向到相应的仪表盘
    if (isAuthenticated) {
      // 直接导航到用户对应的仪表盘
      navigate(user.role === "admin" ? "/admin/dashboard" : user.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard");
      return null;
    }
  
  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    // 导航到手机号登录页面，并传递角色信息
    navigate(`/login/phone?role=${role}`);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 返回按钮 */}
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <i className="fa-solid fa-arrow-left mr-2"></i>
            <span>返回首页</span>
          </Link>
        </div>
        
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/50 mb-4">
                <i className="fa-solid fa-user-circle text-blue-600 dark:text-blue-400 text-3xl"></i>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">选择您的角色</h1>
              <p className="text-gray-500 dark:text-gray-400">请选择您在系统中的角色身份</p>
            </div>
            
             <div className="space-y-6">
              <div className="text-center mb-2">
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">已有账号？请选择角色登录</h3>
              </div>
              
              {/* 管理员角色卡片 */}
              <div 
                onClick={() => handleRoleSelect('admin')}
                className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                  selectedRole === 'admin' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mr-4">
                    <i className="fa-solid fa-user-shield text-purple-600 dark:text-purple-400 text-xl"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white text-lg">管理员</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">管理系统配置和用户权限</p>
                  </div>
                  {selectedRole === 'admin' && (
                    <div className="ml-auto text-blue-500">
                      <i className="fa-solid fa-check-circle"></i>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 教师角色卡片 */}
              <div 
                onClick={() => handleRoleSelect('teacher')}
                className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                  selectedRole === 'teacher' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mr-4">
                    <i className="fa-solid fa-chalkboard-user text-green-600 dark:text-green-400 text-xl"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white text-lg">教师</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">管理教学资源和作业批改</p>
                  </div>
                  {selectedRole === 'teacher' && (
                    <div className="ml-auto text-blue-500">
                      <i className="fa-solid fa-check-circle"></i>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 学生角色卡片 */}
              <div 
                onClick={() => handleRoleSelect('student')}
                className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                  selectedRole === 'student' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center mr-4">
                    <i className="fa-solid fa-user-graduate text-orange-600 dark:text-orange-400 text-xl"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white text-lg">学生</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">查看作业和提交学习任务</p>
                  </div>
                  {selectedRole === 'student' && (
                    <div className="ml-auto text-blue-500">
                      <i className="fa-solid fa-check-circle"></i>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">没有账号？请注册</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Link
                    to="/register/teacher/step1"
                    className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all text-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mx-auto mb-2">
                      <i className="fa-solid fa-chalkboard-user text-green-600 dark:text-green-400"></i>
                    </div>
                    <h3 className="text-sm font-medium text-gray-800 dark:text-white">教师注册</h3>
                  </Link>
                  
                  <Link
                    to="/register/student/step1"
                    className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all text-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center mx-auto mb-2">
                      <i className="fa-solid fa-user-graduate text-orange-600 dark:text-orange-400"></i>
                    </div>
                    <h3 className="text-sm font-medium text-gray-800 dark:text-white">学生注册</h3>
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