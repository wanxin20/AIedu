import { useContext, useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "@/contexts/authContext";
import { toast } from "sonner";
import { gradeAssignmentWithStream } from "@/services/gradingApi";
import { startAIGrading, getAIGradingStatus, acceptAIGrading, retryAIGrading, cancelAIGrading } from "@/services/aiGradingApi";
import { getAssignmentDetail, getAssignmentSubmissions } from "@/services/assignmentApi";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// 定义作业信息接口
interface AssignmentInfo {
  id: number;
  title: string;
  description: string | null;
  subject: string;
  deadline: string;
  totalScore: number;
  attachments: any[];
  status: string;
  createdAt: string;
}

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
  attachments?: any[];
  // AI 批改字段
  aiGradingStatus?: 'none' | 'pending' | 'processing' | 'completed' | 'failed';
  aiComment?: string | null;
  aiGradedAt?: string | null;
  aiErrorMessage?: string | null;
}

export default function AssignmentProgressDetail() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const params = useParams();
  const assignmentId = parseInt(params.id || '1', 10);
  
  const [isLoading, setIsLoading] = useState(true);
  const [assignmentInfo, setAssignmentInfo] = useState<AssignmentInfo | null>(null);
  const [studentAssignments, setStudentAssignments] = useState<StudentAssignment[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'graded'>('pending');
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState<StudentAssignment | null>(null);
  const [comment, setComment] = useState('');
  const [score, setScore] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalStudents, setTotalStudents] = useState(0);
  const [practiceProblems, setPracticeProblems] = useState<any[]>([]);
  const [isGeneratingPractice, setIsGeneratingPractice] = useState(false);
  const [submittedCount, setSubmittedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [showAutoGradeButton, setShowAutoGradeButton] = useState(true);
  // 班级专项练习相关状态
  const [showClassPracticeModal, setShowClassPracticeModal] = useState(false);
  const [classPracticeProblems, setClassPracticeProblems] = useState<any[]>([]);
  const [isGeneratingClassPractice, setIsGeneratingClassPractice] = useState(false);
  // 流式输出相关状态
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const streamingEndRef = useRef<HTMLDivElement>(null);
  
  // 图片预览相关状态
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageScale, setImageScale] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // 自动滚动到流式输出底部
  useEffect(() => {
    if (isStreaming && streamingEndRef.current) {
      streamingEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [streamingText, isStreaming]);

  // 加载作业详情和提交列表
  useEffect(() => {
    const loadData = async () => {
      if (!assignmentId) {
        setError('缺少作业ID');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // 并行加载作业详情和提交列表
        const [assignmentRes, submissionsRes] = await Promise.all([
          getAssignmentDetail(assignmentId),
          getAssignmentSubmissions(assignmentId)
        ]);

        if (assignmentRes.code === 200) {
          setAssignmentInfo(assignmentRes.data);
        } else {
          throw new Error(assignmentRes.message || '获取作业信息失败');
        }

        if (submissionsRes.code === 200) {
          const submissions = submissionsRes.data || [];
          // 转换提交数据为组件需要的格式
          const formattedSubmissions: StudentAssignment[] = submissions.map((item: any) => {
            // 处理 attachments 字段 - 确保它是一个对象数组
            let attachments = [];
            if (item.attachments) {
              if (Array.isArray(item.attachments)) {
                // 如果是数组，检查元素是字符串还是对象
                attachments = item.attachments.map((att: any, index: number) => {
                  if (typeof att === 'string') {
                    // 如果是字符串（URL），转换为对象格式
                    return {
                      id: `attachment-${item.id}-${index}`,
                      url: att,
                      type: 'image', // 默认假设是图片
                      name: att.split('/').pop() || `附件${index + 1}`
                    };
                  }
                  // 如果已经是对象，确保有 id 字段
                  return {
                    id: att.id || `attachment-${item.id}-${index}`,
                    ...att
                  };
                });
              }
            }

            return {
              id: item.id,
              studentId: item.studentId,
              studentName: item.studentName || '未知学生',
              assignmentId: item.assignmentId,
              assignmentName: assignmentRes.data.title,
              status: item.status,
              score: item.score,
              submitTime: item.submittedAt,
              gradeTime: item.gradedAt,
              comment: item.comment,
              attachments: attachments,
              // AI 批改字段
              aiGradingStatus: item.aiGradingStatus || 'none',
              aiComment: item.aiComment,
              aiGradedAt: item.aiGradedAt,
              aiErrorMessage: item.aiErrorMessage
            };
          });

          setStudentAssignments(formattedSubmissions);

          // 计算统计数据
          setTotalStudents(formattedSubmissions.length);
          setSubmittedCount(formattedSubmissions.filter(a => a.status !== 'pending').length);
          setPendingCount(formattedSubmissions.filter(a => a.status === 'pending').length);
        } else {
          throw new Error(submissionsRes.message || '获取提交列表失败');
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
  }, [assignmentId]);

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
  
  // 图片缩放
  const handleZoomIn = () => {
    setImageScale(prev => Math.min(prev + 0.25, 3));
  };
  
  const handleZoomOut = () => {
    setImageScale(prev => Math.max(prev - 0.25, 0.5));
  };
  
  // 处理批改作业
  const handleGradeAssignment = (studentAssignment: StudentAssignment) => {
    setCurrentAssignment(studentAssignment);
    
    // 如果有AI批改结果，优先使用AI批改的评语
    if (studentAssignment.aiGradingStatus === 'completed' && studentAssignment.aiComment) {
      setComment(studentAssignment.aiComment);
    } else {
      setComment(studentAssignment.comment || '');
    }
    
    setScore(studentAssignment.score ? studentAssignment.score.toString() : '');
    setShowGradeModal(true);
  };

  // 处理关闭批改模态框
  const handleCloseGradeModal = () => {
    setShowGradeModal(false);
    setCurrentAssignment(null);
    handleResetGrading(); // 重置批改相关状态
  };

    // 处理自动生成批改（异步后台批改）
  const handleAutoGenerateGrade = async () => {
    if (!currentAssignment) {
      toast.error('请选择作业');
      return;
    }
    
    // 检查是否有作业附件
    if (!currentAssignment.attachments || currentAssignment.attachments.length === 0) {
      toast.error('该学生未上传作业附件');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      toast.info('🤖 正在启动 AI 批改任务...', {
        duration: 2000,
      });
      
      // 调用后端异步批改 API
      await startAIGrading(currentAssignment.id);
      
      toast.success('✅ AI 批改任务已启动，可以关闭窗口继续其他操作', {
        duration: 4000,
        position: 'top-right'
      });
      
      // 关闭批改模态框
      setIsSubmitting(false);
      setShowGradeModal(false);
      setCurrentAssignment(null);
      handleResetGrading();
      
      // 刷新列表以显示批改状态
      window.location.reload();
      
    } catch (error) {
      console.error('启动批改失败:', error);
      setIsSubmitting(false);
      
      toast.error('❌ 启动批改失败，请稍后重试', {
        description: error instanceof Error ? error.message : '未知错误',
        duration: 4000,
      });
    }
  }

  // 处理生成专项练习
  const handleGeneratePractice = () => {
    if (!currentAssignment || !score) {
      toast.error('请先完成作业批改');
      return;
    }
    
    setIsGeneratingPractice(true);
    
    // 模拟生成延迟
    setTimeout(() => {
      // 根据作业主题和得分生成不同难度的专项练习
      let difficulty = '基础';
      const scoreNum = parseInt(score, 10);
      if (scoreNum < 85) {
        difficulty = '基础';
      } else if (scoreNum < 95) {
        difficulty = '进阶';
      } else {
        difficulty = '挑战';
      }
      
      // 根据学科生成相关题目
      const subject = assignmentInfo?.subject || '数学';
      let problems = [];
      
      // 模拟生成不同学科的专项练习题目
      if (subject === '数学') {
        problems = [
          {
            id: 1,
            question: `已知函数 f(x) = ${difficulty === '基础' ? '2x + 3' : difficulty === '进阶' ? 'x² - 4x + 5' : 'x³ - 2x² + 3x - 1'}，求 f(2) 的值。`,
            type: '计算题'
          },
          {
            id: 2,
            question: `解不等式 ${difficulty === '基础' ? '3x + 5 > 11' : difficulty === '进阶' ? '(x - 2)(x + 3) ≤ 0' : '|x - 4| > 2x + 1'}。`,
            type: '解答题'
          },
          {
            id: 3,
            question: `简述${difficulty === '基础' ? '一次函数' : difficulty === '进阶' ? '二次函数' : '三次函数'}的基本性质及其图像特征。`,
            type: '简答题'
          }
        ];
      } else if (subject === '物理') {
        problems = [
          {
            id: 1,
            question: `一个物体从高度为${difficulty === '基础' ? '10米' : difficulty === '进阶' ? '20米' : '50米'}的地方自由下落，忽略空气阻力，求它落地时的速度。(g取9.8m/s²)`,
            type: '计算题'
          },
          {
            id: 2,
            question: `解释${difficulty === '基础' ? '牛顿第一定律' : difficulty === '进阶' ? '牛顿第二定律' : '动量守恒定律'}的内容及其应用场景。`,
            type: '简答题'
          }
        ];
      } else if (subject === '英语') {
        problems = [
          {
            id: 1,
            question: `选择正确的单词填空：The teacher asked us to ______ (complete/completing/completed) the assignment by tomorrow.`,
            type: '选择题'
          },
          {
            id: 2,
            question: `根据给出的中文提示，翻译句子：${difficulty === '基础' ? '他每天早上六点起床。' : difficulty === '进阶' ? '尽管天气不好，我们还是决定去爬山。' : '随着科技的发展，人们的生活方式发生了巨大的变化。'}`,
            type: '翻译题'
          }
        ];
      } else {
        // 其他学科的通用题目
        problems = [
          {
            id: 1,
            question: `${subject}学科基础知识点回顾与练习`,
            type: '综合题'
          },
          {
            id: 2,
            question: `${subject}学科重点概念理解与应用`,
            type: '应用题'
          }
        ];
      }
      
      setPracticeProblems(problems);
      // 不再显示右侧边栏，练习题直接显示在批改页面内
      setIsGeneratingPractice(false);
      toast.success(`已生成${difficulty}难度的专项练习题`, {
        duration: 3000,
        position: 'top-right'
      });
    }, 1500);
  }

  // 重置批改状态
  const handleResetGrading = () => {
    setShowAutoGradeButton(true);
    setComment('');
    setScore('');
    setPracticeProblems([]);
    setStreamingText('');
    setIsStreaming(false);
  };

  // 处理生成班级专项练习
  const handleGenerateClassPractice = () => {
    setIsGeneratingClassPractice(true);
    
    // 模拟生成延迟
    setTimeout(() => {
      // 根据作业主题和班级整体表现生成专项练习
      const subject = assignmentInfo?.subject || '数学';
      let problems = generateClassPracticeProblems(subject);
      
      setClassPracticeProblems(problems);
      setIsGeneratingClassPractice(false);
      setShowClassPracticeModal(true);
    }, 1500);
  };

  // 处理提交批改（采纳AI批改或手动批改）
  const handleSubmitGrade = async () => {
    if (!currentAssignment || !score) {
      toast.error('请填写得分');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 如果是采纳AI批改结果
      if (currentAssignment.aiGradingStatus === 'completed') {
        await acceptAIGrading(currentAssignment.id, parseInt(score, 10));
        toast.success('✅ 批改已提交');
      } else {
        // 手动批改（这里暂时用模拟，实际应该调用后端API）
        // TODO: 实现手动批改的API
        toast.success('批改已提交');
      }
      
      setIsSubmitting(false);
      setShowGradeModal(false);
      handleResetGrading();
      
      // 刷新列表
      window.location.reload();
      
    } catch (error) {
      console.error('提交批改失败:', error);
      setIsSubmitting(false);
      toast.error('提交失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 处理取消AI批改
  const handleCancelAIGrading = async () => {
    if (!currentAssignment) {
      toast.error('请选择作业');
      return;
    }

    if (!confirm('确定要取消 AI 批改吗？')) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      await cancelAIGrading(currentAssignment.id);
      
      toast.success('✅ AI 批改已取消');
      
      // 关闭批改模态框并刷新列表
      setIsSubmitting(false);
      setShowGradeModal(false);
      setCurrentAssignment(null);
      handleResetGrading();
      
      window.location.reload();
      
    } catch (error) {
      console.error('取消批改失败:', error);
      setIsSubmitting(false);
      
      toast.error('❌ 取消批改失败', {
        description: error instanceof Error ? error.message : '未知错误',
      });
    }
  };

  // 处理重新AI批改
  const handleRetryAIGrading = async () => {
    if (!currentAssignment) {
      toast.error('请选择作业');
      return;
    }

    if (!confirm('确定要重新进行AI批改吗？之前的批改结果将被覆盖。')) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      toast.info('🔄 正在重新启动 AI 批改...', {
        duration: 2000,
      });
      
      await retryAIGrading(currentAssignment.id);
      
      toast.success('✅ AI 批改任务已重新启动', {
        duration: 3000,
      });
      
      setIsSubmitting(false);
      setShowGradeModal(false);
      setCurrentAssignment(null);
      handleResetGrading();
      
      // 刷新列表
      window.location.reload();
      
    } catch (error) {
      console.error('重新批改失败:', error);
      setIsSubmitting(false);
      toast.error('重新批改失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 处理提交班级专项练习
  const handleSubmitClassPractice = () => {
    // 模拟提交延迟
    setTimeout(() => {
      setShowClassPracticeModal(false);
      // 模拟为班级所有学生创建新作业
      toast.success(`已为班级所有 ${totalStudents} 名学生创建专项练习作业`);
    }, 800);
  };

  // 关闭班级专项练习模态框
  const handleCloseClassPracticeModal = () => {
    setShowClassPracticeModal(false);
    setClassPracticeProblems([]);
  };

  // 生成班级专项练习题目
  const generateClassPracticeProblems = (subject: string) => {
    // 根据学科生成相关题目
    let problems = [];
    
    if (subject === '数学') {
      problems = [
        {
          id: 1,
          question: "班级常见错题回顾：请详细解析一元二次方程的求解方法及应用场景。",
          type: '解答题'
        },
        {
          id: 2,
          question: "针对班级薄弱环节：系统复习函数的基本性质及其图像特征。",
          type: '综合题'
        },
        {
          id: 3,
          question: "拓展提升练习：结合实例分析三角函数在几何问题中的应用。",
          type: '应用题'
        }
      ];
    } else if (subject === '物理') {
      problems = [
        {
          id: 1,
          question: "班级共性问题：详细分析牛顿运动定律的应用场景及解题思路。",
          type: '解答题'
        },
        {
          id: 2,
          question: "实验题强化训练：设计一个验证机械能守恒定律的实验方案。",
          type: '实验题'
        }
      ];
    } else if (subject === '英语') {
      problems = [
        {
          id: 1,
          question: "班级易错语法点：系统复习时态的正确使用及常见错误分析。",
          type: '语法题'
        },
        {
          id: 2,
          question: "阅读理解提升：分析不同体裁文章的阅读技巧及答题策略。",
          type: '阅读题'
        }
      ];
    } else {
      // 其他学科的通用题目
      problems = [
        {
          id: 1,
          question: `${subject}学科班级常见问题汇总与解析`,
          type: '综合题'
        },
        {
          id: 2,
          question: `${subject}学科重点知识点强化练习`,
          type: '练习题'
        }
      ];
    }
    
    return problems;
  };

  // 处理查看已批改作业详情
  const handleViewGradedDetails = (submissionId: number) => {
    // 跳转到已批改作业详情页面
    navigate(`/teacher/assignments/detail/${assignmentId}?submissionId=${submissionId}`);
  };

  // Markdown 渲染组件
  const MarkdownRenderer = ({ content }: { content: string }) => {
    return (
      <div className="markdown-content prose prose-green max-w-none dark:prose-invert
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

  // 过滤显示的学生作业
  const filteredAssignments = activeTab === 'pending' 
    ? studentAssignments.filter(a => a.status === 'submitted') 
    : studentAssignments.filter(a => a.status === 'graded');

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
      
      {/* 主内容区 */}
      <main className="container mx-auto px-4 py-6">
        {/* 页面标题 */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">作业进度详情</h2>
          <p className="text-gray-600 dark:text-gray-400">查看和管理学生作业提交情况</p>
        </div>
        
        {/* 加载状态 */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <div className="w-12 h-12 border-t-2 border-b-2 border-green-500 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">加载数据中...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 作业信息卡片 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
               <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{assignmentInfo?.title || '作业详情'}</h3>
                <p className="text-gray-600 dark:text-gray-300 mt-2">{assignmentInfo?.description || '无描述'}</p>
                {/* 参考附件部分 */}
                {(assignmentInfo?.attachments && assignmentInfo.attachments.length > 0) && (
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">参考附件</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {assignmentInfo.attachments.map((attachment: any, index: number) => (
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
      
      {/* 班级专项练习模态框 */}
      {showClassPracticeModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                班级专项练习题 - {assignmentInfo?.subject || ''}
              </h3>
              <button 
                onClick={handleCloseClassPracticeModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              {/* 专项练习说明 */}
              <div className="mb-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-5 rounded-xl border border-purple-100 dark:border-purple-800/50">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">专项练习说明</h4>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  根据班级整体作业完成情况，系统生成了针对性的专项练习题，帮助学生巩固薄弱知识点。
                  提交后，将为班级所有学生创建一项新的专项练习作业。
                </p>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center mr-4">
                    <i className="fa-solid fa-users text-purple-500 mr-1"></i>
                    <span>学生人数: {totalStudents}人</span>
                  </div>
                  <div className="flex items-center">
                    <i className="fa-solid fa-calendar text-purple-500 mr-1"></i>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              {/* 题目列表 */}
              <div className="space-y-5">
                {classPracticeProblems.map((problem, index) => (
                  <div key={problem.id} className="bg-gray-50 dark:bg-gray-700/50 p-5 rounded-xl border border-gray-200 dark:border-gray-600">
                    <div className="flex items-start mb-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/70 text-purple-600 dark:text-purple-400 text-sm font-medium mr-3 mt-0.5 flex-shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{problem.type}</span>
                    </div>
                    <p className="text-gray-800 dark:text-white ml-11 text-base">
                      {problem.question}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            
             <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-4">
              <button
                onClick={handleCloseClassPracticeModal}
                className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmitClassPractice}
                className="px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 dark:bg-purple-700 hover:bg-purple-700 dark:hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
              >
                <i className="fa-solid fa-check mr-2"></i>
                提交并创建作业
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mr-4">
                    <i className="fa-solid fa-book text-blue-600 dark:text-blue-400 text-xl"></i>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">所属学科</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">{assignmentInfo?.subject || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mr-4">
                    <i className="fa-solid fa-calendar-plus text-green-600 dark:text-green-400 text-xl"></i>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">布置日期</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      {assignmentInfo?.createdAt ? new Date(assignmentInfo.createdAt).toLocaleDateString('zh-CN') : '-'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mr-4">
                    <i className="fa-solid fa-calendar-check text-amber-600 dark:text-amber-400 text-xl"></i>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">截止日期</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      {assignmentInfo?.deadline ? new Date(assignmentInfo.deadline).toLocaleString('zh-CN') : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 统计卡片 - 已提交和未提交作业数 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col items-center justify-center text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">已提交</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">{submittedCount}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{Math.round((submittedCount / totalStudents) * 100)}% 的学生已提交</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col items-center justify-center text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">未提交</p>
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-1">{pendingCount}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{Math.round((pendingCount / totalStudents) * 100)}% 的学生未提交</p>
              </div>
            </div>
            
            {/* 学生作业列表 - 分待批改和已批改两个tab */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              {/* Tab 导航 */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between px-4">
                  <nav className="-mb-px flex" aria-label="Tabs">
                    <button
                      type="button"
                      className={`py-4 px-6 text-sm font-medium border-b-2 ${
                        activeTab === 'pending'
                          ? 'border-green-600 dark:border-green-400 text-green-600 dark:text-green-400'
                          : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      onClick={() => setActiveTab('pending')}
                    >
                      待批改 ({studentAssignments.filter(a => a.status === 'submitted').length})
                    </button>
                    <button
                      type="button"
                      className={`py-4 px-6 text-sm font-medium border-b-2 ${
                        activeTab === 'graded'
                          ? 'border-green-600 dark:border-green-400 text-green-600 dark:text-green-400'
                          : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      onClick={() => setActiveTab('graded')}
                    >
                      已批改 ({studentAssignments.filter(a => a.status === 'graded').length})
                    </button>
                  </nav>
                  {/* 已批改tab右上角的生成专项练习按钮 */}
                  {activeTab === 'graded' && (
                    <button
                      onClick={handleGenerateClassPractice}
                      disabled={isGeneratingClassPractice}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm flex items-center"
                    >
                      {isGeneratingClassPractice ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                          生成中...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-lightbulb mr-2"></i>
                          生成专项练习
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
              
              {/* 学生作业表格 */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">序号</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">学生姓名</th>
                      {activeTab === 'pending' && (
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">AI批改状态</th>
                      )}
                      {activeTab === 'graded' && (
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">得分</th>
                      )}
                      {activeTab === 'graded' && (
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">批改时间</th>
                      )}
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredAssignments.length > 0 ? (
                      filteredAssignments.map((assignment, index) => (
                        <tr key={assignment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-gray-100">{index + 1}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{assignment.studentName}</div>
                          </td>
                          {activeTab === 'pending' && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              {assignment.aiGradingStatus === 'pending' || assignment.aiGradingStatus === 'processing' ? (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400 flex items-center w-fit">
                                  <i className="fa-solid fa-spinner fa-spin mr-1"></i>
                                  {assignment.aiGradingStatus === 'pending' ? '等待批改' : '批改中'}
                                </span>
                              ) : assignment.aiGradingStatus === 'completed' ? (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400 flex items-center w-fit">
                                  <i className="fa-solid fa-check-circle mr-1"></i>
                                  批改完成
                                </span>
                              ) : assignment.aiGradingStatus === 'failed' ? (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400 flex items-center w-fit">
                                  <i className="fa-solid fa-exclamation-circle mr-1"></i>
                                  批改失败
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                  未批改
                                </span>
                              )}
                            </td>
                          )}
                          {activeTab === 'graded' && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">{assignment.score}</div>
                            </td>
                          )}
                          {activeTab === 'graded' && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600 dark:text-gray-400">{assignment.gradeTime}</div>
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {activeTab === 'pending' ? (
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleGradeAssignment(assignment)}
                                  className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 flex items-center"
                                >
                                  <i className="fa-solid fa-check-to-slot mr-1"></i>
                                  <span>批改</span>
                                </button>
                                {(assignment.aiGradingStatus === 'pending' || assignment.aiGradingStatus === 'processing') && (
                                  <button 
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (confirm('确定要取消 AI 批改吗？')) {
                                        try {
                                          await cancelAIGrading(assignment.id);
                                          toast.success('✅ AI 批改已取消');
                                          window.location.reload();
                                        } catch (error) {
                                          toast.error('❌ 取消失败: ' + (error instanceof Error ? error.message : '未知错误'));
                                        }
                                      }
                                    }}
                                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 flex items-center text-xs"
                                    title="取消 AI 批改"
                                  >
                                    <i className="fa-solid fa-times mr-1"></i>
                                    <span>取消</span>
                                  </button>
                                )}
                              </div>
                            ) : (
                              <button 
                                onClick={() => handleViewGradedDetails(assignment.id)}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center"
                              >
                                <i className="fa-solid fa-eye mr-1"></i>
                                <span>查看详情</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={activeTab === 'graded' ? 5 : 3} className="px-6 py-10 text-center">
                          <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                              <i className="fa-solid fa-check-circle text-gray-400 text-2xl"></i>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400">
                              {activeTab === 'pending' ? '暂无待批改作业' : '暂无已批改作业'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* 作业批改模态框 */}
      {showGradeModal && currentAssignment && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                批改作业 - {currentAssignment.studentName} - {currentAssignment.assignmentName}
              </h3>
              <button 
                onClick={handleCloseGradeModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6 space-y-6">
              {/* AI 批改状态提示 */}
              {currentAssignment.aiGradingStatus === 'completed' && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start">
                  <i className="fa-solid fa-circle-check text-green-600 dark:text-green-400 text-xl mr-3 mt-0.5"></i>
                  <div className="flex-1">
                    <h5 className="font-semibold text-green-800 dark:text-green-300 mb-1">AI 批改已完成</h5>
                    <p className="text-sm text-green-700 dark:text-green-400">
                      AI 已完成批改，您可以查看评语，填写分数后提交正式批改，或选择重新进行 AI 批改。
                    </p>
                    {currentAssignment.aiGradedAt && (
                      <p className="text-xs text-green-600 dark:text-green-500 mt-2">
                        完成时间: {new Date(currentAssignment.aiGradedAt).toLocaleString('zh-CN')}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {(currentAssignment.aiGradingStatus === 'pending' || currentAssignment.aiGradingStatus === 'processing') && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start">
                  <i className="fa-solid fa-spinner fa-spin text-blue-600 dark:text-blue-400 text-xl mr-3 mt-0.5"></i>
                  <div className="flex-1">
                    <h5 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">AI 批改进行中</h5>
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      AI 正在批改该作业，请稍后查看结果...
                    </p>
                  </div>
                </div>
              )}
              
              {currentAssignment.aiGradingStatus === 'failed' && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start">
                  <i className="fa-solid fa-circle-exclamation text-red-600 dark:text-red-400 text-xl mr-3 mt-0.5"></i>
                  <div className="flex-1">
                    <h5 className="font-semibold text-red-800 dark:text-red-300 mb-1">AI 批改失败</h5>
                    <p className="text-sm text-red-700 dark:text-red-400">
                      {currentAssignment.aiErrorMessage || 'AI 批改过程中出现错误，您可以重新尝试或手动批改。'}
                    </p>
                  </div>
                </div>
              )}
              
              {/* 学生作业附件 */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">学生作业附件 ({currentAssignment.attachments ? currentAssignment.attachments.length : 0})</h4>
                {currentAssignment.attachments && currentAssignment.attachments.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {currentAssignment.attachments.map((attachment) => (
                      <div 
                        key={attachment.id}
                        className="relative group cursor-pointer overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700"
                        onClick={() => attachment.type === "image" && handleImageClick(attachment.url)}
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
                        {/* 图片放大提示 */}
                        {attachment.type === "image" && (
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 dark:bg-gray-800/90 rounded-full p-3">
                              <i className="fa-solid fa-search-plus text-gray-800 dark:text-white text-xl"></i>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <i className="fa-solid fa-file-circle-exclamation text-gray-400 text-4xl mb-2"></i>
                    <p className="text-gray-500 dark:text-gray-400">该学生未上传作业附件</p>
                  </div>
                )}
              </div>
              
                {/* 自动批改按钮 */}
                {showAutoGradeButton && (
                   <div className="my-6 flex justify-center">
                    <button
                      onClick={handleAutoGenerateGrade}
                      disabled={isSubmitting}
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-300 text-base flex items-center justify-center max-w-xs shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin mr-3 text-xl"></i>
                          AI 批改中...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-wand-magic-sparkles mr-3 text-xl"></i>
                          AI 智能批改
                        </>
                      )}
                    </button>
                  </div>
                )}
              
              {/* 流式输出显示区域 */}
              {isStreaming && (
                <div className="my-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800/50 shadow-inner animate-fadeIn">
                  <div className="flex items-center mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                      <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <span className="ml-3 text-sm font-medium text-blue-700 dark:text-blue-300">
                      🤖 AI 正在分析作业并生成批改意见...
                    </span>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-blue-100 dark:border-blue-900/50 shadow-sm max-h-96 overflow-y-auto">
                    {streamingText ? (
                      <div className="text-sm leading-relaxed">
                        <MarkdownRenderer content={streamingText} />
                        <span className="inline-block w-0.5 h-5 bg-blue-500 ml-1 animate-pulse"></span>
                        <div ref={streamingEndRef} />
                      </div>
                    ) : (
                      <div className="text-gray-400 dark:text-gray-500 text-sm italic">
                        等待 AI 响应...
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* 批改结果显示区域 - 美化显示 AI 返回的文本 */}
               {comment && !isStreaming && (
                <div className="my-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800/50 shadow-lg animate-fadeIn">
                  <div className="flex items-center mb-5">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mr-3 shadow-md">
                      <i className="fa-solid fa-robot text-white text-xl"></i>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-gray-800 dark:text-white">
                        AI 批改结果
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">智能分析完成</p>
                    </div>
                  </div>
                  
                  {/* 美化显示 AI 返回的文本 */}
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-green-100 dark:border-green-900/50 shadow-inner max-h-[600px] overflow-y-auto">
                    <MarkdownRenderer content={comment} />
                  </div>
                  
                  {/* 操作按钮 */}
                  <div className="mt-6 flex justify-center gap-4">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(comment);
                        toast.success('批改内容已复制到剪贴板');
                      }}
                      className="px-6 py-2.5 bg-white dark:bg-gray-700 border-2 border-green-400 dark:border-green-600 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 transition-all shadow-sm hover:shadow-md flex items-center font-medium"
                    >
                      <i className="fa-solid fa-copy mr-2"></i>
                      复制批改内容
                    </button>
                  </div>
                </div>
              )}
              
              {/* 生成的专项练习题 - 直接显示在批改页面内 */}
              {practiceProblems.length > 0 && (
                <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-xl border border-purple-200 dark:border-purple-900/30 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                      <i className="fa-solid fa-lightbulb text-yellow-500 mr-2"></i>
                      专项练习题
                    </h4>
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/70 text-purple-600 dark:text-purple-400 rounded-full text-sm font-medium shadow-sm">
                      {practiceProblems.length}道题
                    </span>
                  </div>
                  
                  {/* 难度标识 */}
                  {score && (
                    <div className="mb-6">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">难度等级:</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          parseInt(score) < 85 ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 
                          parseInt(score) < 95 ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400' : 
                          'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
                        }`}>
                          {parseInt(score) < 85 ? '基础' : parseInt(score) < 95 ? '进阶' : '挑战'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* 题目列表 */}
                  <div className="space-y-5">
                    {practiceProblems.map((problem, index) => (
                      <div key={problem.id} className="bg-gray-50 dark:bg-gray-700/50 p-5 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start mb-3">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/70 text-purple-600 dark:text-purple-400 text-sm font-medium mr-3 mt-0.5 flex-shrink-0 shadow-sm">
                            {index + 1}
                          </span>
                          <div>
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{problem.type}</span>
                          </div>
                        </div>
                        <p className="text-gray-800 dark:text-white ml-11 text-base leading-relaxed">
                          {problem.question}
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  {/* 生成状态与操作提示 */}
                  <div className="mt-8 p-5 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 flex items-start">
                    <div className="mr-4 mt-1">
                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                        <i className="fa-solid fa-check-circle text-green-500 text-xl"></i>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-green-700 dark:text-green-400 mb-1">专项练习已生成</h5>
                      <p className="text-green-600 dark:text-green-300 text-sm">
                        提交批改后将自动为学生创建新的专项练习作业，帮助他们针对薄弱环节进行巩固。
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 批改表单 */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="score" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    得分 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="score"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    min="0"
                    max="100"
                    placeholder="请输入得分 (0-100)"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    批改评语
                  </label>
                  <textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={6}
                    placeholder="请输入批改评语..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {currentAssignment.aiGradingStatus === 'completed' ? 
                      'AI 已生成批改评语，您可以修改后提交' : 
                      '您可以手动输入评语，或使用 AI 智能批改'}
                  </p>
                </div>
              </div>
            </div>
            
             <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              {/* 根据AI批改状态显示不同的按钮组合 */}
              {currentAssignment.aiGradingStatus === 'completed' ? (
                // AI批改完成：显示重新批改和提交批改按钮
                <div className="flex justify-center gap-4">
                  <button
                    onClick={handleRetryAIGrading}
                    disabled={isSubmitting}
                    className="px-6 py-3 border-2 border-blue-500 dark:border-blue-600 rounded-lg shadow-sm text-base font-medium text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                        处理中...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-rotate mr-2"></i>
                        重新批改
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleSubmitGrade}
                    disabled={isSubmitting || !score}
                    className="px-8 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                        提交中...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-check mr-2"></i>
                        采纳并提交
                      </>
                    )}
                  </button>
                </div>
              ) : (currentAssignment.aiGradingStatus === 'pending' || currentAssignment.aiGradingStatus === 'processing') ? (
                // AI批改进行中：显示提示信息和取消按钮
                <div className="flex flex-col items-center">
                  <div className="text-center text-gray-500 dark:text-gray-400 mb-4">
                    <i className="fa-solid fa-spinner fa-spin text-2xl mb-2"></i>
                    <p className="mb-2">AI 批改正在进行中，请稍后再查看...</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">或者您可以取消此次批改</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelAIGrading}
                    disabled={isSubmitting}
                    className="px-6 py-2 border border-red-500 dark:border-red-600 rounded-lg text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-all"
                  >
                    <i className="fa-solid fa-times mr-2"></i>
                    取消批改
                  </button>
                  <button
                    onClick={handleCloseGradeModal}
                    className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    关闭窗口
                  </button>
                </div>
              ) : (
                // 未批改或批改失败：显示普通提交按钮
                <div className="flex justify-center">
                  <button
                    onClick={handleSubmitGrade}
                    disabled={isSubmitting || !score}
                    className="px-8 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                        提交中...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-check mr-2"></i>
                        提交批改
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* 图片预览模态框 */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4"
          onClick={handleClosePreview}
        >
          <button
            onClick={handleClosePreview}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
          >
            <i className="fa-solid fa-times text-3xl"></i>
          </button>
          
          {/* 缩放控制按钮 */}
          <div className="absolute top-4 left-4 flex items-center space-x-2 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleZoomOut();
              }}
              className="bg-white/20 hover:bg-white/30 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors"
            >
              <i className="fa-solid fa-search-minus"></i>
            </button>
            <span className="text-white font-medium bg-black/30 px-3 py-1 rounded-full">
              {Math.round(imageScale * 100)}%
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleZoomIn();
              }}
              className="bg-white/20 hover:bg-white/30 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors"
            >
              <i className="fa-solid fa-search-plus"></i>
            </button>
          </div>
          
          <div 
            className="max-w-7xl max-h-full overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImage}
              alt="预览"
              className="max-w-full max-h-[90vh] object-contain transition-transform duration-300"
              style={{ transform: `scale(${imageScale})` }}
            />
          </div>
        </div>
      )}
      
      {/* 页脚 */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>© 2025 智慧教辅系统 - 教师后台</p>
        </div>
      </footer>
    </div>
  );
}