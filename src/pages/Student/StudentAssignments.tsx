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
    description: string;
    status: "pending" | "submitted" | "graded";
    score?: number;
    attachments?: {
        id: string;
        name: string;
        url: string;
        type: string;
    }[];
}

const getAssignmentsData = (): Assignment[] => {
    const currentDate = new Date();
    const tomorrow = new Date(currentDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(currentDate);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    return [{
        id: 1,
        name: "高中数学函数基础练习",
        subject: "数学",
        assignedDate: "2025-09-01",
        dueDate: "2025-09-10",
        description: "本作业涵盖函数的基本概念、性质及应用，旨在帮助学生巩固函数相关知识，提高解题能力。请完成所有习题，并提交详细的解题过程。",
        status: "pending",

        attachments: [{
            id: "att1",
            name: "函数基础知识点.pdf",
            url: "https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=Math%20Function%20Study%20Material%20PDF&sign=bc8d80ff84a40d1073c6e6278aac6c81",
            type: "pdf"
        }]
    }, {
        id: 2,
        name: "物理力学实验报告",
        subject: "物理",
        assignedDate: "2025-09-02",
        dueDate: "2025-09-12",
        description: "本次实验要求学生完成牛顿力学定律的验证实验，并提交详细的实验报告，包括实验目的、原理、步骤、数据记录与分析等内容。请按照实验指导书的要求规范撰写。",
        status: "pending",

        attachments: [{
            id: "att2",
            name: "实验指导书.pdf",
            url: "https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=Physics%20Experiment%20Guide%20PDF&sign=b68e905d7770cdd530fc66118494ab8c",
            type: "pdf"
        }]
    }, {
        id: 3,
        name: "英语阅读理解训练",
        subject: "英语",
        assignedDate: "2025-09-03",
        dueDate: "2025-09-15",
        description: "通过多篇不同题材的阅读理解文章，训练学生的阅读速度、理解能力和词汇量，提高英语综合能力。请仔细阅读文章，回答所有问题，并解释你的选择理由。",
        status: "submitted",

        attachments: [{
            id: "att3",
            name: "阅读材料集合.pdf",
            url: "https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=English%20Reading%20Materials%20PDF&sign=93010a07eb0bc912bb9446e2a9cf8149",
            type: "pdf"
        }]
    }, {
        id: 4,
        name: "化学元素周期表练习",
        subject: "化学",
        assignedDate: "2025-09-05",
        dueDate: "2025-09-18",
        description: "本作业要求学生掌握元素周期表的结构、元素性质的周期性变化规律，并能够应用这些知识解决相关问题。",
        status: "graded",
        score: 85,

        attachments: [{
            id: "att4",
            name: "元素周期表高清版.jpg",
            url: "https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=Periodic%20Table%20of%20Elements&sign=bc1caba46953572608abb21569bc7152",
            type: "image"
        }]
    }, {
        id: 5,
        name: "历史事件时间轴制作",
        subject: "历史",
        assignedDate: "2025-09-06",
        dueDate: "2025-09-20",
        description: "学生需要收集指定历史时期的重要事件资料，制作详细的时间轴，梳理历史发展脉络，培养历史思维能力。",
        status: "pending"
    }];
};

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

    useEffect(() => {
        const timer = setTimeout(() => {
            const data = getAssignmentsData();
            setAssignments(data);
            setFilteredAssignments(data);
            setIsLoading(false);
        }, 800);

        return () => clearTimeout(timer);
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
        const results = assignments.filter(assignment => assignment.name.toLowerCase().includes(term));
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

    const isAssignmentExpired = (dueDate: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return new Date(dueDate) < today;
    };

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
                                <div
                                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-50 hidden group-hover:block border border-gray-200 dark:border-gray-700">
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
                                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{assignment.name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-xs font-medium">
                                            {assignment.subject}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-600 dark:text-gray-300">{assignment.assignedDate}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm">
                                            {assignment.dueDate}
                                            <span className="ml-1">({getDueDateStatus(assignment.dueDate)})</span>
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
                                            disabled={isAssignmentExpired(assignment.dueDate)}
                                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isAssignmentExpired(assignment.dueDate) ? "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-700 text-white"}`}>
                                            {isAssignmentExpired(assignment.dueDate) ? "已过期" : "提交作业"}
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