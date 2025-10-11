import { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "@/contexts/authContext";
import { toast } from "sonner";

interface Assignment {
    id: number;
    name: string;
    subject: string;
    assignedDate: string;
    dueDate: string;
    totalStudents: number;
    completed: number;
    pending: number;
    status: "draft" | "published";
    selectedStudents?: number[];
    isAllStudents?: boolean;
}

const mockAssignments: Assignment[] = [{
    id: 1,
    name: "高中数学函数基础练习",
    subject: "数学",
    assignedDate: "2025-09-01",
    dueDate: "2025-09-10",
    totalStudents: 45,
    completed: 38,
    pending: 7,
    status: "published"
}, {
    id: 2,
    name: "物理力学实验报告",
    subject: "物理",
    assignedDate: "2025-09-02",
    dueDate: "2025-09-12",
    totalStudents: 45,
    completed: 25,
    pending: 20,
    status: "published"
}, {
    id: 3,
    name: "英语阅读理解训练",
    subject: "英语",
    assignedDate: "2025-09-03",
    dueDate: "2025-09-15",
    totalStudents: 45,
    completed: 42,
    pending: 3,
    status: "published"
}, {
    id: 4,
    name: "化学元素周期表练习",
    subject: "化学",
    assignedDate: "2025-09-05",
    dueDate: "2025-09-18",
    totalStudents: 45,
    completed: 15,
    pending: 30,
    status: "published"
}, {
    id: 5,
    name: "历史事件时间轴制作",
    subject: "历史",
    assignedDate: "2025-09-06",
    dueDate: "2025-09-20",
    totalStudents: 45,
    completed: 10,
    pending: 35,
    status: "draft"
}, {
    id: 6,
    name: "地理气候类型分析",
    subject: "地理",
    assignedDate: "2025-09-08",
    dueDate: "2025-09-25",
    totalStudents: 45,
    completed: 5,
    pending: 40,
    status: "draft"
}];

export default function AssignmentsManagement() {
    const {
        user,
        logout
    } = useContext(AuthContext);

    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            const savedAssignments = localStorage.getItem("teacherAssignments");

            if (savedAssignments) {
                try {
                    const parsedAssignments = JSON.parse(savedAssignments);
                    setAssignments(parsedAssignments);
                    setFilteredAssignments(parsedAssignments);
                } catch (error) {
                    console.error("Failed to parse saved assignments:", error);
                    setAssignments(mockAssignments);
                    setFilteredAssignments(mockAssignments);
                }
            } else {
                setAssignments(mockAssignments);
                setFilteredAssignments(mockAssignments);
            }

            setIsLoading(false);
        }, 800);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (user && user.role !== "teacher") {
            navigate("/");
        }
    }, [user, navigate]);

    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredAssignments(assignments);
            return;
        }

        const term = searchTerm.toLowerCase();

        const results = assignments.filter(assignment => {
            const assignmentName = assignment.name.toLowerCase();
            return assignmentName === term || assignmentName.includes(term);
        });

        setFilteredAssignments(results);
    }, [searchTerm, assignments]);

    const handleCreateAssignment = () => {
        navigate("/teacher/assignments/create");
    };

    const handleEditAssignment = (assignmentId: number) => {
        const assignment = assignments.find(a => a.id === assignmentId);

        if (assignment) {
            localStorage.setItem("editingAssignment", JSON.stringify(assignment));
            navigate("/teacher/assignments/create");
        }
    };

    const handleViewDetails = (assignmentId: number) => {
        window.open(`/teacher/assignments/detail/${assignmentId}`, "_blank");
    };

    const handleViewProgress = (assignmentId: number) => {
        window.open(`/teacher/assignments/progress/${assignmentId}`, "_blank");
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
                                className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 flex items-center">
                                <i className="fa-solid fa-file-pen mr-1"></i>
                                <span>教案生成</span>
                            </Link>
                            <Link
                                to="/teacher/assignments"
                                className="text-green-600 dark:text-green-400 font-medium flex items-center">
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
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">作业管理</h2>
                        <p className="text-gray-600 dark:text-gray-400">创建、发布和管理学生作业</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleCreateAssignment}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center">
                            <i className="fa-solid fa-plus mr-2"></i>
                            <span>布置作业</span>
                        </button>
                    </div>
                </div>
                {}
                <div
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
                    <div>
                        <></>
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
                                placeholder="请输入作业名称" />
                        </div>
                    </div>
                </div>
                {}
                {isLoading ? <div className="flex flex-col items-center justify-center min-h-[50vh]">
                    <div
                        className="w-12 h-12 border-t-2 border-b-2 border-green-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">加载作业数据中...</p>
                </div> : filteredAssignments.length > 0 ? <div
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
                                        }}>作业名称</th>
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
                                        }}>布置日期</th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                                        style={{
                                            fontSize: "14px"
                                        }}>作业状态</th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                                        style={{
                                            fontSize: "14px"
                                        }}>完成情况</th>
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
                                {filteredAssignments.map((assignment, index) => <tr
                                    key={assignment.id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 dark:text-gray-100">{index + 1}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{assignment.name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-600 dark:text-gray-300">{assignment.subject}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-600 dark:text-gray-300">{assignment.assignedDate}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${assignment.status === "published" ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400" : "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-400"}`}>
                                            {assignment.status === "published" ? "已布置" : "待布置"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {assignment.status === "draft" ? <></> : <div className="w-full">
                                            <div
                                                className="w-[300px] bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 relative overflow-hidden">
                                                <div
                                                    className="bg-green-600 dark:bg-green-500 h-2.5 rounded-full transition-all flex items-center justify-center relative"
                                                    style={{
                                                        width: `${assignment.completed / assignment.totalStudents * 100}%`
                                                    }}>
                                                    <span
                                                        className="text-white text-sm font-medium whitespace-nowrap absolute left-0 right-0 text-center"
                                                        style={{
                                                            fontSize: "12px"
                                                        }}>{assignment.completed}</span>
                                                </div>
                                                {assignment.pending > 0 && <span
                                                    className="text-gray-700 dark:text-gray-300 text-sm font-medium absolute right-0 top-0 bottom-0 flex items-center justify-center pr-2"
                                                    style={{
                                                        fontSize: "12px"
                                                    }}>
                                                    {assignment.pending}
                                                </span>}
                                            </div>
                                        </div>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-2">
                                            {assignment.status === "draft" ? <button
                                                onClick={() => handleEditAssignment(assignment.id)}
                                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center mr-4">
                                                <i className="fa-solid fa-edit mr-1"></i>
                                                <span>编辑</span>
                                            </button> : <button
                                                onClick={() => navigate(`/teacher/assignments/progress/${assignment.id}`)}
                                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center">
                                                <i className="fa-solid fa-eye mr-1"></i>
                                                <span>查看详情</span>
                                            </button>}
                                        </div>
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
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">未找到匹配的作业</h3>
                        <p className="text-gray-500 dark:text-gray-400">请尝试调整搜索条件或关键词</p>
                        <button
                            onClick={() => {
                                setSearchTerm("");
                            }}
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
        </div>
    );
}