import { useContext, useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { getAssignmentDetail } from '@/services/assignmentApi';
import { getSubmissionByAssignment, submitAssignment as submitAssignmentApi } from '@/services/submissionApi';
import { uploadMultipleFiles } from '@/services/uploadApi';

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
  
  // 获取作业ID
  const assignmentId = parseInt(String(params.id), 10);
  
  const [isLoading, setIsLoading] = useState(true);
  const [assignment, setAssignment] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [existingSubmission, setExistingSubmission] = useState<any>(null);
  
  // 加载作业数据和提交记录
  useEffect(() => {
    const loadData = async () => {
      if (!assignmentId || isNaN(assignmentId)) {
        toast.error('无效的作业ID');
        navigate('/student/assignments');
        return;
      }

      try {
        setIsLoading(true);
        
        // 获取作业详情
        const assignmentResponse = await getAssignmentDetail(assignmentId);
        const assignmentData = assignmentResponse.data;
        
        // 解析 attachments 字段（如果是 JSON 字符串）
        if (assignmentData.attachments && typeof assignmentData.attachments === 'string') {
          try {
            assignmentData.attachments = JSON.parse(assignmentData.attachments);
          } catch (e) {
            console.error('解析附件数据失败:', e);
            assignmentData.attachments = [];
          }
        }
        
        setAssignment(assignmentData);
        
        // 检查是否已有提交记录
        try {
          const submissionResponse = await getSubmissionByAssignment(assignmentId);
          if (submissionResponse.data) {
            setExistingSubmission(submissionResponse.data);
            // 如果已提交且已批改，跳转到详情页
            if (submissionResponse.data.status === 'graded') {
              toast.info('此作业已批改，跳转到详情页');
              navigate(`/student/assignments/${assignmentId}`);
              return;
            }
          }
        } catch (error: any) {
          // 如果没有提交记录，忽略错误
          console.log('暂无提交记录');
        }
        
      } catch (error: any) {
        console.error('加载作业数据失败:', error);
        toast.error(error.message || '加载作业失败');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [assignmentId, navigate]);
  
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
  
  // 处理保存草稿（暂不实现草稿功能，仅给出提示）
  const handleSaveDraft = () => {
    toast.info('草稿功能暂未实现，请直接提交作业');
  };
  
  // 处理提交作业
  const handleSubmitAssignment = async () => {
    if (uploadedFiles.length === 0) {
      toast.error('请至少上传一个文件');
      return;
    }
    
    if (!window.confirm('确定要提交作业吗？提交后将无法修改。')) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 1. 先上传所有文件
      toast.info('正在上传文件...');
      const files = uploadedFiles.map(f => f.file);
      const uploadResponse = await uploadMultipleFiles(files, 'assignment');
      
      // 2. 获取上传后的文件URL列表
      const fileUrls = uploadResponse.data.files.map((file: any) => file.url);
      
      // 3. 提交作业
      toast.info('正在提交作业...');
      await submitAssignmentApi({
        assignmentId,
        content: '学生提交的作业', // 可以添加一个文本输入框让学生填写说明
        attachments: fileUrls
      });
      
      toast.success('作业提交成功！');
      
      // 延迟导航，给用户时间看到成功提示
      setTimeout(() => {
        navigate('/student/assignments');
      }, 1500);
      
    } catch (error: any) {
      console.error('提交作业失败:', error);
      toast.error(error.message || '提交失败，请重试');
    } finally {
      setIsSubmitting(false);
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
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{assignment.title}</h3>
                <div className="flex items-center mt-2 space-x-4">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium">
                    {assignment.subject}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isAssignmentExpired(assignment.deadline)
                      ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
                      : 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400'
                  }`}>
                    截止日期：{assignment.deadline ? new Date(assignment.deadline).toLocaleDateString('zh-CN') : '-'} ({getDueDateStatus(assignment.deadline)})
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
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      {assignment.createdAt ? new Date(assignment.createdAt).toLocaleDateString('zh-CN') : '-'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* 作业描述 */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">作业描述</h3>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                  <p className="text-gray-600 dark:text-gray-300">{assignment.description || '暂无描述'}</p>
                </div>
              </div>
              
              {/* 参考附件 */}
              {assignment.attachments && assignment.attachments.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">参考附件</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {assignment.attachments.map((attachment: any, index: number) => {
                      // 确保 attachment 是字符串类型
                      const attachmentUrl = typeof attachment === 'string' ? attachment : (attachment?.url || '');
                      if (!attachmentUrl) return null;
                      
                      const fileName = attachmentUrl.split('/').pop() || '附件';
                      const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
                      let fileType = 'file';
                      let iconClass = 'fa-file';
                      let iconColor = 'text-gray-500';
                      
                      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) {
                        fileType = 'image';
                        iconClass = 'fa-file-image';
                        iconColor = 'text-blue-500';
                      } else if (fileExt === 'pdf') {
                        fileType = 'pdf';
                        iconClass = 'fa-file-pdf';
                        iconColor = 'text-red-500';
                      } else if (['mp4', 'avi', 'mov'].includes(fileExt)) {
                        fileType = 'video';
                        iconClass = 'fa-file-video';
                        iconColor = 'text-green-500';
                      }
                      
                      return (
                        <a 
                          key={index}
                          href={attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <i className={`fa-solid ${iconClass} ${iconColor} text-lg mr-3`}></i>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{fileName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{fileExt.toUpperCase()}</p>
                          </div>
                          <i className="fa-solid fa-external-link text-gray-400"></i>
                        </a>
                      );
                    })}
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
                    isAssignmentExpired(assignment.deadline) 
                      ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50' 
                      : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-orange-500 dark:hover:border-orange-500'
                  }`}
                  onClick={() => !isAssignmentExpired(assignment.deadline) && document.getElementById('file-upload')?.click()}
                >
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isAssignmentExpired(assignment.deadline)}
                  />
                  
                  {isAssignmentExpired(assignment.deadline) ? (
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
                            alt={file.file.name}
                            className="w-full h-full object-cover"
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
                  disabled={isAssignmentExpired(assignment.deadline) || uploadedFiles.length === 0 || isSavingDraft}
                  className={`px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-colors ${
                    isAssignmentExpired(assignment.deadline) ? 'cursor-not-allowed' : ''
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
                  disabled={isAssignmentExpired(assignment.deadline) || uploadedFiles.length === 0 || isSubmitting}
                  className={`px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-orange-600 dark:bg-orange-700 hover:bg-orange-700 dark:hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-colors ${
                    isAssignmentExpired(assignment.deadline) ? 'cursor-not-allowed' : ''
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
    </div>
  );
}