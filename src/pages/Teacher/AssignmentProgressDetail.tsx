import { useContext, useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "@/contexts/authContext";
import { toast } from "sonner";
import { gradeAssignmentWithStream } from "@/services/gradingApi";

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

// 模拟学生作业数据
const generateStudentAssignments = (assignmentId: number, assignmentName: string): StudentAssignment[] => {
  const students = [
    { id: 1, name: "张三" },
    { id: 2, name: "李四" },
    { id: 3, name: "王五" },
    { id: 4, name: "赵六" },
    { id: 5, name: "孙七" },
    { id: 6, name: "周八" },
    { id: 7, name: "吴九" },
    { id: 8, name: "郑十" },
    { id: 9, name: "钱十一" },
    { id: 10, name: "孙十二" },
    { id: 11, name: "李十三" },
    { id: 12, name: "周十四" },
    { id: 13, name: "吴十五" },
    { id: 14, name: "郑十六" },
    { id: 15, name: "钱十七" }
  ];

  // 根据不同的作业ID生成不同的完成情况
  let submittedCount = 10;
  let gradedCount = 5;
  
  if (assignmentId === 2) {
    submittedCount = 8;
    gradedCount = 3;
  } else if (assignmentId === 3) {
    submittedCount = 14;
    gradedCount = 12;
  } else if (assignmentId === 4) {
    submittedCount = 6;
    gradedCount = 2;
  } else if (assignmentId === 5) {
    submittedCount = 4;
    gradedCount = 1;
  } else if (assignmentId === 6) {
    submittedCount = 2;
    gradedCount = 0;
  }

  return students.map((student, index) => {
    let status: 'pending' | 'submitted' | 'graded' = 'pending';
    let score: number | null = null;
    let submitTime: string | null = null;
    let gradeTime: string | null = null;
    let comment: string | null = null;
    let attachments: any[] = [];

    if (index < submittedCount) {
      status = index < gradedCount ? 'graded' : 'submitted';
      submitTime = "2025-09-08 10:30:00";
      // 模拟学生上传的附件
      attachments = [
        { 
          id: `att-${student.id}-1`, 
          name: `作业提交-${student.name}.jpg`, 
          url: "http://a.gptpro.cn/local_storage/opencoze/tos-cn-i-v4nquku3lp/e327feee-ad14-45d6-964a-5fdedb007e35.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=minioadmin%2F20251011%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20251011T031920Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=ea7353b12946736b2648c6243f7fc5f84dd8016f0452e16327ee31ef0cf4a333&x-wf-file_name=706c26f526c6c06d39eed532d1b1d163.jpg", 
          type: "image" 
        }
      ];
      if (status === 'graded') {
        score = Math.floor(Math.random() * 20) + 80; // 80-100分之间的随机分数
        gradeTime = "2025-09-08 14:15:00";
        comment = "整体表现良好，知识点掌握扎实，但在一些细节问题上还需要加强。";
      }
    }

    return {
      id: index + 1,
      studentId: student.id,
      studentName: student.name,
      assignmentId,
      assignmentName,
      status,
      score,
      submitTime,
      gradeTime,
      comment,
      attachments
    };
  });
};

// 模拟作业信息
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
    },
    { 
      id: 4, 
      name: "化学元素周期表练习", 
      subject: "化学", 
      assignedDate: "2025-09-05", 
      dueDate: "2025-09-18", 
      description: "本作业要求学生掌握元素周期表的结构、元素性质的周期性变化规律，并能够应用这些知识解决相关问题。",
      attachments: [
        { id: "att4", name: "元素周期表高清版.jpg", url: "https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=Periodic%20Table%20of%20Elements&sign=bc1caba46953572608abb21569bc7152", type: "image" }
      ]
    },
    { id: 5, name: "历史事件时间轴制作", subject: "历史", assignedDate: "2025-09-06", dueDate: "2025-09-20", description: "学生需要收集指定历史时期的重要事件资料，制作详细的时间轴，梳理历史发展脉络，培养历史思维能力。" },
    { id: 6, name: "地理气候类型分析", subject: "地理", assignedDate: "2025-09-08", dueDate: "2025-09-25", description: "本作业要求学生分析世界主要气候类型的分布、特点、成因及其对人类活动的影响，培养地理分析能力。" }
  ];
  
  return assignments.find(a => a.id === assignmentId) || assignments[0];
};

