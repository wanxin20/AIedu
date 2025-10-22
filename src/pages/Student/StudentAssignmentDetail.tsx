import { useContext, useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { AuthContext } from "@/contexts/authContext";
import { toast } from "sonner";
import { getAssignmentDetail } from "@/services/assignmentApi";
import { getSubmissionByAssignment } from "@/services/submissionApi";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

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

    const navigate = useNavigate();
    const params = useParams();
    const assignmentId = parseInt(String(params.id), 10) || 1;
    const [isLoading, setIsLoading] = useState(true);
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [showAttachmentPreview, setShowAttachmentPreview] = useState(false);
    const [selectedAttachment, setSelectedAttachment] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Markdown 渲染组件
    const MarkdownRenderer = ({ content }: { content: string }) => {
      return (
        <div className="markdown-content prose prose-sm prose-purple max-w-none dark:prose-invert
          prose-headings:font-semibold
          prose-h1:text-lg prose-h1:mb-3 prose-h1:mt-4
          prose-h2:text-base prose-h2:mb-2 prose-h2:mt-3
          prose-h3:text-sm prose-h3:mb-2 prose-h3:mt-3
          prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-2
          prose-li:text-gray-700 prose-li:leading-relaxed
          prose-ul:my-2 prose-ol:my-2
          prose-strong:text-gray-900 prose-strong:font-semibold
          prose-code:text-sm prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
          dark:prose-p:text-gray-300
          dark:prose-li:text-gray-300
          dark:prose-strong:text-white
          dark:prose-code:bg-gray-700">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeKatex]}
          >
            {content}
          </ReactMarkdown>
        </div>
      );
    };

    // 加载作业和提交数据
    useEffect(() => {
      const loadData = async () => {
        if (!assignmentId) {
          setError('缺少作业ID');
          setIsLoading(false);
          return;
        }

        try {
          setIsLoading(true);
          setError(null);

          // 并行加载作业详情和提交详情
          const [assignmentRes, submissionRes] = await Promise.all([
            getAssignmentDetail(assignmentId),
            getSubmissionByAssignment(assignmentId)
          ]);

          if (assignmentRes.code === 200 && assignmentRes.data) {
            const assignmentData = assignmentRes.data;
            
            // 处理提交数据
            let submissionData = null;
            if (submissionRes.code === 200 && submissionRes.data) {
              submissionData = submissionRes.data;
            }

            // 构建作业对象
            const assignment: Assignment = {
              id: assignmentData.id,
              name: assignmentData.title,
              subject: assignmentData.subject,
              assignedDate: new Date(assignmentData.createdAt).toLocaleDateString('zh-CN'),
              dueDate: new Date(assignmentData.deadline).toLocaleDateString('zh-CN'),
              description: assignmentData.description || '',
              status: submissionData?.status || 'pending',
              score: submissionData?.score !== null && submissionData?.score !== undefined ? submissionData.score : undefined,
              comment: submissionData?.comment || undefined,
              gradedBy: submissionData?.gradedBy ? String(submissionData.gradedBy) : undefined,
              gradedAt: submissionData?.gradedAt ? new Date(submissionData.gradedAt).toLocaleString('zh-CN') : undefined,
              attachments: assignmentData.attachments ? assignmentData.attachments.map((att: any, index: number) => {
                // 如果已经是对象格式
                if (typeof att === 'object' && att.url) {
                  return {
                    id: att.id || `att-${index}`,
                    name: att.name || att.fileName || `附件${index + 1}`,
                    url: att.url || att.fileUrl,
                    type: att.type || (att.url?.endsWith('.pdf') ? 'pdf' : 'image')
                  };
                }
                // 如果是字符串URL
                return {
                  id: `att-${index}`,
                  name: typeof att === 'string' ? att.split('/').pop() || `附件${index + 1}` : `附件${index + 1}`,
                  url: att,
                  type: typeof att === 'string' && att.endsWith('.pdf') ? 'pdf' : 'image'
                };
              }) : [],
              studentAttachments: submissionData?.attachments ? submissionData.attachments.map((att: any, index: number) => {
                // 如果已经是对象格式
                if (typeof att === 'object' && att.url) {
                  return {
                    id: att.id || `student-att-${index}`,
                    name: att.name || att.fileName || `作业${index + 1}`,
                    url: att.url || att.fileUrl,
                    type: att.type || (att.url?.endsWith('.pdf') ? 'pdf' : 'image')
                  };
                }
                // 如果是字符串URL
                return {
                  id: `student-att-${index}`,
                  name: typeof att === 'string' ? att.split('/').pop() || `作业${index + 1}` : `作业${index + 1}`,
                  url: att,
                  type: typeof att === 'string' && att.endsWith('.pdf') ? 'pdf' : 'image'
                };
              }) : [],
              gradedAttachments: [] // 批改附件可以后续添加
            };

            setAssignment(assignment);
          } else {
            setError(assignmentRes.message || '获取作业详情失败');
          }
        } catch (error) {
          console.error('加载数据失败:', error);
          setError(error instanceof Error ? error.message : '加载失败');
          toast.error('加载作业详情失败');
        } finally {
          setIsLoading(false);
        }
      };

      loadData();
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
            <div className="fixed inset-0 bg-black/70 dark:bg-black/80 flex items-center justify-center z-50 p-4" onClick={handleCloseAttachmentPreview}>
                <div
                    className="relative max-w-5xl w-full max-h-[90vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-auto"
                    onClick={e => e.stopPropagation()}>
                    <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between z-10">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white truncate flex-1">{name}</h3>
                        <button
                            onClick={handleCloseAttachmentPreview}
                            className="ml-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition">
                            <i className="fa-solid fa-times text-2xl"></i>
                        </button>
                    </div>

                    <div className="p-6">
                        {type === "image" ? (
                            <img src={url} alt={name} className="w-full h-auto rounded-lg" />
                        ) : type === "pdf" ? (
                            <iframe
                                src={url}
                                className="w-full h-[70vh] rounded-lg border border-gray-200 dark:border-gray-700"
                                title={name} />
                        ) : (
                            <p className="text-gray-600 dark:text-gray-400">不支持预览此类型的文件</p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">加载中...</p>
                </div>
            </div>
        );
    }

    if (error || !assignment) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fa-solid fa-exclamation-triangle text-red-600 dark:text-red-400 text-2xl"></i>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">加载失败</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{error || '未找到作业详情'}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                        返回
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* 顶部导航栏 */}
            <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-2">
                            <i className="fa-solid fa-graduation-cap text-purple-600 dark:text-purple-400 text-xl"></i>
                            <h1 className="text-lg font-semibold text-gray-800 dark:text-white hidden sm:block">智慧教辅系统</h1>
                        </div>

                        <div className="flex items-center space-x-4">
                            <Link to="/student/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400">
                                <i className="fa-solid fa-home text-lg"></i>
                            </Link>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600 dark:text-gray-300">{user?.name || "学生"}</span>
                                <button
                                    onClick={logout}
                                    className="text-sm text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400">
                                    <i className="fa-solid fa-sign-out-alt"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* 主内容区 */}
            <main className="container mx-auto px-4 py-6">
                {/* 返回按钮 */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition">
                        <i className="fa-solid fa-arrow-left mr-2"></i>
                        返回作业列表
                    </button>
                </div>

                {/* 作业详情卡片 */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{assignment.name}</h2>
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                                <span className="text-gray-600 dark:text-gray-400">
                                    <i className="fa-solid fa-book mr-1"></i>
                                    {assignment.subject}
                                </span>
                                <span className="text-gray-600 dark:text-gray-400">
                                    <i className="fa-solid fa-calendar mr-1"></i>
                                    布置: {assignment.assignedDate}
                                </span>
                                <span className="text-gray-600 dark:text-gray-400">
                                    <i className="fa-solid fa-clock mr-1"></i>
                                    截止: {assignment.dueDate} {getDueDateStatus(assignment.dueDate)}
                                </span>
                            </div>
                        </div>
                        <div>{getStatusBadge(assignment.status)}</div>
                    </div>

                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">作业要求</h3>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{assignment.description}</p>
                    </div>

                    {/* 作业附件 */}
                    {assignment.attachments && assignment.attachments.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">作业附件</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {assignment.attachments.map((attachment) => (
                                    <div
                                        key={attachment.id}
                                        onClick={() => handleViewAttachment(attachment)}
                                        className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-md transition cursor-pointer">
                                        <i className={`fa-solid ${attachment.type === 'pdf' ? 'fa-file-pdf text-red-500' : 'fa-file-image text-blue-500'} text-2xl mr-3`}></i>
                                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">{attachment.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 我的提交 */}
                {assignment.status !== 'pending' && assignment.studentAttachments && assignment.studentAttachments.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                            <i className="fa-solid fa-upload mr-2 text-green-600 dark:text-green-400"></i>
                            我的提交
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {assignment.studentAttachments.map((attachment) => (
                                <div
                                    key={attachment.id}
                                    onClick={() => handleViewAttachment(attachment)}
                                    className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 hover:shadow-md transition cursor-pointer">
                                    <i className={`fa-solid ${attachment.type === 'pdf' ? 'fa-file-pdf text-red-500' : 'fa-file-image text-blue-500'} text-2xl mr-3`}></i>
                                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">{attachment.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 批改结果 */}
                {assignment.status === 'graded' && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                            <i className="fa-solid fa-check-circle mr-2 text-purple-600 dark:text-purple-400"></i>
                            批改结果
                        </h3>

                        {/* 分数和批改信息 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                                <div className="text-sm text-purple-700 dark:text-purple-300 mb-1">得分</div>
                                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{assignment.score || '--'}</div>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                <div className="text-sm text-blue-700 dark:text-blue-300 mb-1">批改教师</div>
                                <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">{assignment.gradedBy || '--'}</div>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                                <div className="text-sm text-green-700 dark:text-green-300 mb-1">批改时间</div>
                                <div className="text-sm font-medium text-green-600 dark:text-green-400">{assignment.gradedAt || '--'}</div>
                            </div>
                        </div>

                        {/* 教师评语 */}
                        {assignment.comment && (
                            <div className="mb-6">
                                <h4 className="text-base font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                                    <i className="fa-solid fa-comment-dots mr-2 text-indigo-600 dark:text-indigo-400"></i>
                                    教师评语
                                </h4>
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                    <MarkdownRenderer content={assignment.comment} />
                                </div>
                            </div>
                        )}

                        {/* 批改附件 */}
                        {assignment.gradedAttachments && assignment.gradedAttachments.length > 0 && (
                            <div>
                                <h4 className="text-base font-semibold text-gray-800 dark:text-white mb-3">批改附件</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {assignment.gradedAttachments.map((attachment) => (
                                        <div
                                            key={attachment.id}
                                            onClick={() => handleViewAttachment(attachment)}
                                            className="flex items-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-md transition cursor-pointer">
                                            <i className={`fa-solid ${attachment.type === 'pdf' ? 'fa-file-pdf text-red-500' : 'fa-file-image text-blue-500'} text-2xl mr-3`}></i>
                                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">{attachment.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 提交作业按钮 */}
                {assignment.status === 'pending' && !isAssignmentExpired(assignment.dueDate) && (
                    <div className="mt-6 flex justify-center">
                        <button
                            onClick={() => navigate(`/student/assignments/submit/${assignment.id}`)}
                            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition">
                            <i className="fa-solid fa-upload mr-2"></i>
                            提交作业
                        </button>
                    </div>
                )}
            </main>

            {/* 附件预览模态框 */}
            {showAttachmentPreview && renderAttachmentPreview()}
        </div>
    );
}
