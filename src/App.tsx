import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { AuthContext } from '@/contexts/authContext';
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

  // 从本地存储加载用户状态
  useEffect(() => {
    const savedUser = localStorage.getItem('smartTeachingAssistantUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // 保存用户状态到本地存储
  useEffect(() => {
    localStorage.setItem('smartTeachingAssistantUser', JSON.stringify(user));
  }, [user]);

  const login = (role, phone, name) => {
    setUser({
      isAuthenticated: true,
      role,
      phone,
      name
    });
  };

  const register = (role, phone, name, password, classId, subject) => {
    // 模拟注册成功后自动登录
    setUser({
      isAuthenticated: true,
      role,
      phone,
      name
    });
    
    // 存储密码到本地存储（实际应用中应该存储加密后的密码或令牌）
    localStorage.setItem(`user_${phone}_password`, password);
    
    // 存储用户班级和学科信息
    localStorage.setItem(`user_${phone}_class`, classId.toString());
    if (subject) {
      localStorage.setItem(`user_${phone}_subject`, subject);
    }
  };

  const logout = () => {
    setUser(mockUserData);
    localStorage.removeItem('smartTeachingAssistantUser');
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

  return (
    <AuthContext.Provider
      value={{ 
        isAuthenticated: user.isAuthenticated, 
        user,
        login, 
        logout 
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
