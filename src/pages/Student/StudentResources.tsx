import { useContext, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';

// 定义资源接口
interface Resource {
  id: number;
  name: string;
  subject: string;
  createdAt: string;
  attachment: {
    type: "pdf" | "video" | "image" | "link";
    url: string;
    fileName?: string;
  };
  uploaderName: string;
  views: number;
}

// 模拟资源数据
const mockResources: Resource[] = [
  {
    id: 1,
    name: "高中数学函数知识点总结",
    subject: "数学",
    createdAt: "2025-09-01",
    attachment: {
      type: "pdf",
      url: "https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=Math%20Function%20Summary%20PDF%20Document&sign=b0db3e224e713e462098ebe6b921d7ab",
      fileName: "函数知识点总结.pdf"
    },
    uploaderName: "张老师",
    views: 128
  },
  {
    id: 2,
    name: "物理力学实验视频讲解",
    subject: "物理",
    createdAt: "2025-09-02",
    attachment: {
      type: "video",
      url: "https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=Physics%20Mechanics%20Experiment%20Video&sign=99fb50a9df0d1b57fcc6570256b9e992",
      fileName: "力学实验.mp4"
    },
    uploaderName: "李老师",
    views: 256
  },
  {
    id: 3,
    name: "英语阅读理解答题技巧",
    subject: "英语",
    createdAt: "2025-09-03",
    attachment: {
      type: "image",
      url: "https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=English%20Reading%20Comprehension%20Skills&sign=8bb130e56afef603b1987ce15c23646c",
      fileName: "答题技巧.png"
    },
    uploaderName: "王老师",
    views: 156
  },
  {
    id: 4,
    name: "历史事件时间轴",
    subject: "历史",
    createdAt: "2025-09-05",
    attachment: {
      type: "link",
      url: "https://example.com/history-timeline",
      fileName: "历史时间轴"
    },
    uploaderName: "赵老师",
    views: 98
  },
  {
    id: 5,
    name: "化学元素周期表高清版",
    subject: "化学",
    createdAt: "2025-09-07",
    attachment: {
      type: "image",
      url: "https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=Periodic%20Table%20of%20Elements&sign=bc1caba46953572608abb21569bc7152",
      fileName: "元素周期表.jpg"
    },
    uploaderName: "孙老师",
    views: 189
  },
  {
    id: 6,
    name: "地理气候类型分布图",
    subject: "地理",
    createdAt: "2025-09-09",
    attachment: {
      type: "pdf",
      url: "https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=Geography%20Climate%20Map%20PDF&sign=8f190cd5955d46d873beb64d6339bebb",
      fileName: "气候类型分布图.pdf"
    },
    uploaderName: "周老师",
    views: 85
  }
];

export default function StudentResources() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAttachmentPreview, setShowAttachmentPreview] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  // 模拟数据加载
  useEffect(() => {
    const timer = setTimeout(() => {
      setResources(mockResources);
      setFilteredResources(mockResources);
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
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
      resource.name.toLowerCase().includes(term) || resource.name.toLowerCase() === term
    );
    
    setFilteredResources(results);
  }, [searchTerm, resources]);
  
  // 处理查看附件
  const handleViewAttachment = (resource: Resource) => {
    setSelectedResource(resource);
    setShowAttachmentPreview(true);
  };
  
  // 处理打开链接
  const handleOpenLink = (url: string) => {
    window.open(url, '_blank');
  };
  
  // 关闭附件预览
  const handleClosePreview = () => {
    setShowAttachmentPreview(false);
    setSelectedResource(null);
  };
  
  // 渲染附件预览
  const renderAttachmentPreview = () => {
    if (!selectedResource) return null;
    
    const { attachment } = selectedResource;
    
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{selectedResource.name}</h3>
            <button 
              onClick={handleClosePreview}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <i className="fa-solid fa-times text-xl"></i>
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <div className="flex justify-center items-center min-h-[60vh]">
              {attachment.type === 'pdf' ? (
                <div className="bg-gray-100 dark:bg-gray-700 p-8 rounded-lg max-w-full max-h-[60vh] flex flex-col items-center justify-center">
                  <i className="fa-solid fa-file-pdf text-red-500 text-6xl mb-4"></i>
                  <p className="text-center text-gray-700 dark:text-gray-300 mb-2">{attachment.fileName}</p>
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">PDF文件预览</p>
                  <a 
                    href={attachment.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center"
                  >
                    <i className="fa-solid fa-download mr-2"></i>
                    <span>下载文件</span>
                  </a>
                </div>
              ) : attachment.type === 'image' ? (
                <img
                  src={attachment.url}
                  alt={attachment.fileName || selectedResource.name}
                  className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
                />
              ) : attachment.type === 'video' ? (
                <div className="bg-gray-100 dark:bg-gray-700 p-8 rounded-lg max-w-full max-h-[60vh] flex flex-col items-center justify-center">
                  <i className="fa-solid fa-file-video text-blue-500 text-6xl mb-4"></i>
                  <p className="text-center text-gray-700 dark:text-gray-300 mb-2">{attachment.fileName}</p>
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">视频文件预览</p>
                  <a 
                    href={attachment.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
                  >
                    <i className="fa-solid fa-download mr-2"></i>
                    <span>下载文件</span>
                  </a>
                </div>
              ) : (
                <div className="bg-gray-100 dark:bg-gray-700 p-8 rounded-lg max-w-full max-h-[60vh] flex flex-col items-center justify-center">
                  <i className="fa-solid fa-link text-blue-500 text-6xl mb-4"></i>
                  <p className="text-center text-gray-700 dark:text-gray-300 mb-2">{attachment.fileName}</p>
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">外部链接</p>
                  <button 
                    onClick={() => handleOpenLink(attachment.url)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
                  >
                    <i className="fa-solid fa-external-link-alt mr-2"></i>
                    <span>打开链接</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
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
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{resource.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 dark:text-gray-300">{resource.subject}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 dark:text-gray-300">{resource.createdAt}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 dark:text-gray-300">{resource.uploaderName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 dark:text-gray-300">{resource.views}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button 
                          onClick={() => handleViewAttachment(resource)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-5 font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                        >
                          {resource.attachment.type === "pdf" && <i className="fa-solid fa-file-pdf mr-1.5"></i>}
                          {resource.attachment.type === "video" && <i className="fa-solid fa-file-video mr-1.5"></i>}
                          {resource.attachment.type === "image" && <i className="fa-solid fa-file-image mr-1.5"></i>}
                          {resource.attachment.type === "link" && <i className="fa-solid fa-link mr-1.5"></i>}
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
      
      {/* 附件预览弹窗 */}
      {showAttachmentPreview && renderAttachmentPreview()}
    </div>
  );
}