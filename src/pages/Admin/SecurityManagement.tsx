import { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "@/contexts/authContext";
import { toast } from "sonner";
import { getSystemConfig, updateSystemConfig } from "@/services/systemConfigApi";
import { getUsers, resetPassword } from "@/services/userApi";

export default function SecurityManagement() {
    const {
        user,
        logout
    } = useContext(AuthContext);

    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [policy, setPolicy] = useState({
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        maxFailedAttempts: 5,
        passwordExpiryDays: 90
    });
    const [editingPolicy, setEditingPolicy] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    // 加载系统配置和用户列表
    const loadData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // 加载系统配置
            const configResponse = await getSystemConfig();
            console.log('系统配置数据:', configResponse);
            if (configResponse.data) {
                setPolicy({
                    minLength: configResponse.data.passwordMinLength || 8,
                    requireUppercase: configResponse.data.passwordRequireUppercase || false,
                    requireLowercase: configResponse.data.passwordRequireLowercase || false,
                    requireNumbers: configResponse.data.passwordRequireNumber || false,
                    requireSpecialChars: configResponse.data.passwordRequireSpecial || false,
                    maxFailedAttempts: configResponse.data.maxLoginAttempts || 5,
                    passwordExpiryDays: 90
                });
            }

            // 加载用户列表（教师和管理员）
            const usersResponse = await getUsers({ page: 1, pageSize: 100 });
            console.log('用户列表数据:', usersResponse);
            setUsers(usersResponse.data.items || []);
        } catch (err: any) {
            console.error('加载数据失败:', err);
            setError(err.message || '加载数据失败');
            toast.error('加载数据失败: ' + (err.message || '未知错误'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (user && user.role !== "admin") {
            navigate("/");
        }
    }, [user, navigate]);

    const handleSavePolicy = async () => {
        try {
            await updateSystemConfig({
                passwordMinLength: policy.minLength,
                passwordRequireUppercase: policy.requireUppercase,
                passwordRequireLowercase: policy.requireLowercase,
                passwordRequireNumber: policy.requireNumbers,
                passwordRequireSpecial: policy.requireSpecialChars,
                maxLoginAttempts: policy.maxFailedAttempts
            });
            setEditingPolicy(false);
            toast.success("密码策略已更新");
        } catch (err: any) {
            console.error('更新密码策略失败:', err);
            toast.error('更新失败: ' + (err.message || '未知错误'));
        }
    };

    const handleResetPassword = async (id: number, name: string) => {
        try {
            await resetPassword(id, '123456');
            toast.success(`${name}的密码已重置为默认密码: 123456`);
        } catch (err: any) {
            console.error('重置密码失败:', err);
            toast.error('重置失败: ' + (err.message || '未知错误'));
        }
    };

    const filteredUsers = users.filter(
        u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
             u.phone.includes(searchTerm) || 
             u.role.includes(searchTerm.toLowerCase())
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
                                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center">
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
                                className="text-blue-600 dark:text-blue-400 font-medium flex items-center">
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
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">安全管理</h2>
                        <p className="text-gray-600 dark:text-gray-400">管理系统安全设置和用户密码</p>
                    </div>
                </div>
                {}
                {isLoading ? <div className="flex flex-col items-center justify-center min-h-[50vh]">
                    <div
                        className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">加载数据中...</p>
                </div> : <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {}
                    <div
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div
                            className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-800 dark:text-white">密码策略设置</h3>
                            <button
                                onClick={() => setEditingPolicy(!editingPolicy)}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm">
                                {editingPolicy ? "取消" : "编辑"}
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">密码最小长度
                                                      </label>
                                <input
                                    type="number"
                                    value={policy.minLength}
                                    onChange={e => setPolicy({
                                        ...policy,
                                        minLength: parseInt(e.target.value)
                                    })}
                                    disabled={!editingPolicy}
                                    className={`w-full px-4 py-2 border ${editingPolicy ? "border-gray-300 dark:border-gray-700" : "border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white transition-colors`} />
                            </div>
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">密码复杂度要求
                                                      </label>
                                <div className="space-y-2">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={policy.requireUppercase}
                                            onChange={e => setPolicy({
                                                ...policy,
                                                requireUppercase: e.target.checked
                                            })}
                                            disabled={!editingPolicy}
                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600" />
                                        <label className="ml-2 text-sm text-gray-600 dark:text-gray-300">包含大写字母 (A-Z)
                                                                  </label>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={policy.requireLowercase}
                                            onChange={e => setPolicy({
                                                ...policy,
                                                requireLowercase: e.target.checked
                                            })}
                                            disabled={!editingPolicy}
                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600" />
                                        <label className="ml-2 text-sm text-gray-600 dark:text-gray-300">包含小写字母 (a-z)
                                                                  </label>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={policy.requireNumbers}
                                            onChange={e => setPolicy({
                                                ...policy,
                                                requireNumbers: e.target.checked
                                            })}
                                            disabled={!editingPolicy}
                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600" />
                                        <label className="ml-2 text-sm text-gray-600 dark:text-gray-300">包含数字 (0-9)
                                                                  </label>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={policy.requireSpecialChars}
                                            onChange={e => setPolicy({
                                                ...policy,
                                                requireSpecialChars: e.target.checked
                                            })}
                                            disabled={!editingPolicy}
                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600" />
                                        <label className="ml-2 text-sm text-gray-600 dark:text-gray-300">包含特殊字符 (!@#$%^&*)
                                                                  </label>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">最大登录失败次数
                                                      </label>
                                <input
                                    type="number"
                                    value={policy.maxFailedAttempts}
                                    onChange={e => setPolicy({
                                        ...policy,
                                        maxFailedAttempts: parseInt(e.target.value)
                                    })}
                                    disabled={!editingPolicy}
                                    className={`w-full px-4 py-2 border ${editingPolicy ? "border-gray-300 dark:border-gray-700" : "border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white transition-colors`} />
                            </div>
                            <div>
                                <label
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">密码过期天数
                                                      </label>
                                <input
                                    type="number"
                                    value={policy.passwordExpiryDays}
                                    onChange={e => setPolicy({
                                        ...policy,
                                        passwordExpiryDays: parseInt(e.target.value)
                                    })}
                                    disabled={!editingPolicy}
                                    className={`w-full px-4 py-2 border ${editingPolicy ? "border-gray-300 dark:border-gray-700" : "border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white transition-colors`} />
                            </div>
                            {editingPolicy && <div className="flex justify-end">
                                <button
                                    onClick={handleSavePolicy}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">保存策略
                                                        </button>
                            </div>}
                        </div>
                    </div>
                    {}
                    <div
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-800 dark:text-white">用户密码重置</h3>
                        </div>
                        <div className="p-6">
                            <div className="relative mb-6">
                                <input
                                    type="text"
                                    placeholder="搜索用户..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white transition-colors w-full" />
                                <i
                                    className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                                style={{
                                                    fontSize: "14px"
                                                }}>用户名</th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                                style={{
                                                    fontSize: "14px"
                                                }}>角色</th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                                style={{
                                                    fontSize: "14px"
                                                }}>手机号</th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                                style={{
                                                    fontSize: "14px"
                                                }}>最后登录</th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                                style={{
                                                    fontSize: "14px"
                                                }}>操作</th>
                                        </tr>
                                    </thead>
                                    <tbody
                                        className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {filteredUsers.length > 0 ? filteredUsers.map(u => <tr
                                            key={u.id}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-800 dark:text-white">{u.name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                                    {u.role === "admin" ? "管理员" : u.role === "teacher" ? "教师" : "学生"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600 dark:text-gray-300">{u.phone}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                                    {u.last_login_at ? new Date(u.last_login_at).toLocaleString('zh-CN') : '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleResetPassword(u.id, u.name)}
                                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300">重置密码
                                                </button>
                                            </td>
                                        </tr>) : <tr>
                                            <td
                                                colSpan={5}
                                                className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                                <div className="flex flex-col items-center">
                                                    <i className="fa-solid fa-search text-2xl mb-2"></i>
                                                    <p>未找到匹配的用户</p>
                                                </div>
                                            </td>
                                        </tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>}
            </main>
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