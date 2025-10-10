import { createContext } from "react";

// 定义用户类型
export type UserRole = 'admin' | 'teacher' | 'student' | null;

export type User = {
  isAuthenticated: boolean;
  role: UserRole;
  phone: string | null;
  name: string | null;
};

// 定义上下文类型
type AuthContextType = {
  isAuthenticated: boolean;
  user: User;
  login: (role: UserRole, phone: string, name: string) => void;
  register: (role: UserRole, phone: string, name: string, password: string, classId: number, subject?: string) => void;
  logout: () => void;
};

// 默认上下文值
const defaultContextValue: AuthContextType = {
  isAuthenticated: false,
  user: {
    isAuthenticated: false,
    role: null,
    phone: null,
    name: null
  },
  login: () => {},
  register: () => {},
  logout: () => {}
};

export const AuthContext = createContext<AuthContextType>(defaultContextValue);