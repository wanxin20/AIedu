import { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { getTeacherDashboard } from '@/services/statisticsApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function TeacherDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // 加载教师仪表盘数据
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getTeacherDashboard();
        console.log('教师仪表盘数据:', response);
        setDashboardData(response.data);
      } catch (err: any) {
        console.error('加载仪表盘数据失败:', err);
        setError(err.message || '加载数据失败');
        toast.error('加载数据失败: ' + (err.message || '未知错误'));
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDashboardData();
  }, []);
  
  // 如果不是教师，重定向到首页
  useEffect(() => {
    if (user && user.role !== 'teacher') {
      navigate('/');
    }
  }, [user, navigate]);
  
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
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <i className="fa-solid fa-exclamation-triangle text-red-500 text-5xl mb-4"></i>
            <p className="text-gray-800 dark:text-white text-lg font-medium mb-2">数据加载失败</p>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              重新加载
            </button>
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
                    <p className="text-3xl font-bold text-gray-800 dark:text-white">
                      {dashboardData?.pendingGrading || 0}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      待批改提交
                    </p>
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
                    <p className="text-3xl font-bold text-gray-800 dark:text-white">
                      {dashboardData?.resourceCount || 0}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      已上传资源
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">作业数量</h3>
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                    <i className="fa-solid fa-clipboard-list text-purple-600 dark:text-purple-400"></i>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-gray-800 dark:text-white">
                      {dashboardData?.assignmentCount?.total || 0}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      已发布 {dashboardData?.assignmentCount?.published || 0} • 
                      草稿 {dashboardData?.assignmentCount?.draft || 0}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">学生总数</h3>
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                    <i className="fa-solid fa-users text-amber-600 dark:text-amber-400"></i>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-gray-800 dark:text-white">
                      {dashboardData?.studentCount || 0}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      班级 {dashboardData?.classCount || 0}
                    </p>
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
                  {dashboardData?.subjectStats && dashboardData.subjectStats.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboardData.subjectStats}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="subject" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" allowDecimals={false} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Bar dataKey="total" name="作业总数" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="submitted" name="已提交" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                      <div className="text-center">
                        <i className="fa-solid fa-chart-bar text-4xl mb-4"></i>
                        <p>暂无作业完成情况数据</p>
                        <p className="text-xs mt-1">发布作业后会显示统计数据</p>
                      </div>
                    </div>
                  )}
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
                  {dashboardData?.studentActivityTrend && dashboardData.studentActivityTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dashboardData.studentActivityTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#9ca3af"
                          tickFormatter={(value) => {
                            const parts = value.split('-');
                            return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
                          }}
                        />
                        <YAxis stroke="#9ca3af" allowDecimals={false} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                          labelFormatter={(value) => {
                            const parts = value.split('-');
                            return `${parts[0]}年${parseInt(parts[1])}月${parseInt(parts[2])}日`;
                          }}
                        />
                        <Line type="monotone" dataKey="活跃学生" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="作业提交" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                      <div className="text-center">
                        <i className="fa-solid fa-chart-line text-4xl mb-4"></i>
                        <p>暂无学生活跃度数据</p>
                        <p className="text-xs mt-1">学生登录后会显示统计数据</p>
                      </div>
                    </div>
                  )}
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
                  {(dashboardData?.recentAssignments || []).slice(0, 3).map((assignment: any) => (
                    <div key={assignment.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center">
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400 rounded-full mr-2">
                              {assignment.subject}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              截止: {assignment.deadline ? new Date(assignment.deadline).toLocaleDateString('zh-CN') : '-'}
                            </span>
                          </div>
                          <h4 className="text-base font-medium text-gray-800 dark:text-white mt-2">{assignment.title}</h4>
                          <div className="flex items-center mt-2 text-sm">
                            <span className="text-gray-600 dark:text-gray-300">
                              状态: {assignment.status === 'published' ? '已发布' : assignment.status === 'draft' ? '草稿' : '已关闭'}
                            </span>
                          </div>
                        </div>
                        <button 
                           onClick={() => navigate(`/teacher/assignments/progress/${assignment.id}`)}
                          className="ml-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                        >
                          查看详情
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!dashboardData?.recentAssignments || dashboardData.recentAssignments.length === 0) && (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      暂无作业数据
                    </div>
                  )}
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
                  {(dashboardData?.recentResources || []).map((resource: any) => (
                    <div key={resource.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400 rounded-full mr-2">
                              {resource.category || resource.type}
                            </span>
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400 rounded-full">
                              {resource.subject}
                            </span>
                          </div>
                          <h4 className="text-base font-medium text-gray-800 dark:text-white mt-2">{resource.title}</h4>
                          <div className="flex items-center mt-2 text-sm text-gray-600 dark:text-gray-300">
                            <i className="fa-solid fa-file mr-1 text-gray-400"></i>
                            <span className="mr-4">{resource.fileName}</span>
                            <i className="fa-solid fa-clock mr-1 text-gray-400"></i>
                            <span>{resource.createdAt ? new Date(resource.createdAt).toLocaleDateString('zh-CN') : '-'}</span>
                          </div>
                        </div>
                        <a 
                          href={resource.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                        >
                          查看
                        </a>
                      </div>
                    </div>
                  ))}
                  {(!dashboardData?.recentResources || dashboardData.recentResources.length === 0) && (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      <i className="fa-solid fa-folder-open text-4xl mb-4"></i>
                      <p>暂无最近上传资源</p>
                      <Link 
                        to="/teacher/resources"
                        className="inline-block mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        上传资源
                      </Link>
                    </div>
                  )}
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