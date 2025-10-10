import { useContext, useState, useEffect } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { AuthContext } from "@/contexts/authContext";
import { toast } from "sonner";

// 定义学生作业状态接口
interface StudentAssignment {
  id: number;
  studentId: number;
  studentName: string;
  assignmentId: number;
  assignmentName: string;
  status: 'pending' | 'submitted' | 'graded';
  score: number | null;
  submitTime: string | null;
  gradeTime: string | null;
  comment: string | null;
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
  }[];
}

// 模拟获取学生作业数据
const getStudentAssignment = (assignmentId: number, studentId: number): StudentAssignment | null => {
  // 模拟数据
  const assignments: StudentAssignment[] = [
    {
      id: 1,
      studentId: 1,
      studentName: "张三",
      assignmentId: 1,
      assignmentName: "高中数学函数基础练习",
      status: 'graded',
      score: 92,
      submitTime: "2025-09-08 10:30:00",
      gradeTime: "2025-09-08 14:15:00",
      comment: "整体表现良好，知识点掌握扎实，但在一些细节问题上还需要加强。",
      attachments: [
        { 
          id: "att-1-1", 
          name: "作业提交-张三.jpg", 
          url: "https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=Student%20Homework%20Submission%20for%20Zhang%20San&sign=7c852b19a05308244a0426a82abffc3d", 
          type: "image" 
        }
      ]
    },
    {
      id: 2,
      studentId: 2,
      studentName: "李四",
      assignmentId: 1,
      assignmentName: "高中数学函数基础练习",
      status: 'graded',
      score: 88,
      submitTime: "2025-09-08 09:45:00",
      gradeTime: "2025-09-08 14:20:00",
      comment: "解题思路清晰，但部分计算有误，需要更加细心。",
      attachments: [
        { 
          id: "att-2-1", 
          name: "作业提交-李四.jpg", 
          url: "https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=Student%20Homework%20Submission%20for%20Li%20Si&sign=cc8abdd1f17dffe43da68fa2f635137d", 
          type: "image" 
        }
      ]
    }
  ];
  
  return assignments.find(a => a.assignmentId === assignmentId && a.studentId === studentId) || null;
};

// 模拟获取作业信息
const getAssignmentInfo = (assignmentId: number) => {
  const assignments = [
    { 
      id: 1, 
      name: "高中数学函数基础练习", 
      subject: "数学", 
      assignedDate: "2025-09-01", 
      dueDate: "2025-09-10", 
      description: "本作业涵盖函数的基本概念、性质及应用，旨在帮助学生巩固函数相关知识，提高解题能力。",
      attachments: [
        { id: "att1", name: "函数基础知识点.pdf", url: "https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=Math%20Function%20Study%20Material%20PDF&sign=bc8d80ff84a40d1073c6e6278aac6c81", type: "pdf" }
      ]
    },
    { 
      id: 2, 
      name: "物理力学实验报告", 
      subject: "物理", 
      assignedDate: "2025-09-02", 
      dueDate: "2025-09-12", 
      description: "本次实验要求学生完成牛顿力学定律的验证实验，并提交详细的实验报告，包括实验目的、原理、步骤、数据记录与分析等内容。",
      attachments: [
        { id: "att2", name: "实验指导书.pdf", url: "https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=Physics%20Experiment%20Guide%20PDF&sign=b68e905d7770cdd530fc66118494ab8c", type: "pdf" }
      ]
    },
    { 
      id: 3, 
      name: "英语阅读理解训练", 
      subject: "英语", 
      assignedDate: "2025-09-03", 
      dueDate: "2025-09-15", 
      description: "通过多篇不同题材的阅读理解文章，训练学生的阅读速度、理解能力和词汇量，提高英语综合能力。",
      attachments: [
        { id: "att3", name: "阅读材料集合.pdf", url: "https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=English%20Reading%20Materials%20PDF&sign=93010a07eb0bc912bb9446e2a9cf8149", type: "pdf" }
      ]
    }
  ];
  
  return assignments.find(a => a.id === assignmentId) || assignments[0];
};

