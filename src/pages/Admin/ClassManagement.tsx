import { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "@/contexts/authContext";
import { toast } from "sonner";

const classData = [{
    id: 1,
    name: "高一(1)班",
    students: 45,
    teachers: 3,
    status: "active",
    createdAt: "2023-09-01",
    headTeacherId: 1
}, {
    id: 2,
    name: "高一(2)班",
    students: 42,
    teachers: 3,
    status: "active",
    createdAt: "2023-09-01",
    headTeacherId: 2
}, {
    id: 3,
    name: "高二(1)班",
    students: 48,
    teachers: 4,
    status: "active",
    createdAt: "2022-09-01",
    headTeacherId: 3
}, {
    id: 4,
    name: "高二(2)班",
    students: 40,
    teachers: 4,
    status: "active",
    createdAt: "2022-09-01",
    headTeacherId: 4
}, {
    id: 5,
    name: "高三(1)班",
    students: 38,
    teachers: 5,
    status: "active",
    createdAt: "2021-09-01",
    headTeacherId: 5
}, {
    id: 6,
    name: "高三(2)班",
    students: 36,
    teachers: 5,
    status: "archived",
    createdAt: "2021-09-01",
    headTeacherId: 1
}];

const teachersData = [{
    id: 1,
    name: "张老师"
}, {
    id: 2,
    name: "李老师"
}, {
    id: 3,
    name: "王老师"
}, {
    id: 4,
    name: "赵老师"
}, {
    id: 5,
    name: "孙老师"
}];

export default function ClassManagement() {
    const {
        user,
        logout
    } = useContext(AuthContext);

    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [classes, setClasses] = useState(classData);
    const [searchTerm, setSearchTerm] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [formData, setFormData] = useState({
        className: "",
        headTeacherId: ""
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [teachers] = useState(teachersData);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (user && user.role !== "admin") {
            navigate("/");
        }
    }, [user, navigate]);

    const handleArchiveClass = id => {
        const updatedClasses = classes.map(cls => cls.id === id ? {
            ...cls,
            status: cls.status === "active" ? "archived" : "active"
        } : cls);

        setClasses(updatedClasses);
        const updatedClass = updatedClasses.find(c => c.id === id);

        if (updatedClass) {
            const actionText = updatedClass.status === "active" ? "激活" : "归档";
            toast.success(`班级已${actionText}`);
        }
    };

    const handleCreateClass = () => {
        setShowCreateModal(true);
    };

    const handleInputChange = e => {
        const {
            name,
            value
        } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCancelCreate = () => {
        setShowCreateModal(false);

        setFormData({
            className: "",
            headTeacherId: ""
        });
    };

    const handleSaveClass = () => {
        if (!formData.className.trim()) {
            toast.error("请输入班级名称");
            return;
        }

        if (!formData.headTeacherId) {
            toast.error("请选择班主任");
            return;
        }

        setIsSubmitting(true);

        setTimeout(() => {
            const newClass = {
                id: classes.length + 1,
                name: formData.className,
                students: 0,
                teachers: 1,
                status: "active",
                createdAt: new Date().toISOString().split("T")[0],
                headTeacherId: parseInt(formData.headTeacherId)
            };

            setClasses(prev => [newClass, ...prev]);

            setFormData({
                className: "",
                headTeacherId: ""
            });

            setShowCreateModal(false);
            setIsSubmitting(false);
            toast.success("班级创建成功");
        }, 800);
    };

    const filteredClasses = classes.filter(
        cls => cls.name.toLowerCase().includes(searchTerm.toLowerCase()) || cls.status.includes(searchTerm.toLowerCase())
    );

    return (
        <div
            className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            {}
            <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-2">
                            <i
                                className="fa-solid fa-graduation-cap text-blue-600 dark:text-blue-400 text-xl"></i>
                            <h1 className="text-lg font-semibold hidden sm:block">智慧教辅系统</h1>
                        </div>
                        <nav className="hidden md:flex items-center space-x-8">
                            <Link
                                to="/admin/dashboard"
                                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center">
                                <i className="fa-solid fa-tachometer-alt mr-1"></i>
                                <span>仪表盘</span>
                            </Link>
                            <Link
                                to="/admin/classes"
                                className="text-blue-600 dark:text-blue-400 font-medium flex items-center">
                                <i className="fa-solid fa-users mr-1"></i>
                                <span>班级管理</span>
                            </Link>
                            <Link
                                to="/admin/logs"
                                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center">
                                <i className="fa-solid fa-history mr-1"></i>
                                <span>操作日志</span>
                            </Link>
                            <Link
                                to="/admin/security"
                                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center">
                                <i className="fa-solid fa-shield mr-1"></i>
                                <span>安全管理</span>
                            </Link>
                        </nav>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => toast.info("系统运行正常，无重要通知")}
                                className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                <i className="fa-solid fa-bell"></i>
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>
                            <div className="relative group">
                                <button className="flex items-center space-x-2 focus:outline-none">
                                    <div
                                        className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                        <i className="fa-solid fa-user-shield text-gray-600 dark:text-gray-300"></i>
                                    </div>
                                    <span className="hidden md:inline text-sm font-medium">{user?.name || "管理员"}</span>
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
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">班级管理</h2>
                        <p className="text-gray-600 dark:text-gray-400">管理系统中的所有班级信息</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="搜索班级..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white transition-colors" />
                            <i
                                className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                        </div>
                        <button
                            onClick={handleCreateClass}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center">
                            <i className="fa-solid fa-plus mr-2"></i>
                            <span>创建班级</span>
                        </button>
                    </div>
                </div>
                {}
                {isLoading ? <div className="flex flex-col items-center justify-center min-h-[50vh]">
                    <div
                        className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">加载班级数据中...</p>
                </div> : <div
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                        style={{
                                            fontSize: "14px"
                                        }}>班级名称</th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                        style={{
                                            fontSize: "14px"
                                        }}>班主任</th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                        style={{
                                            fontSize: "14px"
                                        }}>学生数量</th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                        style={{
                                            fontSize: "14px"
                                        }}>教师数量</th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                        style={{
                                            fontSize: "14px"
                                        }}>创建时间</th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                        style={{
                                            fontSize: "14px"
                                        }}>状态</th>
                                    <th
                                        scope="col"
                                        className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                        style={{
                                            fontSize: "14px"
                                        }}>操作</th>
                                </tr>
                            </thead>
                            <tbody
                                className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredClasses.length > 0 ? filteredClasses.map(cls => <tr
                                    key={cls.id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-800 dark:text-white">{cls.name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-600 dark:text-gray-300">
                                            {teachers.find(teacher => teacher.id === cls.headTeacherId)?.name || "未设置"}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-600 dark:text-gray-300">{cls.students}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-600 dark:text-gray-300">{cls.teachers}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-600 dark:text-gray-300">{cls.createdAt}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${cls.status === "active" ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400" : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"}`}>
                                            {cls.status === "active" ? "活跃" : "已归档"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end space-x-2">
                                            <button
                                                className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300">
                                                <i className="fa-solid fa-pen-to-square"></i>
                                            </button>
                                            <button
                                                onClick={() => handleArchiveClass(cls.id)}
                                                className={`${cls.status === "active" ? "text-amber-600 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300" : "text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"}`}>
                                                {cls.status === "active" ? <i className="fa-solid fa-box-archive"></i> : <i className="fa-solid fa-box-open"></i>}
                                            </button>
                                            <button
                                                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300">
                                                <i className="fa-solid fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>) : <tr>
                                    <td
                                        colSpan={7}
                                        className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                        <div className="flex flex-col items-center">
                                            <i className="fa-solid fa-search text-2xl mb-2"></i>
                                            <p>未找到匹配的班级</p>
                                        </div>
                                    </td>
                                </tr>}
                            </tbody>
                        </table>
                    </div>
                    {}
                    {filteredClasses.length > 0 && <div
                        className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <div className="text-sm text-gray-600 dark:text-gray-400">显示 <span className="font-medium">1</span>到 <span className="font-medium">{filteredClasses.length}</span>条，共 <span className="font-medium">{classes.length}</span>条记录
                                            </div>
                        <div className="flex space-x-1">
                            <button
                                className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled>
                                <i className="fa-solid fa-chevron-left text-xs"></i>
                            </button>
                            <button
                                className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50">1
                                                  </button>
                            <button
                                className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled>
                                <i className="fa-solid fa-chevron-right text-xs"></i>
                            </button>
                        </div>
                    </div>}
                </div>}
            </main>
            {}
            {showCreateModal && <div
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md transform transition-all animate-in fade-in zoom-in-95 duration-300">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">创建班级</h3>
                    </div>
                    <div className="p-6 space-y-5">
                        {}
                        <div>
                            <label
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">班级名称 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="className"
                                value={formData.className}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                                placeholder="请输入班级名称，如：高一(1)班" />
                        </div>
                        {}
                        <div>
                            <label
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">班主任 <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    name="headTeacherId"
                                    value={formData.headTeacherId}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors appearance-none">
                                    <option value="">请选择班主任</option>
                                    {teachers.map(teacher => <option key={teacher.id} value={teacher.id}>
                                        {teacher.name}
                                    </option>)}
                                </select>
                                <div
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <i className="fa-solid fa-chevron-down text-gray-400"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div
                        className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={handleCancelCreate}
                            disabled={isSubmitting}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors">取消
                                          </button>
                        <button
                            type="button"
                            onClick={handleSaveClass}
                            disabled={isSubmitting}
                            className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors">
                            {isSubmitting ? <>
                                <i className="fa-solid fa-spinner fa-spin mr-2"></i>保存中...
                                                  </> : "保存"}
                        </button>
                    </div>
                </div>
            </div>}
            {}
            <footer
                className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6 mt-12">
                <div
                    className="container mx-auto px-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                    <p>© 2025 智慧教辅系统 - 管理员后台</p>
                </div>
            </footer>
        </div>
    );
}