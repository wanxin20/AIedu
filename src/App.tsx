import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { AuthContext } from '@/contexts/authContext';
import { getCurrentUser, logout as logoutApi } from '@/services/authApi';
import { toast } from 'sonner';
import RoleSelect from "@/pages/Login/RoleSelect";
import PhoneLogin from "@/pages/Login/PhoneLogin";
import TeacherRegisterStep1 from "@/pages/Login/TeacherRegisterStep1";
import TeacherRegisterStep2 from "@/pages/Login/TeacherRegisterStep2";
import StudentRegisterStep1 from "@/pages/Login/StudentRegisterStep1";
 import StudentRegisterStep2 from "@/pages/Login/StudentRegisterStep2";
 import ForgotPassword from "@/pages/Login/ForgotPassword";
import AdminDashboard from "@/pages/Admin/Dashboard";
import TeacherDashboard from "@/pages/Teacher/Dashboard";
import ClassManagement from "@/pages/Admin/ClassManagement";
import LogsManagement from "@/pages/Admin/LogsManagement";
import SecurityManagement from "@/pages/Admin/SecurityManagement";
import ResourcesManagement from "@/pages/Teacher/ResourcesManagement";
import LessonPlansManagement from "@/pages/Teacher/LessonPlansManagement";
import LessonPlanGenerator from "@/pages/Teacher/LessonPlanGenerator";
  import AssignmentsManagement from "@/pages/Teacher/AssignmentsManagement";
  import CreateAssignment from "@/pages/Teacher/CreateAssignment";
   import AssignmentProgressDetail from "@/pages/Teacher/AssignmentProgressDetail";
   import AssignmentDetail from "@/pages/Teacher/AssignmentDetail";
import StudentDashboard from "@/pages/Student/Dashboard";
import StudentAssignments from "@/pages/Student/StudentAssignments";
import StudentAssignmentSubmit from "@/pages/Student/StudentAssignmentSubmit";
import StudentAssignmentDetail from "@/pages/Student/StudentAssignmentDetail";
import StudentResources from "@/pages/Student/StudentResources";
import StudentLearningAssistant from "@/pages/Student/StudentLearningAssistant";
import Home from "@/pages/Home";

// 模拟用户数据
const mockUserData = {
  isAuthenticated: false,
  role: null, // 'admin', 'teacher', or 'student'
  phone: null,
  name: null
};

