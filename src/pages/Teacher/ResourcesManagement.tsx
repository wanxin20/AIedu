import { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "@/contexts/authContext";
import { toast } from "sonner";
import { getResources, createResource } from "@/services/resourceApi";
import { uploadFile } from "@/services/uploadApi";

interface Resource {
    id: number;
    title: string;
    subject: string;
    createdAt: string;
    fileUrl: string;
    fileName: string;
    type: string;
    category?: string;
}

export default function ResourcesManagement() {
    const {
        user,
        logout
    } = useContext(AuthContext);

    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [resources, setResources] = useState<Resource[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
    const [showUploadModal, setShowUploadModal] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        subject: "", // 默认为空，用户需要选择
        category: "课件",
        file: null as File | null
    });

    const [uploading, setUploading] = useState(false);

    // 加载资源列表
    const loadResources = async () => {
        try {
            setIsLoading(true);
            const response = await getResources({ page: 1, pageSize: 100 });
            console.log('资源列表数据:', response);
            // 转换 API 返回的数据格式为组件内部使用的格式
            const mappedResources = (response.data.items || []).map((item: any) => ({
                id: item.id,
                title: item.title,
                subject: item.subject,
                createdAt: item.createdAt,
                fileUrl: item.fileUrl,
                fileName: item.fileName,
                type: item.type,
                category: item.category
            }));
            setResources(mappedResources);
            setFilteredResources(mappedResources);
        } catch (err: any) {
            console.error('加载资源列表失败:', err);
            toast.error('加载资源失败: ' + (err.message || '未知错误'));
        } finally {
            setIsLoading(false);
        }
    };

    const subjects = [{
        id: "math",
        name: "数学"
    }, {
        id: "physics",
        name: "物理"
    }, {
        id: "chemistry",
        name: "化学"
    }, {
        id: "biology",
        name: "生物"
    }, {
        id: "history",
        name: "历史"
    }, {
        id: "geography",
        name: "地理"
    }, {
        id: "politics",
        name: "政治"
    }, {
        id: "english",
        name: "英语"
    }, {
        id: "chinese",
        name: "语文"
    }];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const {
            name,
            value
        } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFormData(prev => ({
                ...prev,
                file: e.target.files![0]
            }));
        }
    };

    const handleCancel = () => {
        setShowUploadModal(false);

        setFormData({
            name: "",
            subject: "",
            category: "课件",
            file: null
        });
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.subject || !formData.file) {
            toast.error("请填写所有必填字段");
            return;
        }

        try {
            setUploading(true);

            // 1. 先上传文件
            const uploadResponse = await uploadFile(formData.file, 'resource');
            console.log('文件上传成功:', uploadResponse);

            // 2. 创建资源记录
            await createResource({
                title: formData.name,
                subject: subjects.find(s => s.id === formData.subject)?.name || formData.subject,
                category: formData.category,
                fileUrl: uploadResponse.data.url,
                fileName: formData.file.name,
                fileSize: formData.file.size,
                type: formData.file.type.startsWith('video/') ? 'video' : 
                      formData.file.type.startsWith('image/') ? 'image' : 'document'
            });

            toast.success("资源上传成功");
            setShowUploadModal(false);
            setFormData({
                name: "",
                subject: "",
                category: "课件",
                file: null
            });

            // 3. 重新加载资源列表
            await loadResources();
        } catch (err: any) {
            console.error('上传资源失败:', err);
            toast.error('上传失败: ' + (err.message || '未知错误'));
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        loadResources();
    }, []);

    useEffect(() => {
        if (user && user.role !== "teacher") {
            navigate("/");
        }
    }, [user, navigate]);

    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredResources(resources);
            return;
        }

        const term = searchTerm.toLowerCase();

        const results = resources.filter(resource => {
            const resourceName = resource.title.toLowerCase();
            return resourceName === term || resourceName.includes(term);
        });

        setFilteredResources(results);
    }, [searchTerm, resources]);

    const handleLinkAttachment = (url: string) => {
        window.open(url, "_blank");
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
                                className="text-green-600 dark:text-green-400 font-medium flex items-center">
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
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">教学资源管理</h2>
                        <p className="text-gray-600 dark:text-gray-400">管理和维护教学资源库</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center">
                            <i className="fa-solid fa-plus mr-2"></i>
                            <span>上传资源</span>
                        </button>
                    </div>
                </div>
                {}
                <div
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
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
                                    placeholder="请输入资源名称" />
                            </div>
                        </div>
                    </div>
                </div>
                {}
                {isLoading ? <div className="flex flex-col items-center justify-center min-h-[50vh]">
                    <div
                        className="w-12 h-12 border-t-2 border-b-2 border-green-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">加载资源数据中...</p>
                </div> : filteredResources.length > 0 ? <div
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
                                        }}>资源名称</th>
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
                                {filteredResources.map((resource, index) => <tr
                                    key={resource.id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 dark:text-gray-100">{index + 1}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{resource.title}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-600 dark:text-gray-300">{resource.subject}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-600 dark:text-gray-300">
                                            {resource.createdAt ? new Date(resource.createdAt).toLocaleDateString('zh-CN') : '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => handleLinkAttachment(resource.fileUrl)}
                                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-5 font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">
                                            {resource.type === "document" && <i className="fa-solid fa-file-pdf mr-1.5"></i>}
                                            {resource.type === "video" && <i className="fa-solid fa-file-video mr-1.5"></i>}
                                            {resource.type === "image" && <i className="fa-solid fa-file-image mr-1.5"></i>}
                                            {resource.type === "other" && <i className="fa-solid fa-link mr-1.5"></i>}
                                            查看附件
                                        </button>
                                    </td>
                                </tr>)}
                            </tbody>
                        </table>
                    </div>
                    {}
                    <div
                        className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <div className="text-sm text-gray-600 dark:text-gray-400">显示 <span className="font-medium">1</span>到 <span className="font-medium">{filteredResources.length}</span>条，共 <span className="font-medium">{resources.length}</span>条记录
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
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">未找到匹配的资源</h3>
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
            {showUploadModal && <div
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md transform transition-all animate-in fade-in zoom-in-95 duration-300">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">上传教学资源</h3>
                    </div>
                    <div className="p-6 space-y-5">
                        {}
                        <div>
                            <label
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">资源名称 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-colors"
                                placeholder="请输入资源名称" />
                        </div>
                        {}
                        <div>
                            <label
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">所属学科 <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="subject"
                                value={formData.subject}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-colors">
                                <option value="">请选择学科</option>
                                {subjects.map(subject => <option key={subject.id} value={subject.id}>
                                    {subject.name}
                                </option>)}
                            </select>
                        </div>
                        {}
                        <div>
                            <label
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">上传附件 <span className="text-red-500">*</span>
                            </label>
                            <div
                                className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg">
                                <div className="space-y-1 text-center">
                                    <i className="fa-solid fa-cloud-upload text-3xl text-gray-400 mb-2"></i>
                                    <div className="flex justify-center items-center text-sm text-gray-600 dark:text-gray-400">
                                        <label
                                            htmlFor="file-upload"
                                            className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300 focus-within:outline-none">
                                            <span>上传文件</span>
                                            <input
                                                id="file-upload"
                                                name="file-upload"
                                                type="file"
                                                className="sr-only"
                                                onChange={handleFileChange} />
                                        </label>
                                        <p className="px-1">或拖放文件</p>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 text-center">支持 PDF, 视频, 图片, 链接等格式
                                                                                                    </p>
                                    {formData.file && <div
                                        className="mt-3 flex items-center text-sm text-gray-900 dark:text-gray-100">
                                        <i className="fa-solid fa-file mr-2 text-gray-400"></i>
                                        <span className="truncate">{formData.file.name}</span>
                                        <button
                                            type="button"
                                            className="ml-4 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                            onClick={() => setFormData(prev => ({
                                                ...prev,
                                                file: null
                                            }))}>
                                            <i className="fa-solid fa-times"></i>
                                        </button>
                                    </div>}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div
                        className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={uploading}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50">取消
                                                                      </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={uploading}
                            className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50">
                            {uploading ? <>
                                <i className="fa-solid fa-spinner fa-spin mr-2"></i>上传中...
                                                                                  </> : "保存"}
                        </button>
                    </div>
                </div>
            </div>}
        </div>
    );
}