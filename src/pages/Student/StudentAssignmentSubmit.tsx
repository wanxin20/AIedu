import { useContext, useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';

// 定义作业接口
interface Assignment {
  id: number;
  name: string;
  subject: string;
  assignedDate: string;
  dueDate: string;
  description: string;
  status: 'pending' | 'submitted' | 'graded';
  score?: number;
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
  }[];
}

// 模拟作业数据
const getAssignmentById = (id: number): Assignment => {
  const assignments: Assignment[] = [
    {
      id: 1,
      name: "高中数学函数基础练习",
      subject: "数学",
      assignedDate: "2025-09-01",
      dueDate: "2025-09-10",
      description: "本作业涵盖函数的基本概念、性质及应用，旨在帮助学生巩固函数相关知识，提高解题能力。请完成所有习题，并提交详细的解题过程。",
      status: 'pending',
      attachments: [
        {
          id: "att1",
          name: "函数基础知识点.pdf",
          url: "https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=Math%20Function%20Study%20Material%20PDF&sign=bc8d80ff84a40d1073c6e6278aac6c81",
          type: "pdf"
        }
      ]
    },
    {
      id: 2,
      name: "物理力学实验报告",
      subject: "物理",
      assignedDate: "2025-09-02",
      dueDate: "2025-09-12",
      description: "本次实验要求学生完成牛顿力学定律的验证实验，并提交详细的实验报告，包括实验目的、原理、步骤、数据记录与分析等内容。请按照实验指导书的要求规范撰写。",
      status: 'pending',
      attachments: [
        {
          id: "att2",
          name: "实验指导书.pdf",
          url: "https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=Physics%20Experiment%20Guide%20PDF&sign=b68e905d7770cdd530fc66118494ab8c",
          type: "pdf"
        }
      ]
    },
    {
      id: 3,
      name: "英语阅读理解训练",
      subject: "英语",
      assignedDate: "2025-09-03",
      dueDate: "2025-09-15",
      description: "通过多篇不同题材的阅读理解文章，训练学生的阅读速度、理解能力和词汇量，提高英语综合能力。请仔细阅读文章，回答所有问题，并解释你的选择理由。",
      status: 'submitted',
      attachments: [
        {
          id: "att3",
          name: "阅读材料集合.pdf",
          url: "https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=English%20Reading%20Materials%20PDF&sign=93010a07eb0bc912bb9446e2a9cf8149",
          type: "pdf"
        }
      ]
    },
    {
      id: 4,
      name: "化学元素周期表练习",
      subject: "化学",
      assignedDate: "2025-09-05",
      dueDate: "2025-09-18",
      description: "本作业要求学生掌握元素周期表的结构、元素性质的周期性变化规律，并能够应用这些知识解决相关问题。",
      status: 'graded',
      score: 85,
      attachments: [
        {
          id: "att4",
          name: "元素周期表高清版.jpg",
          url: "https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=Periodic%20Table%20of%20Elements&sign=bc1caba46953572608abb21569bc7152",
          type: "image"
        }
      ]
    },
    {
      id: 5,
      name: "历史事件时间轴制作",
      subject: "历史",
      assignedDate: "2025-09-06",
      dueDate: "2025-09-20",
      description: "学生需要收集指定历史时期的重要事件资料，制作详细的时间轴，梳理历史发展脉络，培养历史思维能力。",
      status: 'pending'
    }
  ];
  
  return assignments.find(a => a.id === id) || assignments[0];
};

// 定义上传文件接口
interface UploadedFile {
  id: string;
  file: File;
  previewUrl: string;
}