export default function AssignmentDetail() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  
  // 从URL获取参数
  const assignmentId = parseInt(params.id || '1', 10);
  const searchParams = new URLSearchParams(location.search);
  const studentId = parseInt(searchParams.get('studentId') || '1', 10);
  
  const [isLoading, setIsLoading] = useState(true);
  const [assignmentInfo, setAssignmentInfo] = useState<any>(null);
  const [studentAssignment, setStudentAssignment] = useState<StudentAssignment | null>(null);
  
  // 模拟数据加载
  useEffect(() => {
    const timer = setTimeout(() => {
      const info = getAssignmentInfo(assignmentId);
      setAssignmentInfo(info);
      
      const studentAssign = getStudentAssignment(assignmentId, studentId);
      setStudentAssignment(studentAssign);
      
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, [assignmentId, studentId]);
  
  // 权限检查
  useEffect(() => {
    if (user && user.role !== "teacher") {
      navigate("/");
    }
  }, [user, navigate]);
  
  // 处理返回列表
  const handleBackToList = () => {
    navigate(`/teacher/assignments/progress/${assignmentId}`);
  };
  
  // 如果找不到学生作业
  if (!isLoading && !studentAssignment) {
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
                无法找到指定学生的作业信息，请检查参数是否正确。
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
        ) : studentAssignment ? (
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
                    <p className="text-base font-medium text-gray-900 dark:text-white">{studentAssignment.studentName}</p>
                  </div>
                </div>
                <div className="flex items-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mr-4 flex-shrink-0">
                    <i className="fa-solid fa-book text-green-600 dark:text-green-400 text-xl"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">作业名称</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white truncate">{studentAssignment.assignmentName}</p>
                  </div>
                </div>
                <div className="flex items-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mr-4 flex-shrink-0">
                    <i className="fa-solid fa-graduation-cap text-amber-600 dark:text-amber-400 text-xl"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">得分</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      {studentAssignment.score !== null ? `${studentAssignment.score}分` : '未评分'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* 作业状态和时间信息 */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">提交时间</p>
                  <p className="text-sm text-gray-900 dark:text-white">{studentAssignment.submitTime}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">批改时间</p>
                  <p className="text-sm text-gray-900 dark:text-white">{studentAssignment.gradeTime}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">作业状态</p>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    studentAssignment.status === 'graded' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400' 
                      : studentAssignment.status === 'submitted'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {studentAssignment.status === 'graded' ? '已批改' : studentAssignment.status === 'submitted' ? '已提交' : '未提交'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">学科</p>
                  <p className="text-sm text-gray-900 dark:text-white">{assignmentInfo.subject}</p>
                </div>
              </div>
            </div>
            
            {/* 作业描述 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">作业描述</h3>
              <p className="text-gray-600 dark:text-gray-300">{assignmentInfo.description}</p>
              
              {/* 作业参考附件 */}
              {(assignmentInfo.attachments && assignmentInfo.attachments.length > 0) && (
                <div className="mt-6">
                  <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-3">参考附件</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {assignmentInfo.attachments.map((attachment, index) => (
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
            {(studentAssignment.attachments && studentAssignment.attachments.length > 0) ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">学生作业附件 ({studentAssignment.attachments.length})</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {studentAssignment.attachments.map((attachment) => (
                    <div 
                      key={attachment.id}
                      className="relative group cursor-pointer overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700"
                    >
                      {attachment.type === "image" ? (
                        <img
                          src={attachment.url}
                          alt={attachment.name}
                          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105" 
                        />
                      ) : (
                        <div className="w-full h-48 flex items-center justify-center bg-gray-200 dark:bg-gray-600">
                          <i className="fa-solid fa-file text-5xl text-gray-400"></i>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                        <p className="text-white font-medium truncate">{attachment.name}</p>
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
            {studentAssignment.comment && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">教师评语</h3>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-lg border border-blue-100 dark:border-blue-800/50">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{studentAssignment.comment}</p>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </main>
      
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>© 2025 智慧教辅系统 - 教师后台</p>
        </div>
      </footer>
    </div>
  );
}