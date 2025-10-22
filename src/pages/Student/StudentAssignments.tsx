import { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "@/contexts/authContext";
import { toast } from "sonner";
import { getAssignments } from "@/services/assignmentApi";
import { getMySubmissions } from "@/services/submissionApi";

interface Assignment {
    id: number;
    title: string;
    subject: string;
    created_at: string;
    deadline: string;
    description?: string;
    status: "pending" | "submitted" | "graded";
    score?: number;
    submission_id?: number;
}

export default function StudentAssignments() {
    const {
        user,
        logout
    } = useContext(AuthContext);

    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [error, setError] = useState<string | null>(null);

    // 加载作业列表和提交状态
    const loadAssignments = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // 1. 获取所有作业
            const assignmentsResponse = await getAssignments({ 
                page: 1, 
                pageSize: 100,
                status: 'published' // 只获取已发布的作业
            });
            console.log('作业列表数据:', assignmentsResponse);

            // 2. 获取我的提交记录
            const submissionsResponse = await getMySubmissions();
            console.log('提交记录数据:', submissionsResponse);

            const submissionsMap = new Map();
            (submissionsResponse.data || []).forEach((sub: any) => {
                submissionsMap.set(sub.assignmentId, sub);
            });

            // 3. 合并数据
            const mergedData: Assignment[] = (assignmentsResponse.data.items || []).map((assignment: any) => {
                const submission = submissionsMap.get(assignment.id);
                let status: "pending" | "submitted" | "graded" = 'pending';
                if (submission) {
                    status = submission.score != null ? 'graded' : 'submitted';
                }
                return {
                    id: assignment.id,
                    title: assignment.title,
                    subject: assignment.subject,
                    created_at: assignment.createdAt,
                    deadline: assignment.deadline,
                    description: assignment.description,
                    status: status,
                    score: submission?.score,
                    submission_id: submission?.id
                };
            });

            setAssignments(mergedData);
            setFilteredAssignments(mergedData);
        } catch (err: any) {
            console.error('加载作业列表失败:', err);
            const errorMessage = err.message || '加载数据失败';
            setError(errorMessage);
            toast.error('加载作业失败: ' + (err.message || '未知错误'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAssignments();
    }, []);

    // 监听页面可见性，当页面重新可见时刷新数据
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log('页面重新可见，刷新作业数据');
                loadAssignments();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    useEffect(() => {
        if (user && user.role !== "student") {
            navigate("/");
        }
    }, [user, navigate]);

    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredAssignments(assignments);
            return;
        }

        const term = searchTerm.toLowerCase();
        const results = assignments.filter(assignment => assignment.title.toLowerCase().includes(term));
        setFilteredAssignments(results);
    }, [searchTerm, assignments]);

    const handleSubmitAssignment = (assignmentId: number) => {
        navigate(`/student/assignments/submit/${assignmentId}`);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
        case "pending":
            return (
                <span
                    className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400">待完成
                              </span>
            );
        case "submitted":
            return (
                <span
                    className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400">已提交
                              </span>
            );
        case "graded":
            return (
                <span
                    className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-400">已批改
                              </span>
            );
        default:
            return null;
        }
    };

    const isAssignmentExpired = (deadline: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return new Date(deadline) < today;
    };

    const getDueDateStatus = (deadline: string) => {
        if (isAssignmentExpired(deadline)) {
            return <span className="text-red-600 dark:text-red-400 font-medium">已过期</span>;
        }

        const today = new Date();
        const due = new Date(deadline);
        const daysLeft = Math.ceil((due.getTime() - today.getTime()) / (1000 * 3600 * 24));

        if (daysLeft <= 3) {
            return <span className="text-amber-600 dark:text-amber-400 font-medium">剩余{daysLeft}天</span>;
        }

        return <span className="text-green-600 dark:text-green-400 font-medium">剩余{daysLeft}天</span>;
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
                                className="fa-solid fa-graduation-cap text-orange-600 dark:text-orange-400 text-xl"></i>
                            <h1 className="text-lg font-semibold hidden sm:block">智慧教辅系统</h1>
                        </div>
                        <nav className="hidden md:flex items-center space-x-8">
                            <Link
                                to="/student/dashboard"
                                className="text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 flex items-center">
                                <i className="fa-solid fa-tachometer-alt mr-1"></i>
                                <span>仪表盘</span>
                            </Link>
                            <Link
                                to="/student/assignments"
                                className="text-orange-600 dark:text-orange-400 font-medium flex items-center">
                                <i className="fa-solid fa-clipboard-list mr-1"></i>
                                <span>作业中心</span>
                            </Link>
                            <Link
                                to="/student/resources"
                                className="text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 flex items-center">
                                <i className="fa-solid fa-book-open mr-1"></i>
                                <span>学习资源</span>
                            </Link>
                            <Link
                                to="/student/learning-assistant"
                                className="text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 flex items-center">
                                <i className="fa-solid fa-question-circle mr-1"></i>
                                <span>学习助手</span>
                            </Link>
                        </nav>
                        <div className="flex items-center space-x-4">
                            <button
                                className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                <i className="fa-solid fa-bell"></i>
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>
                            <div className="relative group">
                                <button className="flex items-center space-x-2 focus:outline-none">
                                    <div
                                        className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                        <i className="fa-solid fa-user-graduate text-gray-600 dark:text-gray-300"></i>
                                    </div>
                                    <span className="hidden md:inline text-sm font-medium">{user?.name || "学生"}</span>
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
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">作业中心</h2>
                        <p className="text-gray-600 dark:text-gray-400">查看和提交教师布置的作业</p>
                    </div>
                    <div className="w-full sm:w-auto">
                        <div className="relative">
                            <div
                                className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <i className="fa-solid fa-search text-gray-400"></i>
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white transition-colors"
                                placeholder="请输入作业名称" />
                        </div>
                    </div>
                </div>
                {}
                {isLoading ? <div className="flex flex-col items-center justify-center min-h-[50vh]">
                    <div
                        className="w-12 h-12 border-t-2 border-b-2 border-orange-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">加载作业数据中...</p>
                </div> : filteredAssignments.length > 0 ? <div
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">序号</th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">作业名称</th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">所属学科</th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">布置日期</th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">截止日期</th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">状态</th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">操作</th>
                                </tr>
                            </thead>
                            <tbody
                                className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredAssignments.map((assignment, index) => <tr
                                    key={assignment.id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 dark:text-gray-100">{index + 1}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap max-w-xs">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{assignment.title}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-xs font-medium">
                                            {assignment.subject}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-600 dark:text-gray-300">
                                            {assignment.created_at ? new Date(assignment.created_at).toLocaleDateString('zh-CN') : '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm">
                                            {assignment.deadline ? new Date(assignment.deadline).toLocaleDateString('zh-CN') : '-'}
                                            <span className="ml-1">({getDueDateStatus(assignment.deadline)})</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            {getStatusBadge(assignment.status)}
                                            {assignment.status === "graded" && assignment.score !== undefined && <></>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {assignment.status === "pending" && <button
                                            onClick={() => handleSubmitAssignment(assignment.id)}
                                            disabled={isAssignmentExpired(assignment.deadline)}
                                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isAssignmentExpired(assignment.deadline) ? "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-700 text-white"}`}>
                                            {isAssignmentExpired(assignment.deadline) ? "已过期" : "提交作业"}
                                        </button>}
                                        {assignment.status === "submitted" && <span className="text-gray-500 dark:text-gray-400">等待批改</span>}
                                        {assignment.status === "graded" && <button
                                            onClick={() => navigate(`/student/assignments/detail/${assignment.id}`)}
                                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center">
                                            <i className="fa-solid fa-eye mr-1"></i>
                                            <span>查看详情</span>
                                        </button>}
                                    </td>
                                </tr>)}
                            </tbody>
                        </table>
                    </div>
                    {}
                    <div
                        className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <div className="text-sm text-gray-600 dark:text-gray-400">显示 <span className="font-medium">1</span>到 <span className="font-medium">{filteredAssignments.length}</span>条，共 <span className="font-medium">{assignments.length}</span>条记录
                                          </div>
                        <div className="flex space-x-1">
                            <button
                                className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled>
                                <i className="fa-solid fa-chevron-left text-xs"></i>
                            </button>
                            <button
                                className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-md bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/50">1
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
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">未找到匹配的作业</h3>
                        <p className="text-gray-500 dark:text-gray-400">请尝试调整搜索条件或关键词</p>
                        <button
                            onClick={() => setSearchTerm("")}
                            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors">清除搜索条件
                                          </button>
                    </div>
                </div>}
            </main>
            {}
            <footer
                className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6 mt-12">
                <div
                    className="container mx-auto px-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                    <p>© 2025 智慧教辅系统 - 学生后台</p>
                </div>
            </footer>
        </div>
    );
}