export default function StudentAssignmentSubmit() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  
  // 获取作业ID，确保从params中获取的id能被正确解析为数字类型
  const assignmentId = parseInt(String(params.id), 10) || 1;
  
  const [isLoading, setIsLoading] = useState(true);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [showAttachmentPreview, setShowAttachmentPreview] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<any>(null);
  
  // 模拟数据加载
  useEffect(() => {
    const timer = setTimeout(() => {
      const assignmentData = getAssignmentById(assignmentId);
      setAssignment(assignmentData);
      
      // 检查是否有保存的草稿
      const savedDraft = localStorage.getItem(`assignment_draft_${assignmentId}_${user?.phone}`);
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          // 恢复草稿文件预览（注意：实际应用中需要处理文件恢复）
          if (draft.files && draft.files.length > 0) {
            // 由于无法直接从base64恢复File对象，这里仅做提示
            toast.info('已恢复上次保存的草稿');
          }
        } catch (error) {
          console.error('Failed to load draft:', error);
        }
      }
      
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, [assignmentId, user?.phone]);
  
  // 权限检查
  useEffect(() => {
    if (user && user.role !== 'student') {
      navigate('/');
    }
  }, [user, navigate]);
  
  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: UploadedFile[] = Array.from(e.target.files).map(file => {
        // 检查文件类型是否为图片
        if (!file.type.startsWith('image/')) {
          toast.error('只支持图片格式的文件上传');
          return null;
        }
        
        // 检查总上传数量是否超过9张
        if (uploadedFiles.length >= 9) {
          toast.error('最多只能上传9张图片');
          return null;
        }
        
        return {
          id: Date.now() + Math.random().toString(36).substr(2, 9),
          file,
          previewUrl: URL.createObjectURL(file)
        };
      }).filter((file): file is UploadedFile => file !== null);
      
      // 限制总数不超过9张
      const combinedFiles = [...uploadedFiles, ...newFiles];
      if (combinedFiles.length > 9) {
        const limitedFiles = combinedFiles.slice(0, 9);
        setUploadedFiles(limitedFiles);
        toast.warning(`最多只能上传9张图片，已自动处理多余文件`);
      } else {
        setUploadedFiles(combinedFiles);
      }
      
      // 清空input值，以便能重复选择同一文件
      e.target.value = '';
    }
  };
  
  // 处理删除已上传文件
  const handleRemoveFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
    toast.success('文件已移除');
  };
  
  // 处理查看附件
  const handleViewAttachment = (attachment: any) => {
    setSelectedAttachment(attachment);
    setShowAttachmentPreview(true);
  };
  
  // 关闭附件预览
  const handleCloseAttachmentPreview = () => {
    setShowAttachmentPreview(false);
    setSelectedAttachment(null);
  };
  
  // 处理保存草稿
  const handleSaveDraft = () => {
    if (uploadedFiles.length === 0) {
      toast.error('请至少上传一个文件');
      return;
    }
    
    setIsSavingDraft(true);
    
    setTimeout(() => {
      // 在实际应用中，这里应该保存到服务器或使用更复杂的本地存储方案
      // 由于浏览器安全限制，我们不能直接保存File对象到localStorage
      // 这里只保存基本信息作为示例
      const draftData = {
        assignmentId,
        savedAt: new Date().toISOString(),
        files: uploadedFiles.map(file => ({
          id: file.id,
          name: file.file.name,
          type: file.file.type,
          size: file.file.size
          // 注意：在实际应用中，你可能需要考虑如何处理文件内容
        }))
      };
      
      localStorage.setItem(`assignment_draft_${assignmentId}_${user?.phone}`, JSON.stringify(draftData));
      setIsSavingDraft(false);
      toast.success('作业草稿已保存');
    }, 800);
  };
  
   // 处理提交作业
  const handleSubmitAssignment = () => {
    if (uploadedFiles.length === 0) {
      toast.error('请至少上传一个文件');
      return;
    }
    
    if (window.confirm('确定要提交作业吗？提交后将无法修改。')) {
      setIsSubmitting(true);
      
      setTimeout(() => {
        // 在实际应用中，这里应该提交到服务器
        // 移除保存的草稿
        localStorage.removeItem(`assignment_draft_${assignmentId}_${user?.phone}`);
        
        setIsSubmitting(false);
        toast.success('作业提交成功！');
        
        // 延迟导航，给用户时间看到成功提示
        setTimeout(() => {
          navigate('/student/assignments');
        }, 1500);
      }, 1500);
    }
  };
  
  // 检查作业是否已过期
  const isAssignmentExpired = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dueDate) < today;
  };
  
  // 获取作业截止日期状态
  const getDueDateStatus = (dueDate: string) => {
    if (isAssignmentExpired(dueDate)) {
      return <span className="text-red-600 dark:text-red-400 font-medium">已过期</span>;
    }
    
    const today = new Date();
    const due = new Date(dueDate);
    const daysLeft = Math.ceil((due.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (daysLeft <= 3) {
      return <span className="text-amber-600 dark:text-amber-400 font-medium">剩余{daysLeft}天</span>;
    }
    
    return <span className="text-green-600 dark:text-green-400 font-medium">剩余{daysLeft}天</span>;
  };
  
  // 渲染附件预览
  const renderAttachmentPreview = () => {
    if (!selectedAttachment) return null;
    
    const { name, url, type } = selectedAttachment;
    
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{name}</h3>
            <button 
              onClick={handleCloseAttachmentPreview}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <i className="fa-solid fa-times text-xl"></i>
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <div className="flex justify-center items-center min-h-[60vh]">
              {type === 'pdf' ? (
                <div className="bg-gray-100 dark:bg-gray-700 p-8 rounded-lg max-w-full max-h-[60vh] flex flex-col items-center justify-center">
                  <i className="fa-solid fa-file-pdf text-red-500 text-6xl mb-4"></i>
                  <p className="text-center text-gray-700 dark:text-gray-300 mb-2">{name}</p>
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">PDF文件预览</p>
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center"
                  >
                    <i className="fa-solid fa-download mr-2"></i>
                    <span>下载文件</span>
                  </a>
                </div>
              ) : type === 'image' ? (
                <img
                  src={url}
                  alt={name}
                  className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
                />
              ) : (
                <div className="bg-gray-100 dark:bg-gray-700 p-8 rounded-lg max-w-full max-h-[60vh] flex flex-col items-center justify-center">
                  <i className="fa-solid fa-file-video text-blue-500 text-6xl mb-4"></i>
                  <p className="text-center text-gray-700 dark:text-gray-300 mb-2">{name}</p>
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">视频文件预览</p>
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
                  >
                    <i className="fa-solid fa-download mr-2"></i>
                    <span>下载文件</span>
                  </a>
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
                className="text-orange-600 dark:text-orange-400 font-medium flex items-center"
              >
                <i className="fa-solid fa-clipboard-list mr-1"></i>
                <span>作业中心</span>
              </Link>
              <Link 
                to="/student/resources" 
                className="text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 flex items-center"
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
              </div>
            </div>
          </div>
        </div>
      </header>
      {/* 主内容区 */}
      <main className="container mx-auto px-4 py-6">
        {/* 页面标题 */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">提交作业</h2>
          <p className="text-gray-600 dark:text-gray-400">上传作业文件并提交</p>
        </div>
        
        {/* 加载状态 */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <div className="w-12 h-12 border-t-2 border-b-2 border-orange-500 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">加载作业数据中...</p>
          </div>
        ) : assignment ? (
          <div className="space-y-6">
            {/* 作业信息卡片 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{assignment.name}</h3>
                <div className="flex items-center mt-2 space-x-4">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium">
                    {assignment.subject}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isAssignmentExpired(assignment.dueDate)
                      ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
                      : 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400'
                  }`}>
                    截止日期：{assignment.dueDate} ({getDueDateStatus(assignment.dueDate)})
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mr-4">
                    <i className="fa-solid fa-calendar-plus text-blue-600 dark:text-blue-400 text-xl"></i>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">布置日期</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">{assignment.assignedDate}</p>
                  </div>
                </div>
              </div>
              
              {/* 作业描述 */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">作业描述</h3>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                  <p className="text-gray-600 dark:text-gray-300">{assignment.description}</p>
                </div>
              </div>
              
              {/* 参考附件 */}
              {assignment.attachments && assignment.attachments.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">参考附件</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {assignment.attachments.map(attachment => (
                      <div 
                        key={attachment.id}
                        className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleViewAttachment(attachment)}
                      >
                        {attachment.type === 'pdf' && <i className="fa-solid fa-file-pdf text-red-500 text-lg mr-3"></i>}
                        {attachment.type === 'image' && <i className="fa-solid fa-file-image text-blue-500 text-lg mr-3"></i>}
                        {attachment.type === 'video' && <i className="fa-solid fa-file-video text-green-500 text-lg mr-3"></i>}
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
            
            {/* 上传作业区域 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">上传作业</h3>
              
              <div className="mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">请上传你的作业文件（最多9张图片）</p>
                
                {/* 拖放上传区域 */}
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isAssignmentExpired(assignment.dueDate) 
                      ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50' 
                      : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-orange-500 dark:hover:border-orange-500'
                  }`}
                  onClick={() => !isAssignmentExpired(assignment.dueDate) && document.getElementById('file-upload')?.click()}
                >
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isAssignmentExpired(assignment.dueDate)}
                  />
                  
                  {isAssignmentExpired(assignment.dueDate) ? (
                    <div className="flex flex-col items-center justify-center">
                      <i className="fa-solid fa-exclamation-circle text-red-500 text-3xl mb-3"></i>
                      <p className="text-sm text-gray-600 dark:text-gray-400">作业已过期，无法上传文件</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <i className="fa-solid fa-cloud-arrow-up text-gray-400 text-3xl mb-3"></i>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">点击或拖放文件到这里上传</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">支持JPG、PNG、GIF等图片格式，最多9张图片</p>
                      <p className="text-xs text-orange-500 mt-2">已上传 {uploadedFiles.length}/9 张图片</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 已上传文件预览 */}
              {uploadedFiles.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">已上传文件</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-3">
                    {uploadedFiles.map(file => (
                      <div key={file.id} className="relative group">
                        <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                          <img
                            src={file.previewUrl}
                            alt={file.file.name}className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          onClick={() => handleRemoveFile(file.id)}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <i className="fa-solid fa-times text-xs"></i>
                        </button>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">{file.file.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 操作按钮 */}
              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleSaveDraft}
                  disabled={isAssignmentExpired(assignment.dueDate) || uploadedFiles.length === 0 || isSavingDraft}
                  className={`px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-colors ${
                    isAssignmentExpired(assignment.dueDate) ? 'cursor-not-allowed' : ''
                  }`}
                >
                  {isSavingDraft ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                      <span>保存中...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-floppy-disk mr-2"></i>
                      <span>保存草稿</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleSubmitAssignment}
                  disabled={isAssignmentExpired(assignment.dueDate) || uploadedFiles.length === 0 || isSubmitting}
                  className={`px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-orange-600 dark:bg-orange-700 hover:bg-orange-700 dark:hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-colors ${
                    isAssignmentExpired(assignment.dueDate) ? 'cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                      <span>提交中...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-paper-plane mr-2"></i>
                      <span>提交作业</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <i className="fa-solid fa-exclamation-circle text-gray-400 text-2xl"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">未找到作业详情</h3>
            <p className="text-gray-500 dark:text-gray-400">请检查作业ID是否正确</p>
            <button 
              onClick={() => window.close()}
              className="mt-4 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
            >
              关闭窗口
            </button>
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