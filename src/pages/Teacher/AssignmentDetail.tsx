import { useContext, useState, useEffect } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { AuthContext } from "@/contexts/authContext";
import { toast } from "sonner";
import { getAssignmentDetail } from "@/services/assignmentApi";
import { getSubmissionDetail } from "@/services/submissionApi";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// 定义作业信息接口
interface Assignment {
  id: number;
  title: string;
  description: string | null;
  subject: string;
  teacherId: number;
  teacherName: string;
  classId: number;
  className: string;
  deadline: string;
  totalScore: number;
  attachments: any[];
  status: string;
  createdAt: string;
}

// 定义提交信息接口
interface Submission {
  id: number;
  assignmentId: number;
  assignmentTitle?: string;
  studentId: number;
  studentName?: string;
  content: string | null;
  attachments: any[];
  score: number | null;
  comment: string | null;
  status: 'pending' | 'submitted' | 'graded';
  submittedAt: string | null;
  gradedAt: string | null;
  gradedBy: number | null;
  createdAt: string;
}

export default function AssignmentDetail() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  
  // 从URL获取参数
  const assignmentId = parseInt(params.id || '0', 10);
  const searchParams = new URLSearchParams(location.search);
  const submissionId = parseInt(searchParams.get('submissionId') || '0', 10);
  
  const [isLoading, setIsLoading] = useState(true);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // 图片预览相关状态
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageScale, setImageScale] = useState(1);
  
  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      if (!assignmentId || !submissionId) {
        setError('缺少必要参数');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // 并行加载作业详情和提交详情
        const [assignmentRes, submissionRes] = await Promise.all([
          getAssignmentDetail(assignmentId),
          getSubmissionDetail(submissionId)
        ]);

        if (assignmentRes.code === 200) {
          setAssignment(assignmentRes.data);
        } else {
          throw new Error(assignmentRes.message || '获取作业信息失败');
        }

        if (submissionRes.code === 200) {
          const submissionData = submissionRes.data;
          
          // 处理 attachments 字段 - 确保它是一个对象数组
          let attachments: any[] = [];
          if (submissionData.attachments) {
            if (Array.isArray(submissionData.attachments)) {
              attachments = submissionData.attachments.map((att: any, index: number) => {
                if (typeof att === 'string') {
                  // 如果是字符串（URL），转换为对象格式
                  return {
                    fileUrl: att,
                    fileName: att.split('/').pop() || `附件${index + 1}`,
                    mimeType: 'image/jpeg' // 默认假设是图片
                  };
                }
                // 如果已经是对象，确保有必要的字段
                return {
                  fileUrl: att.fileUrl || att.url || att,
                  fileName: att.fileName || att.name || att.split('/').pop() || `附件${index + 1}`,
                  mimeType: att.mimeType || att.type || 'image/jpeg'
                };
              });
            }
          }
          
          setSubmission({
            ...submissionData,
            attachments: attachments
          });
        } else {
          throw new Error(submissionRes.message || '获取提交信息失败');
        }
      } catch (err: any) {
        console.error('加载数据失败:', err);
        setError(err.message || '加载数据失败');
        toast.error(err.message || '加载数据失败');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [assignmentId, submissionId]);
  
  // 权限检查
  useEffect(() => {
    if (user && user.role !== "teacher") {
      navigate("/");
    }
  }, [user, navigate]);
  
  // 键盘事件监听（ESC关闭预览）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previewImage) {
        handleClosePreview();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewImage]);
  
  // 处理返回列表
  const handleBackToList = () => {
    navigate(`/teacher/assignments/progress/${assignmentId}`);
  };

  // Markdown 渲染组件
  const MarkdownRenderer = ({ content }: { content: string }) => {
    return (
      <div className="markdown-content prose prose-blue max-w-none dark:prose-invert
        prose-headings:font-semibold
        prose-h1:text-2xl prose-h1:mb-4 prose-h1:mt-6
        prose-h2:text-xl prose-h2:mb-3 prose-h2:mt-5
        prose-h3:text-lg prose-h3:mb-2 prose-h3:mt-4
        prose-h4:text-base prose-h4:mb-2 prose-h4:mt-3
        prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-3
        prose-li:text-gray-700 prose-li:leading-relaxed
        prose-ul:my-3 prose-ol:my-3
        prose-strong:text-gray-900 prose-strong:font-semibold
        prose-code:text-sm prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
        prose-pre:bg-gray-100 prose-pre:border prose-pre:border-gray-200
        prose-table:border-collapse prose-table:w-full
        prose-th:border prose-th:border-gray-300 prose-th:px-4 prose-th:py-2 prose-th:bg-gray-50
        prose-td:border prose-td:border-gray-300 prose-td:px-4 prose-td:py-2
        dark:prose-p:text-gray-300
        dark:prose-li:text-gray-300
        dark:prose-strong:text-white
        dark:prose-code:bg-gray-800
        dark:prose-pre:bg-gray-800 dark:prose-pre:border-gray-700
        dark:prose-th:bg-gray-800 dark:prose-th:border-gray-700
        dark:prose-td:border-gray-700">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeKatex]}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };
  
  // 打开图片预览
  const handleImageClick = (imageUrl: string) => {
    setPreviewImage(imageUrl);
    setImageScale(1);
  };
  
  // 关闭图片预览
  const handleClosePreview = () => {
    setPreviewImage(null);
    setImageScale(1);
  };
  
  // 放大图片
  const handleZoomIn = () => {
    setImageScale(prev => Math.min(prev + 0.25, 3));
  };
  
  // 缩小图片
  const handleZoomOut = () => {
    setImageScale(prev => Math.max(prev - 0.25, 0.5));
  };
  
  // 重置缩放
  const handleResetZoom = () => {
    setImageScale(1);
  };
  
  // 如果有错误或找不到数据
  if (!isLoading && (error || !assignment || !submission)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {/* 顶部导航栏 */}
        <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-2">
                <i className="fa-solid fa-graduation-cap text-green-600 dark:text-green-400 text-xl"></i>
                <h1 className="text-lg font-semibold hidden sm:block">智慧教辅系统</h1>
              </div>
              
              <nav className="hidden md:flex items-center space-x-8">
                <Link 
                  to="/teacher/dashboard" 
                  className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 flex items-center"
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
                  className="text-green-600 dark:text-green-400 font-medium flex items-center"
                >
                  <i className="fa-solid fa-clipboard-list mr-1"></i>
                  <span>作业管理</span>
                </Link>
              </nav>
              
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => toast.info("系统运行正常，无重要通知")}
                  className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <i className="fa-solid fa-bell"></i>
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                
                <div className="relative group">
                  <button className="flex items-center space-x-2 focus:outline-none">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <i className="fa-solid fa-chalkboard-user text-gray-600 dark:text-gray-300"></i>
                    </div>
                    <span className="hidden md:inline text-sm font-medium">{user?.name || "教师"}</span>
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
        
        <main className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">作业详情</h2>
            <p className="text-gray-600 dark:text-gray-400">查看学生提交的作业详情</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex flex-col items-center justify-center min-h-[40vh]">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <i className="fa-solid fa-circle-exclamation text-red-500 dark:text-red-400 text-xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">未找到作业详情</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">
                {error || '无法找到指定的作业或提交信息，请检查参数是否正确。'}
              </p>
              <button
                onClick={handleBackToList}
                className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                <i className="fa-solid fa-arrow-left mr-2"></i>
                返回作业进度列表
              </button>
            </div>
          </div>
        </main>
        
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6 mt-12">
          <div className="container mx-auto px-4 text-center text-gray-500 dark:text-gray-400 text-sm">
            <p>© 2025 智慧教辅系统 - 教师后台</p>
          </div>
        </footer>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <i className="fa-solid fa-graduation-cap text-green-600 dark:text-green-400 text-xl"></i>
              <h1 className="text-lg font-semibold hidden sm:block">智慧教辅系统</h1>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <Link 
                to="/teacher/dashboard" 
                className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 flex items-center"
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
                className="text-green-600 dark:text-green-400 font-medium flex items-center"
              >
                <i className="fa-solid fa-clipboard-list mr-1"></i>
                <span>作业管理</span>
              </Link>
            </nav>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => toast.info("系统运行正常，无重要通知")}
                className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <i className="fa-solid fa-bell"></i>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <div className="relative group">
                <button className="flex items-center space-x-2 focus:outline-none">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <i className="fa-solid fa-chalkboard-user text-gray-600 dark:text-gray-300"></i>
                  </div>
                  <span className="hidden md:inline text-sm font-medium">{user?.name || "教师"}</span>
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
      
      <main className="container mx-auto px-4 py-6">
        {/* 页面标题和返回按钮 */}
        <div className="mb-6 flex items-center">
          <button
            onClick={handleBackToList}
            className="mr-4 text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400"
          >
            <i className="fa-solid fa-arrow-left text-lg"></i>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">作业详情</h2>
            <p className="text-gray-600 dark:text-gray-400">查看学生提交的作业详情</p>
          </div>
        </div>
        
        {/* 加载状态 */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <div className="w-12 h-12 border-t-2 border-b-2 border-green-500 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">加载数据中...</p>
          </div>
        ) : assignment && submission ? (
          <div className="space-y-6">
            {/* 学生和作业基本信息卡片 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mr-4 flex-shrink-0">
                    <i className="fa-solid fa-user-graduate text-blue-600 dark:text-blue-400 text-xl"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">学生信息</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">{submission.studentName || '未知学生'}</p>
                  </div>
                </div>
                <div className="flex items-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mr-4 flex-shrink-0">
                    <i className="fa-solid fa-book text-green-600 dark:text-green-400 text-xl"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">作业名称</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white truncate">{assignment.title}</p>
                  </div>
                </div>
                <div className="flex items-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mr-4 flex-shrink-0">
                    <i className="fa-solid fa-graduation-cap text-amber-600 dark:text-amber-400 text-xl"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">得分</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      {submission.score !== null ? `${submission.score}分` : '未评分'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* 作业状态和时间信息 */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">提交时间</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString('zh-CN') : '未提交'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">批改时间</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {submission.gradedAt ? new Date(submission.gradedAt).toLocaleString('zh-CN') : '未批改'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">作业状态</p>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    submission.status === 'graded' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400' 
                      : submission.status === 'submitted'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {submission.status === 'graded' ? '已批改' : submission.status === 'submitted' ? '已提交' : '未提交'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">学科</p>
                  <p className="text-sm text-gray-900 dark:text-white">{assignment.subject}</p>
                </div>
              </div>
            </div>
            
            {/* 作业描述 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">作业描述</h3>
              <p className="text-gray-600 dark:text-gray-300">{assignment.description || '无描述'}</p>
              
              {/* 作业参考附件 */}
              {(assignment.attachments && assignment.attachments.length > 0) && (
                <div className="mt-6">
                  <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-3">参考附件</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {assignment.attachments.map((attachment: any, index: number) => (
                      <div 
                        key={index}
                        className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => window.open(attachment.url, "_blank")}
                      >
                        {attachment.type === "pdf" && <i className="fa-solid fa-file-pdf text-red-500 text-lg mr-3"></i>}
                        {attachment.type === "image" && <i className="fa-solid fa-file-image text-blue-500 text-lg mr-3"></i>}
                        {attachment.type === "video" && <i className="fa-solid fa-file-video text-green-500 text-lg mr-3"></i>}
                        {attachment.type === "link" && <i className="fa-solid fa-link text-blue-500 text-lg mr-3"></i>}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{attachment.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{attachment.type.toUpperCase()}</p>
                        </div>
                        <i className="fa-solid fa-chevron-right text-gray-400"></i>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* 学生提交的作业附件 */}
            {(submission.attachments && submission.attachments.length > 0) ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">学生作业附件 ({submission.attachments.length})</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {submission.attachments.map((attachment, index) => (
                    <div 
                      key={index}
                      className="relative group cursor-pointer overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700"
                      onClick={() => attachment.fileUrl && handleImageClick(attachment.fileUrl)}
                    >
                      {attachment.mimeType?.startsWith('image/') ? (
                        <>
                          <img
                            src={attachment.fileUrl}
                            alt={attachment.fileName}
                            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105" 
                          />
                          {/* 放大提示 */}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all duration-300">
                            <div className="transform scale-0 group-hover:scale-100 transition-transform duration-300">
                              <div className="bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg">
                                <i className="fa-solid fa-search-plus text-gray-700 dark:text-gray-300 text-xl"></i>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-48 flex items-center justify-center bg-gray-200 dark:bg-gray-600">
                          <i className="fa-solid fa-file text-5xl text-gray-400"></i>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                        <p className="text-white font-medium truncate">{attachment.fileName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">学生作业附件</h3>
                <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <i className="fa-solid fa-file-circle-exclamation text-gray-400 text-4xl mb-2"></i>
                  <p className="text-gray-500 dark:text-gray-400">该学生未上传作业附件</p>
                </div>
              </div>
            )}
            
            {/* 教师评语 */}
            {submission.comment && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                  <i className="fa-solid fa-comment-dots mr-2 text-blue-600 dark:text-blue-400"></i>
                  教师评语
                </h3>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-lg border border-blue-100 dark:border-blue-800/50">
                  <MarkdownRenderer content={submission.comment} />
                </div>
              </div>
            )}
          </div>
        ) : null}
      </main>
      
      {/* 图片预览模态框 */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fadeIn"
          onClick={handleClosePreview}
        >
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* 关闭按钮 */}
            <button
              onClick={handleClosePreview}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all hover:scale-110"
              title="关闭 (ESC)"
            >
              <i className="fa-solid fa-times text-xl"></i>
            </button>
            
            {/* 缩放控制按钮 */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex items-center space-x-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleZoomOut();
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all hover:scale-110"
                title="缩小"
                disabled={imageScale <= 0.5}
              >
                <i className="fa-solid fa-minus"></i>
              </button>
              
              <span className="text-white font-medium px-2 min-w-[60px] text-center">
                {Math.round(imageScale * 100)}%
              </span>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleZoomIn();
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all hover:scale-110"
                title="放大"
                disabled={imageScale >= 3}
              >
                <i className="fa-solid fa-plus"></i>
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleResetZoom();
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all hover:scale-110 ml-2"
                title="重置"
              >
                <i className="fa-solid fa-arrow-rotate-left"></i>
              </button>
            </div>
            
            {/* 图片容器 */}
            <div 
              className="max-w-full max-h-full overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={previewImage}
                alt="预览"
                className="max-w-none transition-transform duration-200"
                style={{ 
                  transform: `scale(${imageScale})`,
                  transformOrigin: 'center center'
                }}
              />
            </div>
          </div>
        </div>
      )}
      
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>© 2025 智慧教辅系统 - 教师后台</p>
        </div>
      </footer>
    </div>
  );
}