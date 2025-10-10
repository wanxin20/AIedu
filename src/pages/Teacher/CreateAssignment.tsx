import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "@/contexts/authContext";
import { toast } from "sonner";

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
            assignedDate: new Date().toISOString().split("T")[0],
            dueDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split("T")[0]
        };
    });

    const [students] = useState<Student[]>([{
        id: 1,
        name: "张三",
        studentId: "2025001"
    }, {
        id: 2,
        name: "李四",
        studentId: "2025002"
    }, {
        id: 3,
        name: "王五",
        studentId: "2025003"
    }, {
        id: 4,
        name: "赵六",
        studentId: "2025004"
    }, {
        id: 5,
        name: "孙七",
        studentId: "2025005"
    }, {
        id: 6,
        name: "周八",
        studentId: "2025006"
    }, {
        id: 7,
        name: "吴九",
        studentId: "2025007"
    }, {
        id: 8,
        name: "郑十",
        studentId: "2025008"
    }, {
        id: 9,
        name: "钱十一",
        studentId: "2025009"
    }, {
        id: 10,
        name: "孙十二",
        studentId: "2025010"
    }]);

     const [selectedStudents, setSelectedStudents] = useState(() => {
        // 检查是否有正在编辑的作业
        const editingAssignment = localStorage.getItem('editingAssignment');
        if (editingAssignment) {
            try {
                const assignment = JSON.parse(editingAssignment);
                return assignment.isAllStudents ? [] : assignment.selectedStudents || [];
            } catch (error) {
                console.error("Failed to parse editing assignment:", error);
            }
        }
        return [];
    });
    
    const [selectAllStudents, setSelectAllStudents] = useState(() => {
        // 检查是否有正在编辑的作业
        const editingAssignment = localStorage.getItem('editingAssignment');
        if (editingAssignment) {
            try {
                const assignment = JSON.parse(editingAssignment);
                return assignment.isAllStudents || false;
            } catch (error) {
                console.error("Failed to parse editing assignment:", error);
            }
        }
        return false;
    });
    
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setUploading(true);

            setTimeout(() => {
                const newFiles: UploadedFile[] = Array.from(e.target.files).map(file => ({
                    id: Date.now() + Math.random().toString(36).substr(2, 9),
                    file,
                    previewUrl: URL.createObjectURL(file),
                    type: file.type.startsWith("image/") ? "image" : "file"
                }));

                setUploadedFiles(prev => [...prev, ...newFiles]);
                setUploading(false);
                e.target.value = "";
            }, 800);
        }
    };

    const handleRemoveFile = (id: string) => {
        setUploadedFiles(prev => prev.filter(file => file.id !== id));
    };

     const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error("请输入作业名称");
            return;
        }

        if (!formData.subject) {
            toast.error("请选择所属学科");
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

        if (!selectAllStudents && selectedStudents.length === 0) {
            toast.error("请选择至少一名学生");
            return;
        }

        setIsSubmitting(true);

        setTimeout(() => {
            setIsSubmitting(false);
            
            // 从本地存储获取现有作业
            const existingAssignments = JSON.parse(localStorage.getItem('teacherAssignments') || '[]');
            
            // 创建新的已布置作业对象
            const publishedAssignment = {
                id: Date.now(),
                name: formData.name,
                description: formData.description,
                subject: subjects.find(s => s.id === formData.subject)?.name || formData.subject,
                assignedDate: formData.assignedDate,
                dueDate: formData.dueDate,
                totalStudents: selectAllStudents ? students.length : selectedStudents.length,
                completed: 0,
                pending: selectAllStudents ? students.length : selectedStudents.length,
                status: 'published', // 已发布状态
                selectedStudents: selectAllStudents ? [] : selectedStudents,
                isAllStudents: selectAllStudents
            };
            
            // 添加到现有作业数组
            const updatedAssignments = [publishedAssignment, ...existingAssignments];
            
            // 保存回本地存储
            localStorage.setItem('teacherAssignments', JSON.stringify(updatedAssignments));
            
            const targetStudents = selectAllStudents ? "所有学生" : students.filter(s => selectedStudents.includes(s.id)).map(s => s.name).join(", ");
            toast.success(`作业布置成功，已发送给 ${targetStudents}`);
            navigate("/teacher/assignments");
        }, 1500);
    };

     const handleSaveDraft = () => {
        if (!formData.name.trim()) {
            toast.error("请输入作业名称");
            return;
        }

        if (!formData.subject) {
            toast.error("请选择所属学科");
            return;
        }

        setIsSubmitting(true);

        setTimeout(() => {
            setIsSubmitting(false);
            
            // 从本地存储获取现有作业
            const existingAssignments = JSON.parse(localStorage.getItem('teacherAssignments') || '[]');
            
            // 创建新的草稿作业对象
            const draftAssignment = {
                id: Date.now(), // 使用时间戳作为临时ID
                name: formData.name,
                description: formData.description,
                subject: subjects.find(s => s.id === formData.subject)?.name || formData.subject,
                assignedDate: formData.assignedDate,
                dueDate: formData.dueDate,
                totalStudents: selectAllStudents ? students.length : selectedStudents.length,
                completed: 0,
                pending: selectAllStudents ? students.length : selectedStudents.length,
                status: 'draft', // 草稿状态
                selectedStudents: selectAllStudents ? [] : selectedStudents,
                isAllStudents: selectAllStudents
            };
            
            // 添加到现有作业数组
            const updatedAssignments = [draftAssignment, ...existingAssignments];
            
            // 保存回本地存储
            localStorage.setItem('teacherAssignments', JSON.stringify(updatedAssignments));
            
            toast.success("作业草稿保存成功");
            navigate("/teacher/assignments");
        }, 1500);
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
                            {}
                            <div>
                                <label
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">选择学生 <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div
                                        className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <i className="fa-solid fa-users text-gray-400"></i>
                                    </div>
                                    <select
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-colors cursor-pointer"
                                        value={selectAllStudents ? "all" : "select"}
                                        onChange={e => {
                                            if (e.target.value === "all") {
                                                setSelectAllStudents(true);
                                                setSelectedStudents([]);
                                            } else {
                                                setSelectAllStudents(false);
                                                setSelectedStudents(students.slice(0, 5).map(s => s.id));
                                            }
                                        }}>
                                        <option value="all">所有学生</option>
                                        <option value="select">选择部分学生</option>
                                    </select>
                                </div>
                            </div>
                            {}
                            {!selectAllStudents && <div
                                className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">已选择 {selectedStudents.length}名学生</h4>
                                    <></>
                                </div>
                                <div
                                    className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-2">
                                    {students.map(student => <label
                                        key={student.id}
                                        className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedStudents.includes(student.id)}
                                            onChange={e => {
                                                if (e.target.checked) {
                                                    setSelectedStudents(prev => [...prev, student.id]);
                                                } else {
                                                    setSelectedStudents(prev => prev.filter(id => id !== student.id));
                                                }
                                            }}
                                            className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600" />
                                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{student.name}({student.studentId})</span>
                                    </label>)}
                                </div>
                            </div>}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
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