import { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { toast } from 'sonner';

// 模拟教学数据
const assignmentCompletionData = [
  { name: '数学', 已完成: 35, 未完成: 10 },
  { name: '语文', 已完成: 30, 未完成: 15 },
  { name: '英语', 已完成: 28, 未完成: 17 },
  { name: '物理', 已完成: 22, 未完成: 23 },
  { name: '化学', 已完成: 18, 未完成: 27 },
];

// 模拟学生活跃度数据
const studentActivityData = [
  { name: '周一', 活跃度: 40 },
  { name: '周二', 活跃度: 30 },
  { name: '周三', 活跃度: 45 },
  { name: '周四', 活跃度: 35 },
  { name: '周五', 活跃度: 50 },
  { name: '周六', 活跃度: 25 },
  { name: '周日', 活跃度: 15 },
];

// 模拟待批改作业
const pendingAssignments = [
  { id: 1, subject: '数学', title: '函数基础练习', assignedDate: '2023-11-15', dueDate: '2023-11-20', submissions: 35, pending: 10 },
  { id: 2, subject: '语文', title: '阅读理解训练', assignedDate: '2023-11-16', dueDate: '2023-11-21', submissions: 30, pending: 15 },
  { id: 3, subject: '英语', title: '语法巩固练习', assignedDate: '2023-11-17', dueDate: '2023-11-22', submissions: 28, pending: 17 },
];

// 模拟最近上传资源
const recentResources = [
  { id: 1, name: '高一数学函数课件', type: 'PPT', subject: '数学', size: '2.4MB', uploadDate: '今天 09:23' },
  { id: 2, name: '物理实验视频讲解', type: '视频', subject: '物理', size: '45.6MB', uploadDate: '昨天 14:35' },
  { id: 3, name: '英语听力材料', type: '音频', subject: '英语', size: '12.8MB', uploadDate: '昨天 10:15' },
  { id: 4, name: '语文阅读理解答题技巧', type: 'PDF', subject: '语文', size: '1.2MB', uploadDate: '前天 16:40' },
];

export default function TeacherDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  
  // 模拟数据加载
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // 如果不是教师，重定向到首页
  useEffect(() => {
    if (user && user.role !== 'teacher') {
      navigate('/');
    }
  }, [user, navigate]);
  
  // 处理作业批改
  const handleGradeAssignment = (id) => {
    toast.success('进入作业批改界面');
    // 这里应该导航到作业批改页面
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* 左侧Logo和标题 */}
            <div className="flex items-center space-x-2">
              <i className="fa-solid fa-graduation-cap text-green-600 dark:text-green-400 text-xl"></i>
              <h1 className="text-lg font-semibold hidden sm:block">智慧教辅系统</h1>
            </div>
            
            {/* 中间导航链接 - 仅在大屏幕显示 */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link 
                to="/teacher/dashboard" 
                className="text-green-600 dark:text-green-400 font-medium flex items-center"
              >
                <i className="fa-solid fa-tachometer-alt mr-1"></i>
                <span>仪表盘</span>
              </Link>
              <Link 
                to="/teacher/resources" 
                className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 flex items-center"
              >
                <i className="fa-solid fa-book-open mr-1"></i>
                <span>资源管理</span>
              </Link>
              <Link 
                to="/teacher/lesson-plans" 
                className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 flex items-center"
              >
                <i className="fa-solid fa-file-pen mr-1"></i>
                <span>教案生成</span>
              </Link>
              <Link 
                to="/teacher/assignments" 
                className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 flex items-center"
              >
                <i className="fa-solid fa-clipboard-list mr-1"></i>
                <span>作业管理</span>
              </Link>
            </nav>
            
            {/* 右侧用户信息和操作 */}
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <i className="fa-solid fa-bell"></i>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <div className="relative group">
                <button className="flex items-center space-x-2 focus:outline-none">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <i className="fa-solid fa-chalkboard-user text-gray-600 dark:text-gray-300"></i>
                  </div>
                  <span className="hidden md:inline text-sm font-medium">{user?.name || '教师'}</span>
                  <i className="fa-solid fa-chevron-down text-xs text-gray-500"></i>
                </button>
                
                {/* 下拉菜单 */}
                <div className="absolute right-0 mt-0 pt-2 w-48 z-50 hidden group-hover:block">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 border border-gray-200 dark:border-gray-700">
                    <button 
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                    >
                      <i className="fa-solid fa-sign-out-alt mr-2 text-gray-500"></i>
                      <span>退出登录</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* 主内容区 */}
      <main className="container mx-auto px-4 py-6">
        {/* 页面标题 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">教师仪表盘</h2>
          <p className="text-gray-600 dark:text-gray-400">教学资源与作业管理中心</p>
        </div>
        
        {/* 加载状态 */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-12 h-12 border-t-2 border-b-2 border-green-500 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">加载数据中...</p>
          </div>
        ) : (
          <>
            {/* 快捷操作按钮 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
               <Link
                  to="/teacher/resources"
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all transform hover:-translate-y-1 flex flex-col items-center text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mb-3">
                    <i className="fa-solid fa-cloud-upload text-green-600 dark:text-green-400 text-xl"></i>
                  </div>
                  <h3 className="text-sm font-medium text-gray-800 dark:text-white">上传资源</h3>
                </Link>
              
               <Link
                 to="/teacher/lesson-plan-generator"
                 className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all transform hover:-translate-y-1 flex flex-col items-center text-center"
               >
                 <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mb-3">
                   <i className="fa-solid fa-file-pen text-blue-600 dark:text-blue-400 text-xl"></i>
                 </div>
                 <h3 className="text-sm font-medium text-gray-800 dark:text-white">生成教案</h3>
               </Link>
              
              <Link
                to="/teacher/assignments/create"
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all transform hover:-translate-y-1 flex flex-col items-center text-center"
              >
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mb-3">
                  <i className="fa-solid fa-clipboard-list text-purple-600 dark:text-purple-400 text-xl"></i>
                </div>
                <h3 className="text-sm font-medium text-gray-800 dark:text-white">布置作业</h3>
              </Link>
              
              <Link
                to="/teacher/assignments/grading"
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all transform hover:-translate-y-1 flex flex-col items-center text-center"
              >
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mb-3">
                  <i className="fa-solid fa-check-to-slot text-amber-600 dark:text-amber-400 text-xl"></i>
                </div>
                <h3 className="text-sm font-medium text-gray-800 dark:text-white">批改作业</h3>
              </Link>
            </div>
            
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">待批改作业</h3>
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                    <i className="fa-solid fa-clipboard-check text-red-600 dark:text-red-400"></i>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-gray-800 dark:text-white">42</p>
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <i className="fa-solid fa-arrow-up mr-1"></i>
                      <span>8 较昨日</span>
                    </p>
                  </div>
                  <div className="h-12 w-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[{ value: 25 }, { value: 34 }, { value: 42 }]}>
                        <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">教学资源</h3>
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                    <i className="fa-solid fa-book-open text-blue-600 dark:text-blue-400"></i>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-gray-800 dark:text-white">128</p>
                    <p className="text-green-500 text-sm mt-1 flex items-center">
                      <i className="fa-solid fa-arrow-up mr-1"></i>
                      <span>12% 较上月</span>
                    </p>
                  </div>
                  <div className="h-12 w-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[{ value: 95 }, { value: 114 }, { value: 128 }]}>
                        <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">已创建教案</h3>
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                    <i className="fa-solid fa-file-pen text-purple-600 dark:text-purple-400"></i>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-gray-800 dark:text-white">36</p>
                    <p className="text-green-500 text-sm mt-1 flex items-center">
                      <i className="fa-solid fa-arrow-up mr-1"></i>
                      <span>5 较上月</span>
                    </p>
                  </div>
                  <div className="h-12 w-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[{ value: 22 }, { value: 31 }, { value: 36 }]}>
                        <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">学生提问</h3>
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                    <i className="fa-solid fa-question-circle text-amber-600 dark:text-amber-400"></i>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-gray-800 dark:text-white">15</p>
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <i className="fa-solid fa-arrow-up mr-1"></i>
                      <span>3 较昨日</span>
                    </p>
                  </div>
                  <div className="h-12 w-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[{ value: 8 }, { value: 12 }, { value: 15 }]}>
                        <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 图表区域 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* 作业完成情况图表 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-gray-800 dark:text-white">各学科作业完成情况</h3>
                  <Link 
                    to="/teacher/assignments"
                    className="text-green-600 dark:text-green-400 text-sm hover:underline flex items-center"
                  >
                    <span>查看全部</span>
                    <i className="fa-solid fa-chevron-right ml-1 text-xs"></i>
                  </Link>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={assignmentCompletionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }} 
                      />
                      <Bar dataKey="已完成" fill="#10b981" radius={[4, 4, 0, 0]} name="已完成" />
                      <Bar dataKey="未完成" fill="#ef4444" radius={[4, 4, 0, 0]} name="未完成" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* 学生活跃度图表 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-gray-800 dark:text-white">学生周活跃度趋势</h3>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 text-xs bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-full">周</button>
                    <button className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full hover:bg-green-100 dark:hover:bg-green-900/50 hover:text-green-600 dark:hover:text-green-400 transition-colors">月</button>
                  </div>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={studentActivityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="活跃度" 
                        stroke="#10b981" 
                        strokeWidth={3} 
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                        name="活跃度"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            {/* 待批改作业和最近上传资源 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 待批改作业 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                     <h3 className="font-semibold text-gray-800 dark:text-white">待批改作业</h3>
                    <Link 
                      to="/teacher/assignments"
                      className="text-green-600 dark:text-green-400 text-sm hover:underline flex items-center"
                    >
                      <span>查看全部</span>
                      <i className="fa-solid fa-chevron-right ml-1 text-xs"></i>
                    </Link>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {pendingAssignments.map((assignment) => (
                    <div key={assignment.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center">
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400 rounded-full mr-2">
                              {assignment.subject}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              截止日期: {assignment.dueDate}
                            </span>
                          </div>
                          <h4 className="text-base font-medium text-gray-800 dark:text-white mt-2">{assignment.title}</h4>
                          <div className="flex items-center mt-2 text-sm">
                            <span className="text-gray-600 dark:text-gray-300 mr-4">
                              <i className="fa-solid fa-user-check mr-1 text-green-500"></i>
                              已提交: {assignment.submissions}
                            </span>
                            <span className="text-gray-600 dark:text-gray-300">
                              <i className="fa-solid fa-user-times mr-1 text-red-500"></i>
                              待批改: {assignment.pending}
                            </span>
                          </div>
                        </div>
                        <button 
                           onClick={() => navigate(`/teacher/assignments/progress/${assignment.id}`)}
                          className="ml-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                        >
                          开始批改
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 最近上传资源 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800 dark:text-white">最近上传资源</h3>
                    <Link 
                      to="/teacher/resources"
                      className="text-green-600 dark:text-green-400 text-sm hover:underline flex items-center"
                    >
                      <span>查看全部</span>
                      <i className="fa-solid fa-chevron-right ml-1 text-xs"></i>
                    </Link>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentResources.map((resource) => (
                    <div key={resource.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center mr-3 bg-gray-100 dark:bg-gray-700">
                          {resource.type === 'PPT' && <i className="fa-solid fa-file-powerpoint text-orange-600 dark:text-orange-400"></i>}
                          {resource.type === '视频' && <i className="fa-solid fa-file-video text-red-600 dark:text-red-400"></i>}
                          {resource.type === '音频' && <i className="fa-solid fa-file-audio text-green-600 dark:text-green-400"></i>}
                          {resource.type === 'PDF' && <i className="fa-solid fa-file-pdf text-red-600 dark:text-red-400"></i>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center">
                            <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-400 rounded-full mr-2">
                              {resource.subject}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{resource.size}</span>
                          </div>
                          <p className="text-sm font-medium text-gray-800 dark:text-white mt-1 truncate">{resource.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{resource.uploadDate}</p>
                        </div>
                        <div className="flex items-center space-x-2 ml-2">
                          <button className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            <i className="fa-solid fa-eye"></i>
                          </button>
                          <button className="text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            <i className="fa-solid fa-download"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
      
      {/* 页脚 */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>© 2025 智慧教辅系统 - 教师后台</p>
        </div>
      </footer>
    </div>
  );
}