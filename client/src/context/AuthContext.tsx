import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AuthState, StudentUser } from '../types/auth.types';
import { studentAuthApi } from '../services/auth.api';
import type { RegisterPayload, LoginPayload } from '../services/auth.api';

interface AuthContextType extends AuthState {
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<string>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserSession: (student: StudentUser, isComplete?: boolean) => void;
}

const checkCompleteness = (student: StudentUser | null): boolean => {
  if (!student) return false;
  return Boolean(
    student.name &&
    student.name.trim().length >= 2 &&
    student.department &&
    student.section &&
    student.profileImage
  );
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    isAuthenticated: false,
    isLoading: true,
    isProfileComplete: false,
  });

  // Check current session on mount via httpOnly cookie
  const checkSession = async () => {
    try {
      const response = await studentAuthApi.getMe();
      if (response.success && response.data) {
        const student = response.data.student;
        setState({
          user: student,
          role: response.data.role,
          isAuthenticated: true,
          isLoading: false,
          isProfileComplete: checkCompleteness(student),
        });
        return;
      }
    } catch {
      // User is not logged in or cookie expired
    }

    setState({
      user: null,
      role: null,
      isAuthenticated: false,
      isLoading: false,
      isProfileComplete: false,
    });
  };

  useEffect(() => {
    checkSession();
  }, []);

  const login = async (payload: LoginPayload) => {
    const response = await studentAuthApi.login(payload);
    if (response.success && response.data) {
      const student = response.data.student;
      setState({
        user: student,
        role: response.data.role,
        isAuthenticated: true,
        isLoading: false,
        isProfileComplete: checkCompleteness(student),
      });
    }
  };

  const register = async (payload: RegisterPayload): Promise<string> => {
    const response = await studentAuthApi.register(payload);
    return response.message || 'Registration successful. You can now log in.';
  };

  const logout = async () => {
    try {
      await studentAuthApi.logout();
    } catch {
      // Proceed with local state clearing even if request fails
    } finally {
      setState({
        user: null,
        role: null,
        isAuthenticated: false,
        isLoading: false,
        isProfileComplete: false,
      });
    }
  };

  const refreshUser = async () => {
    await checkSession();
  };

  const updateUserSession = (student: StudentUser, isComplete?: boolean) => {
    setState((prev) => ({
      ...prev,
      user: student,
      isProfileComplete: isComplete !== undefined ? isComplete : checkCompleteness(student),
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        refreshUser,
        updateUserSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
