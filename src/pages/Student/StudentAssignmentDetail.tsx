import { useContext, useState, useEffect } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
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
  studentAttachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
  }[];
  gradedAttachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
  }[];
  comment?: string;
  gradedBy?: string;
  gradedAt?: string;
}

const getAssignmentById = (id: number): Assignment => {
    const assignments: Assignment[] = [{
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
    }],
    studentAttachments: [{
      id: "student-att1-1",
      name: "数学作业解答.jpg",
      url: "https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=Student%20Math%20Homework%20Solution&sign=ce15ee153eb33c9f4f1b3a284a8cd216",
      type: "image"
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
        comment: "整体表现良好，对元素周期表的基本结构掌握扎实，但在一些细节问题上还需要加强。建议多做一些相关练习，巩固对元素性质周期性变化规律的理解。继续加油！",
        gradedBy: "王老师",
        gradedAt: "2025-09-10 15:30:00",

    attachments: [{
      id: "att4",
      name: "元素周期表高清版.jpg",
      url: "https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=Periodic%20Table%20of%20Elements&sign=bc1caba46953572608abb21569bc7152",
      type: "image"
    }],
    studentAttachments: [{
      id: "student-att4-1",
      name: "元素周期表练习题.jpg",
      url: "https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=Student%20Chemistry%20Homework%20on%20Periodic%20Table&sign=f0507c32f98f23e24bbf44901baa510b",
      type: "image"
    }],

    gradedAttachments: [{
      id: "graded1",
      name: "批改版元素周期表练习.jpg",
      url: "https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=Graded%20Chemistry%20Periodic%20Table%20Exercise%20with%20Teacher%20Markings&sign=f48c4296ab34938c7dfe379966a65455",
      type: "image"
    }, {
            id: "graded2",
            name: "知识点补充.png",
            url: "https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=Chemistry%20Study%20Notes%20with%20Teacher%20Supplement&sign=05357b0b538528a4c4ccd712571aa514",
            type: "image"
        }]
    }, {
        id: 5,
        name: "历史事件时间轴制作",
        subject: "历史",
        assignedDate: "2025-09-06",
        dueDate: "2025-09-20",
        description: "学生需要收集指定历史时期的重要事件资料，制作详细的时间轴，梳理历史发展脉络，培养历史思维能力。",
        status: "graded",
        score: 92,
        comment: "时间轴制作非常精美，事件排列顺序正确，重点突出。能够很好地展示历史发展的脉络，体现了对历史知识的深入理解。继续保持！",
        gradedBy: "李老师",
        gradedAt: "2025-09-12 10:15:00",

    studentAttachments: [{
      id: "student-att5-1",
      name: "历史事件时间轴.jpg",
      url: "https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=Student%20History%20Timeline%20Project&sign=8153dfdab1cfbe6db6e97be404bab1a0",
      type: "image"
    }],
    gradedAttachments: [{
      id: "graded3",
      name: "批改后的历史时间轴.jpg",
      url: "https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=Graded%20History%20Timeline%20with%20Teacher%20Feedback&sign=ec7e1d540a025ade2c83d7ccf2dfb50a",
      type: "image"
    }]
    }];

    return assignments.find(a => a.id === id) || assignments[0];
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

export default function StudentAssignmentDetail() {
    const {
        user,
        logout
    } = useContext(AuthContext);

    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const statusFromUrl = searchParams.get("status") || "graded";
    const navigate = useNavigate();
    const params = useParams();
    const assignmentId = parseInt(String(params.id), 10) || 1;
    const [isLoading, setIsLoading] = useState(true);
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [showAttachmentPreview, setShowAttachmentPreview] = useState(false);
    const [selectedAttachment, setSelectedAttachment] = useState<any>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            let assignmentData = getAssignmentById(assignmentId);
      assignmentData.status = "graded";

      if (assignmentData.id >= 100) {
        assignmentData.score = Math.floor(Math.random() * 21) + 80;
        assignmentData.comment = "整体表现良好，知识点掌握扎实，但在一些细节问题上还需要加强。建议多做一些相关练习，巩固对知识点的理解和应用能力。继续加油！";
        assignmentData.gradedBy = "张老师";
        assignmentData.gradedAt = "2025-09-09 15:30:00";

        // 添加学生上传的附件
        assignmentData.studentAttachments = [{
          id: "student-att-" + assignmentData.id,
          name: "学生作业解答.jpg",
          url: "https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=Student%20Homework%20Solution%20Sheet&sign=54373ed18bfc5abd0ceb9b50c0ac4ec2",
          type: "image"
        }];

        assignmentData.gradedAttachments = [{
          id: "graded1",
          name: "批改版作业.jpg",
          url: "https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=Graded%20Homework%20with%20Teacher%20Markings&sign=066095feabb64e289d12bed8acf69e22",
          type: "image"
        }];
      }

            setAssignment(assignmentData);
            setIsLoading(false);
        }, 800);

        return () => clearTimeout(timer);
    }, [assignmentId]);

    useEffect(() => {
        if (user && user.role !== "student") {
            navigate("/");
        }
    }, [user, navigate]);

    const handleViewAttachment = (attachment: any) => {
        setSelectedAttachment(attachment);
        setShowAttachmentPreview(true);
    };

    const handleCloseAttachmentPreview = () => {
        setShowAttachmentPreview(false);
        setSelectedAttachment(null);
    };

    const renderAttachmentPreview = () => {
        if (!selectedAttachment)
            return null;

        const {
            name,
            url,
            type
        } = selectedAttachment;

        return (
            <div
                className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                <div
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                    <div
                        className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{name}</h3>
                        <button
                            onClick={handleCloseAttachmentPreview}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                            <i className="fa-solid fa-times text-xl"></i>
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto p-4">
                        <div className="flex justify-center items-center min-h-[60vh]">
                            {type === "pdf" ? <div
                                className="bg-gray-100 dark:bg-gray-700 p-8 rounded-lg max-w-full max-h-[60vh] flex flex-col items-center justify-center">
                                <i className="fa-solid fa-file-pdf text-red-500 text-6xl mb-4"></i>
                                <p className="text-center text-gray-700 dark:text-gray-300 mb-2">{name}</p>
                                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">PDF文件预览</p>
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center">
                                    <i className="fa-solid fa-download mr-2"></i>
                                    <span>下载文件</span>
                                </a>
                            </div> : type === "image" ? <img
                                src={url}
                                alt={name}
                                className="max-h-full max-w-full object-contain rounded-lg shadow-lg" /> : <div
                                className="bg-gray-100 dark:bg-gray-700 p-8 rounded-lg max-w-full max-h-[60vh] flex flex-col items-center justify-center">
                                <i className="fa-solid fa-file-video text-blue-500 text-6xl mb-4"></i>
                                <p className="text-center text-gray-700 dark:text-gray-300 mb-2">{name}</p>
                                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">视频文件预览</p>
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center">
                                    <i className="fa-solid fa-download mr-2"></i>
                                    <span>下载文件</span>
                                </a>
                            </div>}
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
                <div className="mb-6 flex items-center">
                    <button
                        onClick={() => navigate("/student/assignments")}
                        className="text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 mr-3">
                        <i className="fa-solid fa-arrow-left text-lg"></i>
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">作业详情</h2>
                        <p className="text-gray-600 dark:text-gray-400">查看已批改作业详情</p>
                    </div>
                </div>
                {}
                {isLoading ? <div className="flex flex-col items-center justify-center min-h-[50vh]">
                    <div
                        className="w-12 h-12 border-t-2 border-b-2 border-orange-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">加载作业数据中...</p>
                </div> : assignment ? <div className="space-y-6">
                    {}
                    <div
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                        <div className="mb-6">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{assignment.name}</h3>
                            <div className="flex items-center mt-2 space-x-4">
                                <span
                                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium">
                                    {assignment.subject}
                                </span>
                                {assignment.status === "graded" && assignment.score !== undefined && <></>}
                                <span
                                    className={`px-3 py-1 rounded-full text-sm font-medium ${isAssignmentExpired(assignment.dueDate) ? "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400" : "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400"}`}>截止日期：{assignment.dueDate}({getDueDateStatus(assignment.dueDate)})
                                                                                                                                                                                                                                                                                                                 </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-center">
                                <div
                                    className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mr-4">
                                    <i
                                        className="fa-solid fa-calendar-plus text-blue-600 dark:text-blue-400 text-xl"></i>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">布置日期</p>
                                    <p className="text-base font-medium text-gray-900 dark:text-white">{assignment.assignedDate}</p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <div
                                    className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mr-4">
                                    <i
                                        className="fa-solid fa-clipboard-check text-purple-600 dark:text-purple-400 text-xl"></i>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">作业状态</p>
                                    <div className="flex items-center">
                                        {getStatusBadge(assignment.status)}
                                        {assignment.status === "graded" && assignment.score !== undefined && <></>}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {}
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">作业描述</h3>
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                                <p className="text-gray-600 dark:text-gray-300">{assignment.description}</p>
                            </div>
                        </div>
                        {}
                        {assignment.attachments && assignment.attachments.length > 0 && <div className="mt-6">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">参考附件</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {assignment.attachments.map(attachment => <div
                                    key={attachment.id}
                                    className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    onClick={() => handleViewAttachment(attachment)}>
                                    {attachment.type === "pdf" && <i className="fa-solid fa-file-pdf text-red-500 text-lg mr-3"></i>}
                                    {attachment.type === "image" && <i className="fa-solid fa-file-image text-blue-500 text-lg mr-3"></i>}
                                    {attachment.type === "video" && <i className="fa-solid fa-file-video text-green-500 text-lg mr-3"></i>}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{attachment.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{attachment.type.toUpperCase()}</p>
                                    </div>
                                    <i className="fa-solid fa-chevron-right text-gray-400"></i>
                                </div>)}
                            </div>
                        </div>}
                    </div>
                    {}
    {assignment.status === "graded" && <div
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">已批改作业详情</h3>
      {}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div
          className="flex items-center justify-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">得分</p>
            <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">{assignment.score || 92}</p>
          </div>
        </div>
        <div
          className="flex items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">批改老师</p>
            <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">{assignment.gradedBy || "张老师"}</p>
          </div>
        </div>
        <div
          className="flex items-center justify-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">批改时间</p>
            <p className="text-lg font-semibold text-green-600 dark:text-green-400">{assignment.gradedAt || "2025-09-09 15:30:00"}</p>
          </div>
        </div>
      </div>
      {}
      {assignment.comment && <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-2">老师评语</h4>
        <div
          className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border-l-4 border-purple-500 dark:border-purple-600">
          <p className="text-gray-600 dark:text-gray-300">{assignment.comment}</p>
        </div>
      </div>}
      {!assignment.comment && assignment.status === "graded" && <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-2">老师评语</h4>
        <div
          className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border-l-4 border-purple-500 dark:border-purple-600">
          <p className="text-gray-600 dark:text-gray-300">整体表现良好，知识点掌握扎实，但在一些细节问题上还需要加强。建议多做一些相关练习，巩固对知识点的理解和应用能力。继续加油！</p>
        </div>
      </div>}
      
      {/* 学生上传的作业附件 */}
      {assignment.studentAttachments && assignment.studentAttachments.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-3">我的作业附件</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {assignment.studentAttachments.map((attachment) => (
              <div 
                key={attachment.id}
                className="relative group cursor-pointer overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700"
                onClick={() => handleViewAttachment(attachment)}
              >
                {attachment.type === "image" ? (
                  <img
                    src={attachment.url}
                    alt={attachment.name}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105" 
                  />
                ) : (
                  <div className="w-full h-48 flex items-center justify-center bg-gray-200 dark:bg-gray-600">
                    <i className="fa-solid fa-file text-5xl text-gray-400"></i>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <p className="text-white font-medium truncate">{attachment.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
                    </div>}
                    {}
                    {assignment.status !== "graded" && <div
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
                        <div
                            className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                            <i
                                className={`fa-solid ${assignment.status === "pending" ? "fa-hourglass-half" : "fa-check-circle"} text-gray-400 text-2xl`}></i>
                        </div>
                        <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-1">
                            {assignment.status === "pending" ? "作业待提交" : "作业待批改"}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            {assignment.status === "pending" ? "请按时完成并提交作业" : "老师正在批改中，请耐心等待"}
                        </p>
                        {assignment.status === "pending" && <button
                            onClick={() => navigate(`/student/assignments/submit/${assignment.id}`)}
                            className="mt-4 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors">提交作业
                                                                                                                                                                                                                                                  </button>}
                    </div>}
                </div> : <div className="flex flex-col items-center justify-center min-h-[50vh]">
                    <div
                        className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                        <i className="fa-solid fa-exclamation-circle text-gray-400 text-2xl"></i>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">未找到作业详情</h3>
                    <p className="text-gray-500 dark:text-gray-400">请检查作业ID是否正确</p>
                    <button
                        onClick={() => navigate("/student/assignments")}
                        className="mt-4 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors">返回作业中心
                                                                                                                                                                                                            </button>
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
            {}
            {showAttachmentPreview && renderAttachmentPreview()}
        </div>
    );
}