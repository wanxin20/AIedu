import { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "@/contexts/authContext";



const pendingAssignments = [{
    id: 1,
    subject: "数学",
    title: "函数基础练习",
    dueDate: "2023-11-20",
    status: "pending"
}, {
    id: 2,
    subject: "语文",
    title: "阅读理解训练",
    dueDate: "2023-11-21",
    status: "pending"
}, {
    id: 3,
    subject: "英语",
    title: "语法巩固练习",
    dueDate: "2023-11-22",
    status: "pending"
}];

const completedAssignments = [{
    id: 101,
    subject: "物理",
    title: "力学基础实验报告",
    dueDate: "2023-11-15",
    status: "completed",
    score: 92
}, {
    id: 102,
    subject: "数学",
    title: "三角函数练习",
    dueDate: "2023-11-12",
    status: "completed",
    score: 85
}];

const recommendedResources = [{
    id: 1,
    name: "高一数学函数知识点总结",
    type: "PDF",
    subject: "数学",
    uploader: "张老师",
    views: 128
}, {
    id: 2,
    name: "英语语法大全讲解视频",
    type: "视频",
    subject: "英语",
    uploader: "李老师",
    views: 256
}, {
    id: 3,
    name: "物理力学公式推导与应用",
    type: "PPT",
    subject: "物理",
    uploader: "王老师",
    views: 95
}];

export default function StudentDashboard() {
    const {
        user,
        logout
    } = useContext(AuthContext);

    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [question, setQuestion] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (user && user.role !== "student") {
            navigate("/");
        }
    }, [user, navigate]);

    const handleSubmitAssignment = (id: number) => {
        navigate(`/student/assignments/submit/${id}`);
    };

    const handleAskQuestion = (e: React.FormEvent) => {
        e.preventDefault();

        if (!question.trim())
            return;

        // 跳转到学习助手页面并传递问题
        navigate("/student/learning-assistant", {
            state: { question: question.trim() }
        });
    };

    return (
        <div
            className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            {}
            <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        {}
                        <div className="flex items-center space-x-2">
                            <i
                                className="fa-solid fa-graduation-cap text-orange-600 dark:text-orange-400 text-xl"></i>
                            <h1 className="text-lg font-semibold hidden sm:block">智慧教辅系统</h1>
                        </div>
                        {}
                        <nav className="hidden md:flex items-center space-x-8">
                            <Link
                                to="/student/dashboard"
                                className="text-orange-600 dark:text-orange-400 font-medium flex items-center">
                                <i className="fa-solid fa-tachometer-alt mr-1"></i>
                                <span>仪表盘</span>
                            </Link>
                            <Link
                                to="/student/assignments"
                                className="text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 flex items-center">
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
                        {}
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
                                {}
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
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">学生仪表盘</h2>
                    <p className="text-gray-600 dark:text-gray-400">学习进度与作业管理中心</p>
                </div>
                {}
                {isLoading ? <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div
                        className="w-12 h-12 border-t-2 border-b-2 border-orange-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">加载数据中...</p>
                </div> : <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {}
                   <div className="lg:col-span-1 space-y-6">
                        {}
                        <div
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-800 dark:text-white mb-6">学习助手</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">有任何学习问题，随时向助手提问</p>
                            <form onSubmit={handleAskQuestion} className="space-y-4">
                                <div>
                                    <label
                                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">你的问题
                                                            </label>
                                    <textarea
                                        value={question}
                                        onChange={e => setQuestion(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white transition-colors resize-none"
                                        rows={4}
                                        placeholder="请输入你的学习问题..."></textarea>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex space-x-2">
                                        <span
                                            className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400 rounded-full">数学
                                                                  </span>
                                        <button
                                            type="button"
                                            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
                                            <i className="fa-solid fa-times"></i>
                                        </button>
                                    </div>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm font-medium">提交问题
                                                            </button>
                                </div>
                            </form>
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">常见问题</h4>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => navigate("/student/learning-assistant", {
                                            state: { question: "如何提高数学解题能力？" }
                                        })}
                                        className="w-full text-left text-sm text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 py-1 transition-colors">
                                        <i className="fa-solid fa-angle-right mr-2 text-xs"></i>如何提高数学解题能力？
                                                            </button>
                                    <button
                                        onClick={() => navigate("/student/learning-assistant", {
                                            state: { question: "英语语法学习有什么技巧？" }
                                        })}
                                        className="w-full text-left text-sm text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 py-1 transition-colors">
                                        <i className="fa-solid fa-angle-right mr-2 text-xs"></i>英语语法学习有什么技巧？
                                                            </button>
                                    <button
                                        onClick={() => navigate("/student/learning-assistant", {
                                            state: { question: "物理公式如何灵活应用？" }
                                        })}
                                        className="w-full text-left text-sm text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 py-1 transition-colors">
                                        <i className="fa-solid fa-angle-right mr-2 text-xs"></i>物理公式如何灵活应用？
                                                            </button>
                                </div>
                            </div>
                        </div>
                        {}
                        <div
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-800 dark:text-white mb-4">推荐学习资源</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">根据你的学习情况推荐</p>
                            <div className="space-y-3">
                                {recommendedResources.slice(0, 2).map(resource => <div
                                    key={resource.id}
                                    className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                    {resource.type === "PDF" && <i className="fa-solid fa-file-pdf text-red-500 text-lg mr-3"></i>}
                                    {resource.type === "视频" && <i className="fa-solid fa-file-video text-blue-500 text-lg mr-3"></i>}
                                    {resource.type === "PPT" && <i
                                        className="fa-solid fa-file-powerpoint text-orange-600 dark:text-orange-400 text-lg mr-3"></i>}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center">
                                            <span
                                                className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-400 rounded-full mr-2">
                                                {resource.subject}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{resource.type}</span>
                                        </div>
                                        <p
                                            className="text-sm font-medium text-gray-800 dark:text-white mt-1 truncate">{resource.name}</p>
                                        <div className="flex items-center mt-1 text-xs">
                                            <span className="text-gray-500 dark:text-gray-400 mr-3">
                                                <i className="fa-solid fa-user mr-1"></i>
                                                {resource.uploader}
                                            </span>
                                            <span className="text-gray-500 dark:text-gray-400">
                                                <i className="fa-solid fa-eye mr-1"></i>
                                                {resource.views}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        className="ml-2 text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        <i className="fa-solid fa-download"></i>
                                    </button>
                                </div>)}
                            </div>
                            <Link
                                to="/student/resources"
                                className="mt-4 inline-block text-sm text-orange-600 dark:text-orange-400 hover:underline flex items-center">
                                <span>查看更多资源</span>
                                <i className="fa-solid fa-chevron-right ml-1 text-xs"></i>
                            </Link>
                        </div>
                    </div>
                    {}
                    <div className="lg:col-span-2 space-y-6">
                        {}
                        <div
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-800 dark:text-white">待完成作业</h3>
                                    <Link
                                        to="/student/assignments"
                                        className="text-orange-600 dark:text-orange-400 text-sm hover:underline flex items-center">
                                        <span>查看全部</span>
                                        <i className="fa-solid fa-chevron-right ml-1 text-xs"></i>
                                    </Link>
                                </div>
                            </div>
                            {pendingAssignments.length > 0 ? <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {pendingAssignments.map(assignment => <div
                                    key={assignment.id}
                                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center">
                                                <span
                                                    className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400 rounded-full mr-2">
                                                    {assignment.subject}
                                                </span>
                                                <span className="text-sm text-red-600 dark:text-red-400 font-medium">截止日期: {assignment.dueDate}
                                                </span>
                                            </div>
                                            <h4 className="text-base font-medium text-gray-800 dark:text-white mt-2">{assignment.title}</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">请完成本次作业并按时提交。注意作业要求，认真作答，确保答案正确完整。如有疑问可在学习助手中提问。
                                                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleSubmitAssignment(assignment.id)}
                                            className="ml-4 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm">提交作业
                                                                      </button>
                                    </div>
                                </div>)}
                            </div> : <div className="p-8 text-center">
                                <div
                                    className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                    <i className="fa-solid fa-check-circle text-gray-400 text-2xl"></i>
                                </div>
                                <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">暂无待完成作业</h4>
                                <p className="text-gray-500 dark:text-gray-400">好好休息，准备迎接新的学习任务吧！</p>
                            </div>}
                        </div>
                        {}
                        <div
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-800 dark:text-white">已完成作业</h3>
                                    <Link
                                        to="/student/assignments?status=completed"
                                        className="text-orange-600 dark:text-orange-400 text-sm hover:underline flex items-center">
                                        <span>查看全部</span>
                                        <i className="fa-solid fa-chevron-right ml-1 text-xs"></i>
                                    </Link>
                                </div>
                            </div>
                            {completedAssignments.length > 0 ? <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {completedAssignments.map(assignment => <div
                                    key={assignment.id}
                                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center">
                                                <span
                                                    className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400 rounded-full mr-2">
                                                    {assignment.subject}
                                                </span>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">提交日期: {assignment.dueDate}
                                                </span>
                                            </div>
                                            <h4 className="text-base font-medium text-gray-800 dark:text-white mt-2">{assignment.title}</h4>
                                            <div className="flex items-center mt-2">
                                                <span
                                                    className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400 rounded-full mr-3">得分: {assignment.score}
                                                </span>
                                         <button 
                                          onClick={() => navigate(`/student/assignments/detail/${assignment.id}`)}
                                          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center">
                                          <i className="fa-solid fa-eye mr-1"></i>
                                          查看详情
                                        </button>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-yellow-500">{assignment.score}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">满分: 100</div>
                                        </div>
                                    </div>
                                </div>)}
                            </div> : <div className="p-8 text-center">
                                <div
                                    className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                    <i className="fa-solid fa-file-alt text-gray-400 text-2xl"></i>
                                </div>
                                <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">暂无已完成作业</h4>
                                <p className="text-gray-500 dark:text-gray-400">完成作业后，这里将显示你的作业和得分情况</p>
                            </div>}
                        </div>
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