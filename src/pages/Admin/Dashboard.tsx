import { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { toast } from 'sonner';

// 模拟系统状态数据
const systemStatusData = [
  { name: '周一', 活跃用户: 40, 资源访问: 240, 作业提交: 180 },
  { name: '周二', 活跃用户: 30, 资源访问: 139, 作业提交: 130 },
  { name: '周三', 活跃用户: 20, 资源访问: 980, 作业提交: 290 },
  { name: '周四', 活跃用户: 27, 资源访问: 390, 作业提交: 350 },
  { name: '周五', 活跃用户: 18, 资源访问: 480, 作业提交: 280 },
  { name: '周六', 活跃用户: 23, 资源访问: 380, 作业提交: 180 },
  { name: '周日', 活跃用户: 34, 资源访问: 430, 作业提交: 230 },
];

// 模拟存储使用数据
const storageUsageData = [
  { name: '文档', value: 35, color: '#3b82f6' },
  { name: '视频', value: 45, color: '#10b981' },
  { name: '图片', value: 15, color: '#f59e0b' },
  { name: '其他', value: 5, color: '#6b7280' },
];

// 模拟班级数据
const classData = [
  { id: 1, name: '高一(1)班', students: 45, teachers: 3, status: 'active' },
  { id: 2, name: '高一(2)班', students: 42, teachers: 3, status: 'active' },
  { id: 3, name: '高二(1)班', students: 48, teachers: 4, status: 'active' },
  { id: 4, name: '高二(2)班', students: 40, teachers: 4, status: 'active' },
  { id: 5, name: '高三(1)班', students: 38, teachers: 5, status: 'active' },
  { id: 6, name: '高三(2)班', students: 36, teachers: 5, status: 'archived' },
];

// 模拟最近操作日志
const recentLogs = [
  { id: 1, user: '张老师', action: '上传了教学资源', time: '今天 09:23', ip: '192.168.1.101' },
  { id: 2, user: '李同学', action: '提交了数学作业', time: '今天 08:45', ip: '192.168.1.156' },
  { id: 3, user: '系统管理员', action: '创建了新班级', time: '昨天 16:30', ip: '192.168.1.5' },
  { id: 4, user: '王老师', action: '布置了英语作业', time: '昨天 14:20', ip: '192.168.1.105' },
  { id: 5, user: '系统管理员', action: '修改了安全设置', time: '昨天 10:15', ip: '192.168.1.5' },
];

export default function AdminDashboard() {
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
  
  // 如果不是管理员，重定向到首页
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);
  
  // 处理班级归档
  const handleArchiveClass = (id) => {
    toast.success('班级已成功归档');
  };
  
  // 处理系统通知
  const handleSystemNotice = () => {
    toast.info('系统运行正常，无重要通知');
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* 左侧Logo和标题 */}
            <div className="flex items-center space-x-2">
              <i className="fa-solid fa-graduation-cap text-blue-600 dark:text-blue-400 text-xl"></i>
              <h1 className="text-lg font-semibold hidden sm:block">智慧教辅系统</h1>
            </div>
            
            {/* 中间导航链接 - 仅在大屏幕显示 */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link 
                to="/admin/dashboard" 
                className="text-blue-600 dark:text-blue-400 font-medium flex items-center"
              >
                <i className="fa-solid fa-tachometer-alt mr-1"></i>
                <span>仪表盘</span>
              </Link>
              <Link 
                to="/admin/classes" 
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center"
              >
                <i className="fa-solid fa-users mr-1"></i>
                <span>班级管理</span>
              </Link>
              <Link 
                to="/admin/logs" 
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center"
              >
                <i className="fa-solid fa-history mr-1"></i>
                <span>操作日志</span>
              </Link>
              <Link 
                to="/admin/security" 
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center"
              >
                <i className="fa-solid fa-shield mr-1"></i>
                <span>安全管理</span>
              </Link>
            </nav>
            
            {/* 右侧用户信息和操作 */}
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleSystemNotice}
                className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <i className="fa-solid fa-bell"></i>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <div className="relative group">
                <button className="flex items-center space-x-2 focus:outline-none">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <i className="fa-solid fa-user-shield text-gray-600 dark:text-gray-300"></i>
                  </div>
                  <span className="hidden md:inline text-sm font-medium">{user?.name || '管理员'}</span>
                  <i className="fa-solid fa-chevron-down text-xs text-gray-500"></i>
                </button>
                
                {/* 下拉菜单 */}
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-50 hidden group-hover:block border border-gray-200 dark:border-gray-700">
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
      </header>
      
      {/* 主内容区 */}
      <main className="container mx-auto px-4 py-6">
        {/* 页面标题 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">管理员仪表盘</h2>
          <p className="text-gray-600 dark:text-gray-400">系统概览和管理中心</p>
        </div>
        
        {/* 加载状态 */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">加载数据中...</p>
          </div>
        ) : (
          <>
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">总用户数</h3>
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                    <i className="fa-solid fa-users text-blue-600 dark:text-blue-400"></i>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-gray-800 dark:text-white">248</p>
                    <p className="text-green-500 text-sm mt-1 flex items-center">
                      <i className="fa-solid fa-arrow-up mr-1"></i>
                      <span>12% 较上月</span>
                    </p>
                  </div>
                  <div className="h-12 w-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[{ value: 180 }, { value: 210 }, { value: 248 }]}>
                        <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">班级数量</h3>
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                    <i className="fa-solid fa-school text-green-600 dark:text-green-400"></i>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-gray-800 dark:text-white">12</p>
                    <p className="text-green-500 text-sm mt-1 flex items-center">
                      <i className="fa-solid fa-arrow-up mr-1"></i>
                      <span>3% 较上月</span>
                    </p>
                  </div>
                  <div className="h-12 w-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[{ value: 10 }, { value: 11 }, { value: 12 }]}>
                        <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">资源总量</h3>
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                    <i className="fa-solid fa-cloud text-purple-600 dark:text-purple-400"></i>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-gray-800 dark:text-white">1.2k</p>
                    <p className="text-green-500 text-sm mt-1 flex items-center">
                      <i className="fa-solid fa-arrow-up mr-1"></i>
                      <span>23% 较上月</span>
                    </p>
                  </div>
                  <div className="h-12 w-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[{ value: 800 }, { value: 1050 }, { value: 1200 }]}>
                        <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">存储使用</h3>
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                    <i className="fa-solid fa-hdd text-amber-600 dark:text-amber-400"></i>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-gray-800 dark:text-white">85%</p>
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <i className="fa-solid fa-arrow-up mr-1"></i>
                      <span>5% 较上月</span>
                    </p>
                  </div>
                  <div className="h-12 w-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[{ value: 70 }, { value: 80 }, { value: 85 }]}>
                        <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 图表区域 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* 系统活跃度图表 */}
              <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-gray-800 dark:text-white">系统活跃度趋势</h3>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full">周</button>
                    <button className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">月</button>
                    <button className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">年</button>
                  </div>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={systemStatusData}>
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
                      <Bar dataKey="活跃用户" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="资源访问" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="作业提交" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* 存储使用饼图 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-6">存储使用分布</h3>
                <div className="flex items-center justify-center h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={storageUsageData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {storageUsageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${value}%`, '占比']}
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {storageUsageData.map((item, index) => (
                    <div key={index} className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">{item.name}: {item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* 班级列表和最近操作日志 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 班级列表 */}
              <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800 dark:text-white">班级管理</h3>
                    <Link 
                      to="/admin/classes"
                      className="text-blue-600 dark:text-blue-400 text-sm hover:underline flex items-center"
                    >
                      <span>查看全部</span>
                      <i className="fa-solid fa-chevron-right ml-1 text-xs"></i>
                    </Link>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">班级名称</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">学生数量</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">教师数量</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">状态</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {classData.slice(0, 5).map((cls) => (
                        <tr key={cls.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-800 dark:text-white">{cls.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600 dark:text-gray-300">{cls.students}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600 dark:text-gray-300">{cls.teachers}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              cls.status === 'active' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400' 
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {cls.status === 'active' ? '活跃' : '已归档'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300">
                                <i className="fa-solid fa-pen-to-square"></i>
                              </button>{cls.status === 'active' && (
                                <button 
                                  onClick={() => handleArchiveClass(cls.id)}
                                  className="text-amber-600 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300"
                                >
                                  <i className="fa-solid fa-box-archive"></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* 最近操作日志 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800 dark:text-white">最近操作日志</h3>
                    <Link 
                      to="/admin/logs"
                      className="text-blue-600 dark:text-blue-400 text-sm hover:underline flex items-center"
                    >
                      <span>查看全部</span>
                      <i className="fa-solid fa-chevron-right ml-1 text-xs"></i>
                    </Link>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentLogs.map((log) => (
                    <div key={log.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-3">
                          <i className="fa-solid fa-user text-gray-600 dark:text-gray-300 text-sm"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 dark:text-white">
                            <span className="font-medium">{log.user}</span> {log.action}
                          </p>
                          <div className="flex items-center mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">{log.time}</span>
                            <span className="mx-2 text-gray-300 dark:text-gray-600">•</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{log.ip}</span>
                          </div>
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
          <p>© 2025 智慧教辅系统 - 管理员后台</p>
        </div>
      </footer>
    </div>
  );
}