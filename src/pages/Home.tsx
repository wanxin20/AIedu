import { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "@/contexts/authContext";

export default function Home() {
    const {
        isAuthenticated,
        user,
        logout
    } = useContext(AuthContext);

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            {}
            <header
                className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <i
                            className="fa-solid fa-graduation-cap text-blue-600 dark:text-blue-400 text-2xl"></i>
                        <h1
                            className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">智慧教辅系统</h1>
                    </div>
                    <nav className="flex items-center space-x-6">
                        {isAuthenticated ? <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                {user.role === "admin" && "管理员"}
                                {user.role === "teacher" && "教师"}
                                {user.role === "student" && "学生"}: {user.name || user.phone}
                            </span>
                            <Link
                                to={user.role === "admin" ? "/admin/dashboard" : user.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard"}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">进入系统
                                                </Link>
                            <button
                                onClick={logout}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                <i className="fa-solid fa-sign-out-alt"></i>
                            </button>
                        </div> : <Link
                            to="/login"
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">登录
                                          </Link>}
                    </nav>
                </div>
            </header>
            {}
            <section className="container mx-auto px-4 py-16 md:py-24">
                <div className="max-w-4xl mx-auto text-center">
                    <h2
                        className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">智慧教辅，赋能教育新未来
                                  </h2>
                    <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-10">一站式教学辅助平台，打造高效、智能的教学体验</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link
                            to={isAuthenticated ? (user.role === "admin" ? "/admin/dashboard" : user.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard") : "/login"}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">立即开始 <i className="fa-solid fa-arrow-right ml-2"></i>
                        </Link>
                        <Link
                            to="/other"
                            className="px-6 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg transition-all transform hover:scale-105 shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-700">了解更多 <i className="fa-solid fa-info-circle ml-2"></i>
                        </Link>
                    </div>
                </div>
            </section>
            <section className="py-16 bg-white dark:bg-gray-900">
                <div className="container mx-auto px-4">
                    <h2
                        className="text-3xl font-bold text-center mb-16 text-gray-800 dark:text-white">专为教育工作者和学习者设计
                                  </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {}
                        <div
                            className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-purple-100 dark:border-purple-800/50">
                            <div
                                className="w-14 h-14 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mb-6">
                                <i
                                    className="fa-solid fa-user-shield text-purple-600 dark:text-purple-400 text-2xl"></i>
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">管理员模块</h3>
                            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                                <li className="flex items-start">
                                    <i className="fa-solid fa-check-circle text-purple-500 mt-1 mr-2"></i>
                                    <span>系统数据可视化仪表盘</span>
                                </li>
                                <li className="flex items-start">
                                    <i className="fa-solid fa-check-circle text-purple-500 mt-1 mr-2"></i>
                                    <span>班级全生命周期管理</span>
                                </li>
                                <li className="flex items-start">
                                    <i className="fa-solid fa-check-circle text-purple-500 mt-1 mr-2"></i>
                                    <span>操作日志记录与导出</span>
                                </li>
                                <li className="flex items-start">
                                    <i className="fa-solid fa-check-circle text-purple-500 mt-1 mr-2"></i>
                                    <span>安全管理与密码策略</span>
                                </li>
                            </ul>
                        </div>
                        {}
                        <div
                            className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-green-100 dark:border-green-800/50">
                            <div
                                className="w-14 h-14 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mb-6">
                                <i
                                    className="fa-solid fa-chalkboard-user text-green-600 dark:text-green-400 text-2xl"></i>
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">教师模块</h3>
                            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                                <li className="flex items-start">
                                    <i className="fa-solid fa-check-circle text-green-500 mt-1 mr-2"></i>
                                    <span>多类型教学资源管理</span>
                                </li>
                                <li className="flex items-start">
                                    <i className="fa-solid fa-check-circle text-green-500 mt-1 mr-2"></i>
                                    <span>智能教案生成与PPT导出</span>
                                </li>
                                <li className="flex items-start">
                                    <i className="fa-solid fa-check-circle text-green-500 mt-1 mr-2"></i>
                                    <span>作业自动生成与布置</span>
                                </li>
                                <li className="flex items-start">
                                    <i className="fa-solid fa-check-circle text-green-500 mt-1 mr-2"></i>
                                    <span>一键智能作业批改</span>
                                </li>
                            </ul>
                        </div>
                        {}
                        <div
                            className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-orange-100 dark:border-orange-800/50">
                            <div
                                className="w-14 h-14 bg-orange-100 dark:bg-orange-900/50 rounded-full flex items-center justify-center mb-6">
                                <i
                                    className="fa-solid fa-user-graduate text-orange-600 dark:text-orange-400 text-2xl"></i>
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">学生模块</h3>
                            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                                <li className="flex items-start">
                                    <i className="fa-solid fa-check-circle text-orange-500 mt-1 mr-2"></i>
                                    <span>个性化学习仪表盘</span>
                                </li>
                                <li className="flex items-start">
                                    <i className="fa-solid fa-check-circle text-orange-500 mt-1 mr-2"></i>
                                    <span>便捷作业提交系统</span>
                                </li>
                                <li className="flex items-start">
                                    <i className="fa-solid fa-check-circle text-orange-500 mt-1 mr-2"></i>
                                    <span>学习进度追踪与反馈</span>
                                </li>
                                <li className="flex items-start">
                                    <i className="fa-solid fa-check-circle text-orange-500 mt-1 mr-2"></i>
                                    <span>智能学习问答助手</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>
            {}
            <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-6">开始您的智慧教学之旅</h2>
                    <p className="max-w-2xl mx-auto mb-8 text-blue-100">根据您的角色选择相应入口，体验智能教辅系统带来的全新教学体验
                                  </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link
                            to="/login"
                            className="px-6 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors shadow-lg transform hover:scale-105 duration-300">立即登录 <i className="fa-solid fa-arrow-right ml-2"></i>
                        </Link>
                    </div>
                </div>
            </section>
            {}
            <footer className="bg-gray-100 dark:bg-gray-900 py-8">
                <div
                    className="container mx-auto px-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                    <p>© 2025 智慧教辅系统 - 赋能教育，智享未来</p>
                </div>
            </footer>
        </div>
    );
}