export default function AssignmentProgressDetail() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const params = useParams();
  const assignmentId = parseInt(params.id || '1', 10);
  
  const [isLoading, setIsLoading] = useState(true);
  const [assignmentInfo, setAssignmentInfo] = useState<any>(null);
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

  // 自动滚动到流式输出底部
  useEffect(() => {
    if (isStreaming && streamingEndRef.current) {
      streamingEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [streamingText, isStreaming]);

  // 模拟数据加载
  useEffect(() => {
    const timer = setTimeout(() => {
      const info = getAssignmentInfo(assignmentId);
      setAssignmentInfo(info);
      
      const assignments = generateStudentAssignments(assignmentId, info.name);
      setStudentAssignments(assignments);
      
      // 计算统计数据
      setTotalStudents(assignments.length);
      setSubmittedCount(assignments.filter(a => a.status !== 'pending').length);
      setPendingCount(assignments.filter(a => a.status === 'pending').length);
      
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [assignmentId]);

  // 权限检查
  useEffect(() => {
    if (user && user.role !== "teacher") {
      navigate("/");
    }
  }, [user, navigate]);

  // 处理批改作业
  const handleGradeAssignment = (studentAssignment: StudentAssignment) => {
    setCurrentAssignment(studentAssignment);
    setComment(studentAssignment.comment || '');
    setScore(studentAssignment.score ? studentAssignment.score.toString() : '');
    setShowGradeModal(true);
  };

  // 处理关闭批改模态框
  const handleCloseGradeModal = () => {
    setShowGradeModal(false);
    setCurrentAssignment(null);
    handleResetGrading(); // 重置批改相关状态
  };

    // 处理自动生成批改
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
    
    // 获取第一个图片附件
    const imageAttachment = currentAssignment.attachments.find(att => att.type === 'image');
    if (!imageAttachment) {
      toast.error('未找到作业图片');
      return;
    }
    
    try {
      // 显示加载状态
      setIsSubmitting(true);
      setIsStreaming(true);
      setStreamingText('');
      
      toast.info('🤖 正在连接 AI 批改系统...', {
        duration: 2000,
      });
      
      // 调用 Coze API 进行批改（流式输出）
      const result = await gradeAssignmentWithStream(
        imageAttachment.url,
        (chunk) => {
          // 流式输出回调 - 实时显示批改过程
          setStreamingText(prev => prev + chunk);
        }
      );
      
      // 批改完成
      setIsStreaming(false);
      // 直接显示 AI 返回的完整文本
      setComment(result.comment);
      setIsSubmitting(false);
      setShowAutoGradeButton(false); // 自动批改完成后隐藏按钮
      
      toast.success('✅ AI 批改完成！', {
        duration: 3000,
        position: 'top-right'
      });
    } catch (error) {
      console.error('自动批改失败:', error);
      setIsSubmitting(false);
      setIsStreaming(false);
      setStreamingText('');
      
      toast.error('❌ 批改失败，请稍后重试', {
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
      const subject = assignmentInfo.subject;
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
      const subject = assignmentInfo.subject;
      let problems = generateClassPracticeProblems(subject);
      
      setClassPracticeProblems(problems);
      setIsGeneratingClassPractice(false);
      setShowClassPracticeModal(true);
    }, 1500);
  };

  // 处理提交批改
  const handleSubmitGrade = () => {
    if (!currentAssignment || !score) {
      toast.error('请填写得分');
      return;
    }

    setIsSubmitting(true);
    
    // 模拟提交延迟
    setTimeout(() => {
      const updatedAssignments = studentAssignments.map(assignment => {
        if (assignment.id === currentAssignment.id) {
          return {
            ...assignment,
            score: parseInt(score, 10),
            comment: comment,
            status: 'graded' as const,
            gradeTime: new Date().toLocaleString('zh-CN')
          };
        }
        return assignment;
      });
      
      setStudentAssignments(updatedAssignments);
      setIsSubmitting(false);
      setShowGradeModal(false);
      // 重置批改状态
      handleResetGrading();
      // 更新统计数据
      setSubmittedCount(prev => prev - 1);
      setPendingCount(prev => prev + 1);
      toast.success('批改已提交');
      
      // 如果已经生成了专项练习，给学生创建新作业
      if (practiceProblems.length > 0) {
        // 模拟创建新作业的延迟
        setTimeout(() => {
          toast.success(`已为 ${currentAssignment.studentName} 创建专项练习作业`);
        }, 500);
      }
    }, 800);
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
  const handleViewGradedDetails = (studentAssignmentId: number) => {
    // 跳转到已批改作业详情页面
    navigate(`/teacher/assignments/detail/${assignmentId}?studentId=${studentAssignmentId}`);
  };

  // 格式化批改文本 - 将文本转换为 HTML
  const formatGradingText = (text: string): string => {
    let html = text;
    
    // 0. 预处理：移除JSON和工具调用信息（额外保护层）
    html = html.replace(/\{(?:[^{}]|\{[^{}]*\})*\}/g, (match) => {
      if (
        match.includes('"msg_type"') || 
        match.includes('"plugin') || 
        match.includes('"tool') ||
        match.includes('"from_module"')
      ) {
        return '';
      }
      return match;
    });
    
    // 1. 转换 Markdown 表格
    const tableRegex = /\|(.+)\|\s*\n\|[-:\s|]+\|\s*\n((?:\|.+\|\s*\n?)+)/g;
    html = html.replace(tableRegex, (match) => {
      const lines = match.trim().split('\n');
      if (lines.length < 3) return match;
      
      const headers = lines[0].split('|').filter(cell => cell.trim()).map(cell => cell.trim());
      const rows = lines.slice(2).map(line => 
        line.split('|').filter(cell => cell.trim()).map(cell => cell.trim())
      );
      
      let tableHtml = '<div class="overflow-x-auto my-4"><table class="min-w-full border-collapse border border-gray-300 dark:border-gray-600">';
      
      // 表头
      tableHtml += '<thead class="bg-blue-50 dark:bg-blue-900/30"><tr>';
      headers.forEach(header => {
        tableHtml += `<th class="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold text-gray-800 dark:text-gray-100">${header}</th>`;
      });
      tableHtml += '</tr></thead>';
      
      // 表体
      tableHtml += '<tbody>';
      rows.forEach((row, idx) => {
        tableHtml += `<tr class="${idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/50'}">`;
        row.forEach(cell => {
          tableHtml += `<td class="border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-700 dark:text-gray-300">${cell}</td>`;
        });
        tableHtml += '</tr>';
      });
      tableHtml += '</tbody></table></div>';
      
      return tableHtml;
    });
    
    // 2. 转换标题（##### -> h5, #### -> h4, ### -> h3, ## -> h2, # -> h1）
    // 从最长的开始替换，避免误匹配
    html = html.replace(/^#####\s+(.+)$/gm, '<h5 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-3 mb-1 border-l-4 border-teal-500 pl-3 bg-teal-50 dark:bg-teal-900/20 py-1 rounded-r">$1</h5>');
    html = html.replace(/^####\s+(.+)$/gm, '<h4 class="text-base font-semibold text-gray-800 dark:text-gray-100 mt-4 mb-2 border-l-4 border-blue-500 pl-3">$1</h4>');
    html = html.replace(/^###\s+(.+)$/gm, '<h3 class="text-lg font-bold text-gray-800 dark:text-gray-100 mt-5 mb-3 border-l-4 border-green-500 pl-3">$1</h3>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2 class="text-xl font-bold text-gray-900 dark:text-white mt-6 mb-4 border-l-4 border-purple-500 pl-3">$1</h2>');
    html = html.replace(/^#\s+(.+)$/gm, '<h1 class="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-5 border-l-4 border-red-500 pl-4">$1</h1>');
    
    // 3. 转换粗体 **文本** 和 $\boldsymbol{文本}$
    html = html.replace(/\$\\boldsymbol\{([^}]+)\}\$/g, '<strong class="font-bold text-gray-900 dark:text-white bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded">$1</strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded">$1</strong>');
    
    // 4. 转换数字列表（优化：区分带冒号和不带冒号的）
    // 带冒号的作为小标题
    html = html.replace(/^(\d+)\.\s+(.+?)[：:]\s*$/gm, '<div class="flex items-start my-3"><span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-sm font-bold mr-3 flex-shrink-0 shadow-sm">$1</span><span class="flex-1 pt-1 font-semibold text-gray-800 dark:text-gray-100">$2：</span></div>');
    // 普通列表项
    html = html.replace(/^(\d+)\.\s+(.+)$/gm, '<div class="flex items-start my-2 ml-4"><span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-sm font-bold mr-3 flex-shrink-0 shadow-sm">$1</span><span class="flex-1 pt-1">$2</span></div>');
    
    // 5. 转换无序列表（● - •）
    html = html.replace(/^[●•-]\s+(.+)$/gm, '<div class="flex items-start my-2 ml-4"><span class="text-green-600 dark:text-green-400 mr-3 text-lg leading-7">●</span><span class="flex-1 pt-0.5">$1</span></div>');
    
    // 6. 高亮数学表达式
    // x = 24 这样的等式
    html = html.replace(/([^a-zA-Z>])([xyz]\s*=\s*[-\d.\/]+)([^a-zA-Z<]|$)/g, '$1<span class="inline-block px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 text-blue-900 dark:text-blue-100 rounded-md font-mono text-base font-semibold border border-blue-200 dark:border-blue-800 shadow-sm">$2</span>$3');
    
    // 7. 高亮分数和数学符号
    html = html.replace(/(<sup>[^<]+<\/sup>⁄<sub>[^<]+<\/sub>)/g, '<span class="inline-block px-2 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100 rounded border border-purple-200 dark:border-purple-800 font-medium mx-0.5">$1</span>');
    
    // 8. 转换段落（保持空行分隔）
    const paragraphs = html.split(/\n\n+/);
    html = paragraphs.map(para => {
      const trimmed = para.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<')) return para; // 已经是HTML标签
      return `<p class="my-3 leading-relaxed">${para.replace(/\n/g, '<br>')}</p>`;
    }).filter(p => p).join('\n');
    
    // 9. 清理多余空白
    html = html.replace(/\n{3,}/g, '\n\n');
    html = html.trim();
    
    return html;
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
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{assignmentInfo.name}</h3>
                <p className="text-gray-600 dark:text-gray-300 mt-2">{assignmentInfo.description}</p>
                {/* 参考附件部分 */}
                {(assignmentInfo.attachments && assignmentInfo.attachments.length > 0) && (
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
                班级专项练习题 - {assignmentInfo.subject}
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
                    <p className="text-base font-medium text-gray-900 dark:text-white">{assignmentInfo.subject}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mr-4">
                    <i className="fa-solid fa-calendar-plus text-green-600 dark:text-green-400 text-xl"></i>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">布置日期</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">{assignmentInfo.assignedDate}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mr-4">
                    <i className="fa-solid fa-calendar-check text-amber-600 dark:text-amber-400 text-xl"></i>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">截止日期</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">{assignmentInfo.dueDate}</p>
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
                              <button 
                                onClick={() => handleGradeAssignment(assignment)}
                                className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 flex items-center"
                              >
                                <i className="fa-solid fa-check-to-slot mr-1"></i>
                                <span>批改</span>
                              </button>
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
              {/* 学生作业附件 */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">学生作业附件 ({currentAssignment.attachments ? currentAssignment.attachments.length : 0})</h4>
                {currentAssignment.attachments && currentAssignment.attachments.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {currentAssignment.attachments.map((attachment) => (
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
                      <div className="formatted-content text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        <div dangerouslySetInnerHTML={{ __html: formatGradingText(streamingText) }} />
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
                    <div 
                      className="formatted-content text-gray-700 dark:text-gray-300 leading-loose text-base"
                      dangerouslySetInnerHTML={{ __html: formatGradingText(comment) }}
                    />
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
            </div>
            
             <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-center">
              <button
                onClick={handleSubmitGrade}
                disabled={isSubmitting || !score}
                className="px-8 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors max-w-xs"
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