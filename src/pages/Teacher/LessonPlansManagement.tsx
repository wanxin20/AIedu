import { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "@/contexts/authContext";
import { toast } from "sonner";
import { getLessonPlanList, deleteLessonPlan, getLessonPlanDetail } from "@/services/savedLessonPlanApi";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface LessonPlan {
    id: number;
    title: string;
    subject: string;
    grade: string;
    createdAt: string;
    status: 'draft' | 'published';
}

// Markdown 渲染器组件
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
                        return <code className="font-mono text-sm text-gray-100">{children}</code>;
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

export default function LessonPlansManagement() {
    const {
        user,
        logout
    } = useContext(AuthContext);

    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
    const [filteredLessonPlans, setFilteredLessonPlans] = useState<LessonPlan[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);

    // 加载教案列表
    const loadLessonPlans = async () => {
        try {
            setIsLoading(true);
            const response = await getLessonPlanList({ page: 1, pageSize: 100 });
            console.log('教案列表数据:', response);
            
            if (response.code === 200) {
                const plans = response.data.items || [];
                setLessonPlans(plans);
                setFilteredLessonPlans(plans);
            } else {
                throw new Error(response.message || '加载失败');
            }
        } catch (err: any) {
            console.error('加载教案列表失败:', err);
            toast.error('加载教案失败: ' + (err.message || '未知错误'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadLessonPlans();
    }, []);

    useEffect(() => {
        if (user && user.role !== "teacher") {
            navigate("/");
        }
    }, [user, navigate]);

    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredLessonPlans(lessonPlans);
            return;
        }

        const term = searchTerm.toLowerCase();

        const results = lessonPlans.filter(
            plan => plan.title.toLowerCase().includes(term) || plan.title.toLowerCase() === term
        );

        setFilteredLessonPlans(results);
    }, [searchTerm, lessonPlans]);

    const handleGenerateLessonPlan = () => {
        navigate("/teacher/lesson-plan-generator");
    };

    const handleViewDetail = async (plan: LessonPlan) => {
        try {
            setIsLoadingDetail(true);
            setShowDetailModal(true);
            
            const response = await getLessonPlanDetail(plan.id);
            
            if (response.code === 200) {
                setSelectedPlan(response.data);
            } else {
                throw new Error(response.message || '获取详情失败');
            }
        } catch (err: any) {
            console.error('获取教案详情失败:', err);
            toast.error('获取教案详情失败: ' + (err.message || '未知错误'));
            setShowDetailModal(false);
        } finally {
            setIsLoadingDetail(false);
        }
    };

    const handleCloseDetail = () => {
        setShowDetailModal(false);
        setSelectedPlan(null);
    };

    const handleDeletePlan = async (id: number, title: string) => {
        if (!confirm(`确定要删除教案"${title}"吗？删除后将无法恢复。`)) {
            return;
        }

        try {
            await deleteLessonPlan(id);
            toast.success('教案删除成功');
            loadLessonPlans(); // 重新加载列表
        } catch (err: any) {
            console.error('删除教案失败:', err);
            toast.error('删除教案失败: ' + (err.message || '未知错误'));
        }
    };

    const renderDetailModal = () => {
        if (!showDetailModal)
            return null;

        return (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {isLoadingDetail ? '加载中...' : selectedPlan?.title}
                        </h3>
                        <button
                            onClick={handleCloseDetail}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                            <i className="fa-solid fa-times text-xl"></i>
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto p-6">
                        {isLoadingDetail ? (
                            <div className="flex justify-center items-center min-h-[40vh]">
                                <div className="w-12 h-12 border-t-2 border-b-2 border-green-500 rounded-full animate-spin"></div>
                            </div>
                        ) : selectedPlan ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">学科：</span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedPlan.subject}</span>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">年级：</span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedPlan.grade}</span>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">课时：</span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedPlan.duration || 45}分钟</span>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">状态：</span>
                                        <span className={`text-sm font-medium ${selectedPlan.status === 'published' ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                            {selectedPlan.status === 'published' ? '已发布' : '草稿'}
                                        </span>
                                    </div>
                                </div>
                                
                                {selectedPlan.objectives && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">教学目标</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{selectedPlan.objectives}</p>
                                    </div>
                                )}
                                
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">教案内容</h4>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                                        <MarkdownRenderer content={selectedPlan.content} />
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div
            className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            {}
            <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-2">
                            <i
                                className="fa-solid fa-graduation-cap text-green-600 dark:text-green-400 text-xl"></i>
                            <h1 className="text-lg font-semibold hidden sm:block">智慧教辅系统</h1>
                        </div>
                        <nav className="hidden md:flex items-center space-x-8">
                            <Link
                                to="/teacher/dashboard"
                                className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 flex items-center">
                                <i className="fa-solid fa-tachometer-alt mr-1"></i>
                                <span>仪表盘</span>
                            </Link>
                            <Link
                                to="/teacher/resources"
                                className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 flex items-center">
                                <i className="fa-solid fa-book-open mr-1"></i>
                                <span>资源管理</span>
                            </Link>
                            <Link
                                to="/teacher/lesson-plans"
                                className="text-green-600 dark:text-green-400 font-medium flex items-center">
                                <i className="fa-solid fa-file-pen mr-1"></i>
                                <span>教案生成</span>
                            </Link>
                            <Link
                                to="/teacher/assignments"
                                className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 flex items-center">
                                <i className="fa-solid fa-clipboard-list mr-1"></i>
                                <span>作业管理</span>
                            </Link>
                        </nav>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => toast.info("系统运行正常，无重要通知")}
                                className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                <i className="fa-solid fa-bell"></i>
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>
                            <div className="relative group">
                                <button className="flex items-center space-x-2 focus:outline-none">
                                    <div
                                        className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                        <i className="fa-solid fa-chalkboard-user text-gray-600 dark:text-gray-300"></i>
                                    </div>
                                    <span className="hidden md:inline text-sm font-medium">{user?.name || "教师"}</span>
                                    <i className="fa-solid fa-chevron-down text-xs text-gray-500"></i>
                                </button>
                                <div className="absolute right-0 mt-0 pt-2 w-48 z-50 hidden group-hover:block">
                                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 border border-gray-200 dark:border-gray-700">
                                        <button
                                            onClick={logout}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
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
            {}
            <main className="container mx-auto px-4 py-6">
                {}
                <div
                    className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">教案生成</h2>
                        <p className="text-gray-600 dark:text-gray-400">生成和管理教学教案</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleGenerateLessonPlan}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center">
                            <i className="fa-solid fa-magic mr-2"></i>
                            <span>生成教案</span>
                        </button>
                    </div>
                </div>
                {}
                <div
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
                    <div className="relative">
                        <div
                            className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <i className="fa-solid fa-search text-gray-400"></i>
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-colors"
                            placeholder="请输入教案名称" />
                    </div>
                </div>
                {}
                {isLoading ? <div className="flex flex-col items-center justify-center min-h-[50vh]">
                    <div
                        className="w-12 h-12 border-t-2 border-b-2 border-green-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">加载教案数据中...</p>
                </div> : filteredLessonPlans.length > 0 ? <div
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                                        style={{
                                            fontSize: "14px"
                                        }}>序号</th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                                        style={{
                                            fontSize: "14px"
                                        }}>教案名称</th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                                        style={{
                                            fontSize: "14px"
                                        }}>所属学科</th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                                        style={{
                                            fontSize: "14px"
                                        }}>创建日期</th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                                        style={{
                                            fontSize: "14px"
                                        }}>年级</th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                                        style={{
                                            fontSize: "14px"
                                        }}>状态</th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                                        style={{
                                            fontSize: "14px"
                                        }}>操作</th>
                                </tr>
                            </thead>
                            <tbody
                                className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredLessonPlans.map((plan, index) => <tr
                                    key={plan.id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 dark:text-gray-100">{index + 1}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{plan.title}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-600 dark:text-gray-300">{plan.subject}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-600 dark:text-gray-300">
                                            {plan.createdAt ? new Date(plan.createdAt).toLocaleDateString('zh-CN') : '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-600 dark:text-gray-300">{plan.grade}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            plan.status === 'published' 
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400' 
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                        }`}>
                                            {plan.status === 'published' ? '已发布' : '草稿'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleViewDetail(plan)}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-5 font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 transition-colors">
                                                <i className="fa-solid fa-eye mr-1.5"></i>查看
                                            </button>
                                            <button
                                                onClick={() => handleDeletePlan(plan.id, plan.title)}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-5 font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 transition-colors">
                                                <i className="fa-solid fa-trash mr-1.5"></i>删除
                                            </button>
                                        </div>
                                    </td>
                                </tr>)}
                            </tbody>
                        </table>
                    </div>
                    {}
                    <div
                        className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <div className="text-sm text-gray-600 dark:text-gray-400">显示 <span className="font-medium">1</span>到 <span className="font-medium">{filteredLessonPlans.length}</span>条，共 <span className="font-medium">{lessonPlans.length}</span>条记录
                                          </div>
                        <div className="flex space-x-1">
                            <button
                                className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled>
                                <i className="fa-solid fa-chevron-left text-xs"></i>
                            </button>
                            <button
                                className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-md bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50">1
                                                </button>
                            <button
                                className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled>
                                <i className="fa-solid fa-chevron-right text-xs"></i>
                            </button>
                        </div>
                    </div>
                </div> : <div
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden min-h-[50vh] flex items-center justify-center">
                    <div className="text-center p-8">
                        <div
                            className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                            <i className="fa-solid fa-search text-gray-400 text-2xl"></i>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">未找到匹配的教案</h3>
                        <p className="text-gray-500 dark:text-gray-400">请尝试调整搜索条件或关键词</p>
                        <button
                            onClick={() => setSearchTerm("")}
                            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">清除搜索条件
                                          </button>
                    </div>
                </div>}
            </main>
            {}
            <footer
                className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6 mt-12">
                <div
                    className="container mx-auto px-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                    <p>© 2025 智慧教辅系统 - 教师后台</p>
                </div>
            </footer>
            {}
            {renderDetailModal()}
        </div>
    );
}