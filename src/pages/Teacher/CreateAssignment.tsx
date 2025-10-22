import { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "@/contexts/authContext";
import { toast } from "sonner";
import { createAssignment, publishAssignment } from "@/services/assignmentApi";
import { getActiveClasses } from "@/services/classApi";
import { uploadFile } from "@/services/uploadApi";

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

interface UploadedFile {
    id: string;
    file: File;
    previewUrl: string;
    type: string;
}

interface Student {
    id: number;
    name: string;
    studentId: string;
}

export default function CreateAssignment() {
    const {
        user,
        logout
    } = useContext(AuthContext);

    const navigate = useNavigate();

     const [formData, setFormData] = useState(() => {
        // 检查是否有正在编辑的作业
        const editingAssignment = localStorage.getItem('editingAssignment');
        if (editingAssignment) {
            try {
                const assignment = JSON.parse(editingAssignment);
                // 清除编辑状态
                localStorage.removeItem('editingAssignment');
                // 返回作业数据填充表单
                return {
                    name: assignment.name || "",
                    description: assignment.description || "",
                    subject: subjects.find(s => s.name === assignment.subject)?.id || "",
                    classId: "",
                    totalScore: 100,
                    assignedDate: assignment.assignedDate || new Date().toISOString().split("T")[0],
                    dueDate: assignment.dueDate || new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split("T")[0]
                };
            } catch (error) {
                console.error("Failed to parse editing assignment:", error);
            }
        }
        // 默认表单数据
        return {
            name: "",
            description: "",
            subject: "",
            classId: "",
            totalScore: 100,
            assignedDate: new Date().toISOString().split("T")[0],
            dueDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split("T")[0]
        };
    });
    
    const [classList, setClassList] = useState<{ id: number; name: string }[]>([]);
    
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // 加载班级列表
    useEffect(() => {
        const loadClasses = async () => {
            try {
                const classes = await getActiveClasses();
                setClassList(classes);
                // 如果只有一个班级，自动选中
                if (classes.length === 1) {
                    setFormData(prev => ({ ...prev, classId: classes[0].id.toString() }));
                }
            } catch (error) {
                console.error('加载班级列表失败:', error);
                toast.error('加载班级列表失败');
            }
        };
        
        loadClasses();
    }, []);

    if (user && user.role !== "teacher") {
        navigate("/");
        return null;
    }

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const {
            name,
            value
        } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setUploading(true);

            try {
                const newFiles: UploadedFile[] = Array.from(e.target.files!).map(file => ({
                    id: Date.now() + Math.random().toString(36).substr(2, 9),
                    file,
                    previewUrl: URL.createObjectURL(file),
                    type: file.type.startsWith("image/") ? "image" : "file"
                }));

                setUploadedFiles(prev => [...prev, ...newFiles]);
                toast.success('文件添加成功');
            } catch (error) {
                console.error('文件添加失败:', error);
                toast.error('文件添加失败');
            } finally {
                setUploading(false);
                e.target.value = "";
            }
        }
    };

    const handleRemoveFile = (id: string) => {
        setUploadedFiles(prev => prev.filter(file => file.id !== id));
    };

     const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error("请输入作业名称");
            return;
        }

        if (!formData.subject) {
            toast.error("请选择所属学科");
            return;
        }
        
        if (!formData.classId) {
            toast.error("请选择班级");
            return;
        }

        if (!formData.dueDate) {
            toast.error("请选择截止日期");
            return;
        }

        if (new Date(formData.dueDate) <= new Date(formData.assignedDate)) {
            toast.error("截止日期必须晚于布置日期");
            return;
        }

        setIsSubmitting(true);

        try {
            // 1. 上传附件
            let attachments: any[] = [];
            if (uploadedFiles.length > 0) {
                toast.info('正在上传附件...');
                const uploadPromises = uploadedFiles.map(file => 
                    uploadFile(file.file, 'assignment')
                );
                const uploadResults = await Promise.all(uploadPromises);
                attachments = uploadResults.map((result, index) => ({
                    name: uploadedFiles[index].file.name,
                    url: result.data.url,
                    type: uploadedFiles[index].type,
                    size: uploadedFiles[index].file.size
                }));
            }
            
            // 2. 创建作业
            const response = await createAssignment({
                title: formData.name,
                description: formData.description,
                subject: subjects.find(s => s.id === formData.subject)?.name || formData.subject,
                classId: parseInt(formData.classId),
                deadline: formData.dueDate,
                totalScore: formData.totalScore,
                attachments
            });
            
            // 3. 发布作业
            await publishAssignment(response.data.id);
            
            toast.success('作业布置成功');
            navigate("/teacher/assignments");
        } catch (error: any) {
            console.error('布置作业失败:', error);
            toast.error('布置作业失败: ' + (error.message || '未知错误'));
        } finally {
            setIsSubmitting(false);
        }
    };

     const handleSaveDraft = async () => {
        if (!formData.name.trim()) {
            toast.error("请输入作业名称");
            return;
        }

        if (!formData.subject) {
            toast.error("请选择所属学科");
            return;
        }
        
        if (!formData.classId) {
            toast.error("请选择班级");
            return;
        }

        setIsSubmitting(true);

        try {
            // 1. 上传附件（如果有）
            let attachments: any[] = [];
            if (uploadedFiles.length > 0) {
                toast.info('正在上传附件...');
                const uploadPromises = uploadedFiles.map(file => 
                    uploadFile(file.file, 'assignment')
                );
                const uploadResults = await Promise.all(uploadPromises);
                attachments = uploadResults.map((result, index) => ({
                    name: uploadedFiles[index].file.name,
                    url: result.data.url,
                    type: uploadedFiles[index].type,
                    size: uploadedFiles[index].file.size
                }));
            }
            
            // 2. 创建作业草稿（不发布）
            await createAssignment({
                title: formData.name,
                description: formData.description,
                subject: subjects.find(s => s.id === formData.subject)?.name || formData.subject,
                classId: parseInt(formData.classId),
                deadline: formData.dueDate,
                totalScore: formData.totalScore,
                attachments
            });
            
            toast.success("作业草稿保存成功");
            navigate("/teacher/assignments");
        } catch (error: any) {
            console.error('保存草稿失败:', error);
            toast.error('保存草稿失败: ' + (error.message || '未知错误'));
        } finally {
            setIsSubmitting(false);
        }
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
                <div className="mb-6">
                 <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  {localStorage.getItem('editingAssignment') ? '编辑作业' : '布置作业'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {localStorage.getItem('editingAssignment') ? '编辑现有作业内容' : '创建并发布新的学生作业'}
                </p>
                </div>
                {}
                <div
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-6">
                    <div className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {}
                            <div>
                                <label
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">作业名称 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-colors"
                                    placeholder="请输入作业名称"
                                    maxLength={100} />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">最多100个字符
                                                                                                                                                                </p>
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
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">选择班级 <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div
                                        className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <i className="fa-solid fa-users text-gray-400"></i>
                                    </div>
                                    <select
                                        name="classId"
                                        value={formData.classId}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-colors cursor-pointer">
                                        <option value="">请选择班级</option>
                                        {classList.map(cls => <option key={cls.id} value={cls.id}>
                                            {cls.name}
                                        </option>)}
                                    </select>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    作业将布置给该班级的所有学生
                                </p>
                            </div>
                            {}
                            <div>
                                <label
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">总分
                                </label>
                                <input
                                    type="number"
                                    name="totalScore"
                                    value={formData.totalScore}
                                    onChange={handleInputChange}
                                    min="1"
                                    max="1000"
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-colors"
                                    placeholder="请输入作业总分" />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">默认100分
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label
                                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">布置日期 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="assignedDate"
                                        value={formData.assignedDate}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-colors"
                                        min={new Date().toISOString().split("T")[0]} />
                                </div>
                                <div>
                                    <label
                                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">截止日期 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="dueDate"
                                        value={formData.dueDate}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-colors"
                                        min={new Date().toISOString().split("T")[0]} />
                                </div>
                            </div>
                            {}
                            <div>
                                <label
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">作业描述
                                                                                                                                                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-colors resize-none"
                                    placeholder="请输入作业详细描述、要求和说明..."
                                    rows={6}
                                    maxLength={2000} />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">最多2000个字符
                                                                                                                                                                </p>
                            </div>
                            {}
                            <div>
                                <label
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">参考附件
                                                                                                                                                                </label>
                                <div
                                    className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg hover:border-green-500 dark:hover:border-green-500 transition-colors">
                                    <div className="space-y-1 text-center">
                                        <i className="fa-solid fa-cloud-arrow-up text-3xl text-gray-400 mb-2"></i>
                                        <div className="flex justify-center items-center text-sm text-gray-600 dark:text-gray-400">
                                            <label
                                                htmlFor="file-upload"
                                                className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300 focus-within:outline-none">
                                                <span>上传附件</span>
                                                <input
                                                    id="file-upload"
                                                    name="file-upload"
                                                    type="file"
                                                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                                                    multiple
                                                    className="sr-only"
                                                    onChange={handleFileUpload}
                                                    disabled={uploading} />
                                            </label>
                                            <p className="px-1">或拖放文件</p>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-500 text-center">支持图片、PDF、Word、Excel、PowerPoint等格式，最多上传10个文件
                                                                                                                                                                                                    </p>
                                    </div>
                                </div>
                                {}
                                {uploadedFiles.length > 0 && <div className="mt-4">
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">已上传文件 ({uploadedFiles.length}/10)
                                                                                                                                                                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                        {uploadedFiles.map(file => <div
                                            key={file.id}
                                            className="relative bg-gray-50 dark:bg-gray-700 rounded-lg p-3 flex items-center">
                                            {file.type === "image" ? <div className="w-10 h-10 rounded-md overflow-hidden mr-3">
                                                <img
                                                    src={file.previewUrl}
                                                    alt={file.file.name}
                                                    className="w-full h-full object-cover" />
                                            </div> : <div
                                                className="w-10 h-10 rounded-md bg-gray-200 dark:bg-gray-600 flex items-center justify-center mr-3">
                                                <i className="fa-solid fa-file text-gray-600 dark:text-gray-300"></i>
                                            </div>}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{file.file.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {(file.file.size / 1024).toFixed(1)}KB
                                                                                                                                                                                                                                            </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveFile(file.id)}
                                                className="ml-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400">
                                                <i className="fa-solid fa-times"></i>
                                            </button>
                                        </div>)}
                                    </div>
                                </div>}
                            </div>
                            {}
                             <div
                                className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={handleSaveDraft}
                                    disabled={isSubmitting || uploading}
                                    className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors">保存草稿
                                                            </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || uploading}
                                    className="px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors">布置作业
                                                            </button>
                            </div>
                        </form>
                    </div>
                </div>
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