export default function App() {
  const [user, setUser] = useState(mockUserData);
  const [isInitializing, setIsInitializing] = useState(true);

  // 应用启动时验证 token 并恢复登录状态
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (token) {
          // 有 token，验证并获取用户信息
          const response = await getCurrentUser();
          
          if (response.code === 200 && response.data) {
            // Token 有效，恢复用户状态
            const userData = {
              isAuthenticated: true,
              role: response.data.role as any,
              phone: response.data.phone,
              name: response.data.name
            };
            
            setUser(userData);
            localStorage.setItem('smartTeachingAssistantUser', JSON.stringify(userData));
          } else {
            // Token 无效，清除所有数据
            handleInvalidToken();
          }
        } else {
          // 没有 token，检查是否有旧的用户数据
          const savedUser = localStorage.getItem('smartTeachingAssistantUser');
          if (savedUser) {
            // 清除旧数据
            localStorage.removeItem('smartTeachingAssistantUser');
          }
        }
      } catch (error) {
        console.error('初始化认证失败:', error);
        // 认证失败，清除所有数据
        handleInvalidToken();
      } finally {
        setIsInitializing(false);
      }
    };
    
    initAuth();
  }, []);

  // 处理无效 token
  const handleInvalidToken = () => {
    setUser(mockUserData);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('smartTeachingAssistantUser');
  };

  // 保存用户状态到本地存储（仅在用户已认证时）
  useEffect(() => {
    if (user.isAuthenticated) {
      localStorage.setItem('smartTeachingAssistantUser', JSON.stringify(user));
    }
  }, [user]);

  const login = (role, phone, name) => {
    // 注意：实际的登录应该在 PhoneLogin 组件中调用 authApi.loginWithPassword
    // 这里只是更新上下文状态（登录成功后由 API 调用）
    const userData = {
      isAuthenticated: true,
      role,
      phone,
      name
    };
    setUser(userData);
    localStorage.setItem('smartTeachingAssistantUser', JSON.stringify(userData));
  };

  const register = (role, phone, name, password, classId, subject) => {
    // 注意：实际的注册应该在注册组件中调用 authApi.register
    // 这里只是更新上下文状态（注册成功后由 API 调用）
    const userData = {
      isAuthenticated: true,
      role,
      phone,
      name
    };
    setUser(userData);
    localStorage.setItem('smartTeachingAssistantUser', JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      // 调用后端登出接口
      await logoutApi();
    } catch (error) {
      console.error('登出失败:', error);
    } finally {
      // 无论成功失败都清除本地数据
      setUser(mockUserData);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('smartTeachingAssistantUser');
      toast.success('已退出登录');
    }
  };

  // 受保护的路由组件
  const ProtectedRoute = ({ children, requiredRole }) => {
    // 检查本地存储中的用户信息，防止在新窗口中丢失认证状态
    useEffect(() => {
      const checkLocalStorageAuth = () => {
        if (!user.isAuthenticated) {
          const savedUser = localStorage.getItem('smartTeachingAssistantUser');
          if (savedUser) {
            try {
              const parsedUser = JSON.parse(savedUser);
              if (parsedUser.isAuthenticated) {
                // 如果本地存储有认证信息但context中没有，可能是在新窗口打开的情况
                // 直接更新用户状态
                setUser(parsedUser);
              }
            } catch (error) {
              console.error("Failed to parse user data from localStorage:", error);
            }
          }
        }
      };
      
      checkLocalStorageAuth();
    }, [user.isAuthenticated]);
    
    // 标准的权限检查逻辑
    if (!user.isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    
    if (requiredRole && user.role !== requiredRole) {
      return <Navigate to="/" replace />;
    }
    
    return children;
  };

  // 应用初始化中，显示加载状态
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-t-2 border-b-2 border-green-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">正在加载...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{ 
        isAuthenticated: user.isAuthenticated, 
        user,
        login, 
        logout,
        register
      }}
    >
      <Routes>
         <Route path="/" element={<Home />} />
        <Route path="/login" element={<RoleSelect />} />
        <Route path="/login/phone" element={<PhoneLogin />} />
        {/* 注册路由 */}
        <Route path="/register/teacher/step1" element={<TeacherRegisterStep1 />} />
        <Route path="/register/teacher/step2" element={<TeacherRegisterStep2 />} />
        <Route path="/register/student/step1" element={<StudentRegisterStep1 />} />
        <Route path="/register/student/step2" element={<StudentRegisterStep2 />} />
        
        {/* 管理员路由 */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } 
         />
        <Route 
          path="/admin/classes" 
          element={
            <ProtectedRoute requiredRole="admin">
              <ClassManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/logs" 
          element={
            <ProtectedRoute requiredRole="admin">
              <LogsManagement />
            </ProtectedRoute>
          } 
        />
         <Route 
          path="/admin/security" 
          element={
            <ProtectedRoute requiredRole="admin">
              <SecurityManagement />
            </ProtectedRoute>
          } 
        />
        
        {/* 教师路由 */}
        <Route 
          path="/teacher/dashboard" 
          element={
            <ProtectedRoute requiredRole="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          } 
         />
         <Route 
           path="/teacher/resources" 
           element={
             <ProtectedRoute requiredRole="teacher">
               <ResourcesManagement />
             </ProtectedRoute>
           } 
         />
           <Route 
             path="/teacher/lesson-plans" 
             element={
               <ProtectedRoute requiredRole="teacher">
                 <LessonPlansManagement />
               </ProtectedRoute>
             } 
           />
           <Route 
             path="/teacher/lesson-plan-generator" 
             element={
               <ProtectedRoute requiredRole="teacher">
                 <LessonPlanGenerator />
               </ProtectedRoute>
             } 
           />
         
            <Route 
             path="/teacher/assignments" 
             element={
               <ProtectedRoute requiredRole="teacher">
                 <AssignmentsManagement />
               </ProtectedRoute>
             } 
            />

                <Route 
                path="/teacher/assignments/progress/:id" 
                element={
                  <ProtectedRoute requiredRole="teacher">
                     <AssignmentProgressDetail />
                   </ProtectedRoute>
                 } 
               />
               <Route 
                 path="/teacher/assignments/detail/:id" 
                 element={
                   <ProtectedRoute requiredRole="teacher">
                     <AssignmentDetail />
                   </ProtectedRoute>
                 } 
               />
               <Route 
                 path="/teacher/assignments/create" 
                 element={
                   <ProtectedRoute requiredRole="teacher">
                     <CreateAssignment />
                   </ProtectedRoute>
                 } 
               />
               <Route 
                 path="/teacher/assignments/grading" 
                 element={
                   <ProtectedRoute requiredRole="teacher">
                     <AssignmentProgressDetail />
                   </ProtectedRoute>
                 } 
               />
           {/* 学生路由 */}
         <Route 
          path="/student/dashboard" 
          element={
            <ProtectedRoute requiredRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          } 
        />
         <Route 
          path="/student/assignments" 
          element={
            <ProtectedRoute requiredRole="student">
              <StudentAssignments />
            </ProtectedRoute>
          } 
        />
         <Route 
          path="/student/resources" 
          element={
            <ProtectedRoute requiredRole="student">
              <StudentResources />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student/assignments/submit/:id" 
          element={
            <ProtectedRoute requiredRole="student">
              <StudentAssignmentSubmit />
            </ProtectedRoute>
          } 
       />
        <Route 
          path="/student/assignments/detail/:id" 
          element={
            <ProtectedRoute requiredRole="student">
              <StudentAssignmentDetail />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student/learning-assistant" 
          element={
            <ProtectedRoute requiredRole="student">
              <StudentLearningAssistant />
            </ProtectedRoute>
          } 
        />
        
         <Route path="/forgot-password" element={<ForgotPassword />} />
         <Route path="/other" element={<div className="text-center text-xl">Other Page - Coming Soon</div>} />
      </Routes>
    </AuthContext.Provider>
  );
}
