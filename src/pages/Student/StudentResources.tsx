import { useContext, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { getResources, downloadResource } from '@/services/resourceApi';

// 定义资源接口
interface Resource {
  id: number;
  title: string;
  subject: string;
  created_at: string;
  file_url: string;
  file_name: string;
  type: string;
  uploader_name?: string;
  view_count?: number;
}

export default function StudentResources() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAttachmentPreview, setShowAttachmentPreview] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 加载资源列表
  const loadResources = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getResources({ page: 1, pageSize: 100 });
      console.log('资源列表数据:', response);
      setResources(response.data.items || []);
      setFilteredResources(response.data.items || []);
    } catch (err: any) {
      console.error('加载资源列表失败:', err);
      setError(err.message || '加载数据失败');
      toast.error('加载资源失败: ' + (err.message || '未知错误'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);
  
  // 权限检查
  useEffect(() => {
    if (user && user.role !== 'student') {
      navigate('/');
    }
  }, [user, navigate]);
  
  // 搜索功能
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredResources(resources);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const results = resources.filter(resource => 
      resource.title.toLowerCase().includes(term) || resource.title.toLowerCase() === term
    );
    
    setFilteredResources(results);
  }, [searchTerm, resources]);
  
  // 处理查看附件
  const handleViewAttachment = async (resource: Resource) => {
    try {
      // 记录下载
      await downloadResource(resource.id);
      // 打开文件URL
      window.open(resource.file_url, '_blank');
    } catch (err: any) {
      console.error('打开资源失败:', err);
      toast.error('打开资源失败: ' + (err.message || '未知错误'));
    }
  };
  
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <i className="fa-solid fa-graduation-cap text-orange-600 dark:text-orange-400 text-xl"></i>
              <h1 className="text-lg font-semibold hidden sm:block">智慧教辅系统</h1>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <Link 
                to="/student/dashboard" 
                className="text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 flex items-center"
              >
                <i className="fa-solid fa-tachometer-alt mr-1"></i>
                <span>仪表盘</span>
              </Link>
              <Link 
                to="/student/assignments" 
                className="text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 flex items-center"
              >
                <i className="fa-solid fa-clipboard-list mr-1"></i>
                <span>作业中心</span>
              </Link>
              <Link 
                to="/student/resources" 
                className="text-orange-600 dark:text-orange-400 font-medium flex items-center"
              >
                <i className="fa-solid fa-book-open mr-1"></i>
                <span>学习资源</span>
              </Link>
              <Link 
                to="/student/learning-assistant" 
                className="text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 flex items-center"
              >
                <i className="fa-solid fa-question-circle mr-1"></i>
                <span>学习助手</span>
              </Link>
            </nav>
            
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <i className="fa-solid fa-bell"></i>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <div className="relative group">
                <button className="flex items-center space-x-2 focus:outline-none">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <i className="fa-solid fa-user-graduate text-gray-600 dark:text-gray-300"></i>
                  </div>
                  <span className="hidden md:inline text-sm font-medium">{user?.name || '学生'}</span>
                  <i className="fa-solid fa-chevron-down text-xs text-gray-500"></i>
                </button>
                
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
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">学习资源</h2>
          <p className="text-gray-600 dark:text-gray-400">浏览和学习教师上传的教学资源</p>
        </div>
        
        {/* 搜索区域 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fa-solid fa-search text-gray-400"></i>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white transition-colors"
              placeholder="请输入资源名称"
            />
          </div>
        </div>
        
        {/* 加载状态 */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <div className="w-12 h-12 border-t-2 border-b-2 border-orange-500 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">加载资源数据中...</p>
          </div>
        ) : filteredResources.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">序号</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">资源名称</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">所属学科</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">创建时间</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">上传教师</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">查看次数</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">附件</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredResources.map((resource, index) => (
                    <tr key={resource.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">{index + 1}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{resource.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 dark:text-gray-300">{resource.subject}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {resource.created_at ? new Date(resource.created_at).toLocaleDateString('zh-CN') : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 dark:text-gray-300">{resource.uploader_name || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 dark:text-gray-300">{resource.view_count || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button 
                          onClick={() => handleViewAttachment(resource)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-5 font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                        >
                          {resource.type === "document" && <i className="fa-solid fa-file-pdf mr-1.5"></i>}
                          {resource.type === "video" && <i className="fa-solid fa-file-video mr-1.5"></i>}
                          {resource.type === "image" && <i className="fa-solid fa-file-image mr-1.5"></i>}
                          {resource.type === "other" && <i className="fa-solid fa-link mr-1.5"></i>}
                          查看附件
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* 分页控件 */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                显示 <span className="font-medium">1</span> 到 <span className="font-medium">{filteredResources.length}</span> 条，共 <span className="font-medium">{resources.length}</span> 条记录
              </div>
              <div className="flex space-x-1">
                <button className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                  <i className="fa-solid fa-chevron-left text-xs"></i>
                </button>
                <button className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-md bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/50">
                  1
                </button>
                <button className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                  <i className="fa-solid fa-chevron-right text-xs"></i>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden min-h-[50vh] flex items-center justify-center">
            <div className="text-center p-8">
              <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <i className="fa-solid fa-search text-gray-400 text-2xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">未找到匹配的资源</h3>
              <p className="text-gray-500 dark:text-gray-400">请尝试调整搜索条件或关键词</p>
              <button 
                onClick={() => setSearchTerm('')}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
              >
                清除搜索条件
              </button>
            </div>
          </div>
        )}
      </main>
      
      {/* 页脚 */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>© 2025 智慧教辅系统 - 学生后台</p>
        </div>
      </footer>
    </div>
  );
}