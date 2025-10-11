import { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "@/contexts/authContext";
import { toast } from "sonner";

interface LessonPlan {
    id: number;
    name: string;
    subject: string;
    createdAt: string;
    attachment: {
        type: "pdf";
        url: string;
        fileName: string;
    };
}

const mockLessonPlans: LessonPlan[] = [{
    id: 1,
    name: "高中数学函数概念教学方案",
    subject: "数学",
    createdAt: "2023-10-15",

    attachment: {
        type: "pdf",
        url: "https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=Math%20Function%20Lesson%20Plan%20PDF&sign=6e296363e5fda76136a22c4535f0dcda",
        fileName: "函数概念教学方案.pdf"
    }
}, {
    id: 2,
    name: "物理力学牛顿定律教学方案",
    subject: "物理",
    createdAt: "2023-10-20",

    attachment: {
        type: "pdf",
        url: "https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=Physics%20Newton%20Laws%20Lesson%20Plan%20PDF&sign=4fe59b726a24f3ee27a34cb55c270bc9",
        fileName: "牛顿定律教学方案.pdf"
    }
}, {
    id: 3,
    name: "英语阅读理解教学方案",
    subject: "英语",
    createdAt: "2023-10-22",

    attachment: {
        type: "pdf",
        url: "https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=English%20Reading%20Comprehension%20Lesson%20Plan%20PDF&sign=d7509b1de81af99e60987349bd6c70bb",
        fileName: "阅读理解教学方案.pdf"
    }
}, {
    id: 4,
    name: "历史事件时间轴教学方案",
    subject: "历史",
    createdAt: "2023-10-25",

    attachment: {
        type: "pdf",
        url: "https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=History%20Timeline%20Lesson%20Plan%20PDF&sign=49dfdce77864bea7208a57d252a8f954",
        fileName: "时间轴教学方案.pdf"
    }
}, {
    id: 5,
    name: "化学元素周期表教学方案",
    subject: "化学",
    createdAt: "2023-10-30",

    attachment: {
        type: "pdf",
        url: "https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=Chemistry%20Periodic%20Table%20Lesson%20Plan%20PDF&sign=adda0df265ab7c1d73ebe66165a357eb",
        fileName: "元素周期表教学方案.pdf"
    }
}, {
    id: 6,
    name: "地理气候类型教学方案",
    subject: "地理",
    createdAt: "2023-11-05",

    attachment: {
        type: "pdf",
        url: "https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=Geography%20Climate%20Lesson%20Plan%20PDF&sign=8e171d074534b3e01c19448531208b56",
        fileName: "气候类型教学方案.pdf"
    }
}];

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
    const [showPDFPreview, setShowPDFPreview] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<LessonPlan | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setLessonPlans(mockLessonPlans);
            setFilteredLessonPlans(mockLessonPlans);
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
            setFilteredLessonPlans(lessonPlans);
            return;
        }

        const term = searchTerm.toLowerCase();

        const results = lessonPlans.filter(
            plan => plan.name.toLowerCase().includes(term) || plan.name.toLowerCase() === term
        );

        setFilteredLessonPlans(results);
    }, [searchTerm, lessonPlans]);

    const handleGenerateLessonPlan = () => {
        navigate("/teacher/lesson-plan-generator");
    };

    const handleViewAttachment = (plan: LessonPlan) => {
        setSelectedPlan(plan);
        setShowPDFPreview(true);
    };

    const handleClosePreview = () => {
        setShowPDFPreview(false);
        setSelectedPlan(null);
    };

    const renderPDFPreview = () => {
        if (!selectedPlan)
            return null;

        return (
            <div
                className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                <div
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                    <div
                        className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{selectedPlan.name}</h3>
                        <button
                            onClick={handleClosePreview}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                            <i className="fa-solid fa-times text-xl"></i>
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto p-4">
                        <div className="flex justify-center items-center min-h-[60vh]">
                            <div
                                className="bg-gray-100 dark:bg-gray-700 p-8 rounded-lg max-w-full max-h-[60vh] flex flex-col items-center justify-center">
                                <i className="fa-solid fa-file-pdf text-red-500 text-6xl mb-4"></i>
                                <p className="text-center text-gray-700 dark:text-gray-300 mb-2">{selectedPlan.attachment.fileName}</p>
                                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">PDF文件预览</p>
                                <a
                                    href={selectedPlan.attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center">
                                    <i className="fa-solid fa-download mr-2"></i>
                                    <span>下载文件</span>
                                </a>
                            </div>
                        </div>
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
                                        }}>附件</th>
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
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{plan.name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-600 dark:text-gray-300">{plan.subject}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-600 dark:text-gray-300">{plan.createdAt}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => handleViewAttachment(plan)}
                                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-5 font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">
                                            <i className="fa-solid fa-file-pdf mr-1.5"></i>查看附件
                                                                    </button>
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
            {showPDFPreview && renderPDFPreview()}
        </div>
    );
}