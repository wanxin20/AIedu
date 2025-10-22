import { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "@/contexts/authContext";
import { toast } from "sonner";
import { generateLessonPlanFromApi, parseApiResponse } from "@/services/lessonPlanApi";
import { createLessonPlan } from "@/services/savedLessonPlanApi";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// 定义目录项接口
interface TableOfContent {
  id: number;
  title: string;
  sections: {
    id: number;
    title: string;
  }[];
}

// 定义教案内容接口
interface LessonPlanContent {
  id: string;
  title: string;
  content: string; // Markdown 格式的原始内容
}

// 模拟年级数据
const grades = [
  { id: '1', name: '初一' },
  { id: '2', name: '初二' },
  { id: '3', name: '初三' }
];

// 模拟学科数据
const subjects = [
  { id: 'math', name: '数学（人教版）' },
  { id: 'chinese', name: '语文' },
  { id: 'english', name: '英语' },
  { id: 'physics', name: '物理' },
  { id: 'chemistry', name: '化学' },
  { id: 'biology', name: '生物' },
  { id: 'history', name: '历史' },
  { id: 'geography', name: '地理' },
  { id: 'politics', name: '政治' }
];

// 模拟目录数据 - 根据年级和学科动态生成
const generateTableOfContents = (grade: string, subject: string): TableOfContent[] => {
  // 根据年级和学科生成不同的目录
  const gradeName = grades.find(g => g.id === grade)?.name || '';
  const subjectName = subjects.find(s => s.id === subject)?.name || '';
  
  // 基础目录模板
  let baseContents: TableOfContent[] = [];
  
  // 数学目录
  if (subject === 'math') {
    baseContents = [
      {
        id: 1,
        title: `${gradeName}数学基础概念`,
        sections: [
          { id: 101, title: '一元二次方程' },
          { id: 102, title: '二次函数' },
          { id: 103, title: '旋转' },
          { id: 104, title: '园' }
        ]
      },
      {
        id: 2,
        title: `${gradeName}数学进阶应用`,
        sections: [
          { id: 201, title: '代数运算' },
          { id: 202, title: '几何图形' },
          { id: 203, title: '概率与统计' }
        ]
      }
    ];
  } 
  // 物理目录
  else if (subject === 'physics') {
    baseContents = [
      {
        id: 1,
        title: `${gradeName}物理力学基础`,
        sections: [
          { id: 101, title: '运动学基本概念' },
          { id: 102, title: '牛顿运动定律' },
          { id: 103, title: '机械能守恒' },
          { id: 104, title: '动量定理与守恒' }
        ]
      },
      {
        id: 2,
        title: `${gradeName}物理电磁学`,
        sections: [
          { id: 201, title: '电场与电势' },
          { id: 202, title: '电路基础' },
          { id: 203, title: '磁场与电磁感应' },
          { id: 204, title: '交流电' }
        ]
      }
    ];
  }
  // 英语目录
  else if (subject === 'english') {
    baseContents = [
      {
        id: 1,
        title: `${gradeName}英语语法基础`,
        sections: [
          { id: 101, title: '时态与语态' },
          { id: 102, title: '从句结构' },
          { id: 103, title: '非谓语动词' },
          { id: 104, title: '虚拟语气' }
        ]
      },
      {
        id: 2,
        title: `${gradeName}英语阅读理解`,
        sections: [
          { id: 201, title: '细节理解题' },
          { id: 202, title: '推理判断题' },
          { id: 203, title: '主旨大意题' },
          { id: 204, title: '词义猜测题' }
        ]
      }
    ];
  }
  // 默认目录
  else {
    baseContents = [
      {
        id: 1,
        title: `${gradeName}${subjectName}基础章节`,
        sections: [
          { id: 101, title: '基本概念' },
          { id: 102, title: '核心原理' },
          { id: 103, title: '典型例题' }
        ]
      },
      {
        id: 2,
        title: `${gradeName}${subjectName}进阶应用`,
        sections: [
          { id: 201, title: '综合应用' },
          { id: 202, title: '拓展提高' },
          { id: 203, title: '习题讲解' }
        ]
      }
    ];
  }
  
  return baseContents;
};

// 使用 react-markdown 渲染 Markdown 内容（增强版 + 数学公式）
const MarkdownRenderer = ({ content }: { content: string }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('代码已复制到剪贴板');
    setTimeout(() => setCopiedCode(null), 2000);
  };
  
  return (
    <div className="markdown-content prose max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeKatex]}
        components={{
          // 自定义标题渲染
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-6 mb-4 pb-3 border-b-2 border-green-500 dark:border-green-400">
              <i className="fa-solid fa-bookmark text-green-600 dark:text-green-400 mr-2"></i>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-5 mb-3 flex items-center">
              <span className="w-1 h-6 bg-green-500 dark:bg-green-400 mr-3"></span>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-4 mb-2">
              <i className="fa-solid fa-circle text-green-500 dark:text-green-400 text-xs mr-2"></i>
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200 mt-3 mb-2">
              {children}
            </h4>
          ),
          // 段落
          p: ({ children }) => (
            <p className="text-gray-900 dark:text-gray-100 leading-relaxed mb-3 text-justify">
              {children}
            </p>
          ),
          // 无序列表
          ul: ({ children }) => (
            <ul className="space-y-2 my-3 text-gray-900 dark:text-gray-100 pl-6">
              {children}
            </ul>
          ),
          // 有序列表
          ol: ({ children }) => (
            <ol className="space-y-2 my-3 text-gray-900 dark:text-gray-100 pl-6">
              {children}
            </ol>
          ),
          // 列表项
          li: ({ children }) => (
            <li className="leading-relaxed flex items-start">
              <span className="inline-block w-1.5 h-1.5 bg-green-500 dark:bg-green-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
              <span className="flex-1">{children}</span>
            </li>
          ),
          // 粗体
          strong: ({ children }) => (
            <strong className="font-bold text-gray-900 dark:text-white bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded">
              {children}
            </strong>
          ),
          // 斜体
          em: ({ children }) => (
            <em className="italic text-gray-800 dark:text-gray-200">
              {children}
            </em>
          ),
          // 行内代码
          code: ({ inline, children }: any) => {
            if (inline) {
              return (
                <code className="px-2 py-0.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-sm font-mono border border-green-200 dark:border-green-800">
                  {children}
                </code>
              );
            }
            return <code className="font-mono text-sm">{children}</code>;
          },
          // 代码块
          pre: ({ children }: any) => {
            const code = children?.props?.children || '';
            const isCopied = copiedCode === code;
            
            return (
              <div className="relative group my-4">
                <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 rounded-lg p-4 overflow-x-auto border border-gray-700 shadow-lg">
                  {children}
                </pre>
                <button
                  onClick={() => handleCopyCode(code)}
                  className="absolute top-2 right-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all shadow-md"
                >
                  <i className={`fa-solid ${isCopied ? 'fa-check' : 'fa-copy'}`}></i>
                  <span>{isCopied ? '已复制' : '复制代码'}</span>
                </button>
              </div>
            );
          },
          // 引用块
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-green-500 dark:border-green-400 pl-4 py-2 my-4 bg-green-50 dark:bg-green-900/20 rounded-r">
              <div className="flex items-start">
                <i className="fa-solid fa-quote-left text-green-500 dark:text-green-400 text-xl mr-3 mt-1"></i>
                <div className="flex-1 text-gray-700 dark:text-gray-300 italic">
                  {children}
                </div>
              </div>
            </blockquote>
          ),
          // 表格
          table: ({ children }) => (
            <div className="overflow-x-auto my-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-green-50 dark:bg-green-900/30">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left text-xs font-semibold text-green-700 dark:text-green-300 uppercase tracking-wider">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
              {children}
            </td>
          ),
          // 链接
          a: ({ href, children }: any) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 underline decoration-2 underline-offset-2"
            >
              {children}
              <i className="fa-solid fa-external-link-alt ml-1 text-xs"></i>
            </a>
          ),
          // 水平线
          hr: () => (
            <hr className="my-6 border-t-2 border-gray-200 dark:border-gray-700" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default function LessonPlanGenerator() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [tableOfContents, setTableOfContents] = useState<TableOfContent[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [lessonPlanContent, setLessonPlanContent] = useState<LessonPlanContent | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedLessonPlanId, setSavedLessonPlanId] = useState<number | null>(null);

  // 权限检查
  useEffect(() => {
    if (user && user.role !== "teacher") {
      navigate("/");
    }
  }, [user, navigate]);

  // 当年级或学科变化时，更新目录
  useEffect(() => {
    if (selectedGrade && selectedSubject) {
      setTableOfContents(generateTableOfContents(selectedGrade, selectedSubject));
      // 重置已选章节和教案内容
      setSelectedSection('');
      setLessonPlanContent(null);
    } else {
      setTableOfContents([]);
      setSelectedSection('');
      setLessonPlanContent(null);
    }
  }, [selectedGrade, selectedSubject]);

  // 生成教案
  const handleGenerateLessonPlan = async () => {
    if (!selectedSection) {
      toast.error('请先选择要生成教案的章节');
      return;
    }

    setIsGenerating(true);
    setSavedLessonPlanId(null); // 重置保存状态
    
    try {
      // 如果是数学学科，调用真实 API
      if (selectedSubject === 'math') {
        toast.info('正在调用 AI 生成教案，请稍候...');
        
        const apiResponse = await generateLessonPlanFromApi(selectedSection);
        const parsedContent = parseApiResponse(apiResponse, selectedSection, selectedSubject);
        
        setLessonPlanContent(parsedContent);
        toast.success('AI 教案生成成功');
      } else {
        // 其他学科暂不支持
        toast.warning('当前仅支持数学学科的 AI 教案生成');
        return;
      }
    } catch (error) {
      console.error('教案生成失败:', error);
      toast.error('教案生成失败，请稍后重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // 保存教案到数据库
  const handleSaveLessonPlan = async () => {
    if (!lessonPlanContent) {
      toast.error('没有可保存的教案内容');
      return;
    }

    if (!selectedGrade || !selectedSubject) {
      toast.error('请选择年级和学科');
      return;
    }

    setIsSaving(true);

    try {
      const gradeName = grades.find(g => g.id === selectedGrade)?.name || '';
      const subjectName = subjects.find(s => s.id === selectedSubject)?.name || '';

      const response = await createLessonPlan({
        title: lessonPlanContent.title,
        subject: subjectName,
        grade: gradeName,
        content: lessonPlanContent.content,
        objectives: `掌握${selectedSection}的基本概念和应用`,
        materials: '教材、课件、练习题',
        duration: 45,
        tags: [selectedSection, subjectName, gradeName]
      });

      if (response.code === 200) {
        setSavedLessonPlanId(response.data.id);
        toast.success('教案已保存到数据库');
      } else {
        throw new Error(response.message || '保存失败');
      }
    } catch (error: any) {
      console.error('保存教案失败:', error);
      toast.error('保存教案失败: ' + (error.message || '未知错误'));
    } finally {
      setIsSaving(false);
    }
  };

  // 复制教案内容
  const handleCopyContent = () => {
    if (!lessonPlanContent) return;
    
    const textToCopy = `# ${lessonPlanContent.title}\n\n${lessonPlanContent.content}`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      toast.success('教案内容已复制到剪贴板');
    }).catch(err => {
      toast.error('复制失败，请手动复制');
      console.error('复制失败:', err);
    });
  };

  // 下载PDF
  const handleDownloadPDF = () => {
    // 模拟下载PDF功能
    toast.info('PDF生成中，请稍候...');
    setTimeout(() => {
      toast.success('PDF已成功生成，开始下载');
      // 这里应该调用实际的PDF生成和下载API
    }, 1500);
  };

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
                className="text-green-600 dark:text-green-400 font-medium flex items-center"
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
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">智能教案生成</h2>
          <p className="text-gray-600 dark:text-gray-400">选择年级、学科和具体章节，系统将自动为您生成优质教案</p>
        </div>
        
        {/* 生成教案主体区域 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* 左侧选择区域 */}
            <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 p-6">
              {/* 年级和学科选择 */}
              <div className="space-y-6 mb-8">
                {/* 年级选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    选择年级 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-colors"
                  >
                    <option value="">请选择年级</option>
                    {grades.map(grade => (
                      <option key={grade.id} value={grade.id}>
                        {grade.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* 学科选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    选择学科 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-colors"
                  >
                    <option value="">请选择学科</option>
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                  {selectedSubject === 'math' && (
                    <div className="mt-2 flex items-start space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <i className="fa-solid fa-robot text-blue-600 dark:text-blue-400 mt-0.5"></i>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        数学学科已接入 AI 教案生成系统，将为您提供更智能、更专业的教案内容
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 目录列表 */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">章节目录</h3>
                {selectedGrade && selectedSubject ? (
                  <div className="space-y-4">
                    {tableOfContents.map(chapter => (
                      <div key={chapter.id} className="space-y-2">
                        <div className="font-medium text-gray-800 dark:text-white">{chapter.title}</div>
                        <div className="ml-4 space-y-1">
                          {chapter.sections.map(section => (
                            <div 
                              key={section.id}
                              onClick={() => setSelectedSection(section.title)}
                              className={`px-3 py-2 rounded-md cursor-pointer transition-colors ${
                                selectedSection === section.title
                                  ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                            >
                              {section.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 dark:text-gray-400 py-4">
                    请先选择年级和学科
                  </div>
                )}
              </div>
              
              {/* 生成按钮 */}
              <div className="mt-8">
                <button
                  onClick={handleGenerateLessonPlan}
                  disabled={!selectedGrade || !selectedSubject || !selectedSection || isGenerating}
                  className={`w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center ${
                    !selectedGrade || !selectedSubject || !selectedSection || isGenerating
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                      <span>生成中...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-magic mr-2"></i>
                      <span>生成教案</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* 右侧教案内容区域 */}
            <div className="w-full lg:w-2/3 p-6 overflow-y-auto max-h-[calc(100vh-220px)]">
              {lessonPlanContent ? (
                <div className="space-y-6">
                  {/* 教案标题 */}
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{lessonPlanContent.title}</h2>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <i className="fa-solid fa-robot text-blue-600 dark:text-blue-400 mr-2"></i>
                      <span>AI 生成</span>
                      <span className="mx-2">•</span>
                      <span>{grades.find(g => g.id === selectedGrade)?.name} {subjects.find(s => s.id === selectedSubject)?.name}</span>
                      <span className="mx-2">•</span>
                      <span>{new Date().toLocaleDateString('zh-CN')}</span>
                    </div>
                  </div>
                  
                  {/* Markdown 渲染内容 */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                    <MarkdownRenderer content={lessonPlanContent.content} />
                  </div>
                  
                  {/* 操作按钮 */}
                  <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handleSaveLessonPlan}
                      disabled={isSaving || !!savedLessonPlanId}
                      className={`px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white transition-colors flex items-center ${
                        savedLessonPlanId 
                          ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                          : 'bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600'
                      }`}
                    >
                      {isSaving ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                          <span>保存中...</span>
                        </>
                      ) : savedLessonPlanId ? (
                        <>
                          <i className="fa-solid fa-check mr-2"></i>
                          <span>已保存</span>
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-save mr-2"></i>
                          <span>保存教案</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCopyContent}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center"
                    >
                      <i className="fa-solid fa-copy mr-2"></i>
                      <span>复制内容</span>
                    </button>
                    <button
                      onClick={handleDownloadPDF}
                      className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600 transition-colors flex items-center"
                    >
                      <i className="fa-solid fa-download mr-2"></i>
                      <span>下载PDF</span>
                    </button>
                    {savedLessonPlanId && (
                      <button
                        onClick={() => navigate('/teacher/lesson-plans')}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center"
                      >
                        <i className="fa-solid fa-list mr-2"></i>
                        <span>查看教案列表</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                  <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                    <i className="fa-solid fa-file-pen text-gray-400 text-3xl"></i>
                  </div>
                  <h3 className="text-xl font-medium text-gray-800 dark:text-white mb-2">智能教案生成</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-8">
                    请在左侧选择年级、学科和具体章节，然后点击"生成教案"按钮，系统将自动为您生成专业的教学方案
                  </p>
                  {selectedGrade && selectedSubject && selectedSection && (
                    <button
                      onClick={handleGenerateLessonPlan}
                      disabled={isGenerating}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center"
                    >
                      {isGenerating ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                          <span>生成中...</span>
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-magic mr-2"></i>
                          <span>生成教案</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
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