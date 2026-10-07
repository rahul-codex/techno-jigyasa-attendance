import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AdminAuthState } from '../types/auth.types';
import { adminAuthApi } from '../services/adminAuth.api';
import type { AdminLoginPayload } from '../services/adminAuth.api';

interface AdminAuthContextType extends AdminAuthState {
  login: (payload: AdminLoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshAdmin: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AdminAuthState>({
    admin: null,
    role: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Verify active admin session on mount using secure httpOnly cookie
  const checkAdminSession = async () => {
    try {
      const response = await adminAuthApi.getMe();
      if (response.success && response.data?.admin) {
        setState({
          admin: response.data.admin,
          role: response.data.role,
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      }
    } catch {
      // Admin session does not exist or cookie expired
    }

    setState({
      admin: null,
      role: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  useEffect(() => {
    checkAdminSession();
  }, []);

  const login = async (payload: AdminLoginPayload) => {
    const response = await adminAuthApi.login(payload);
    if (response.success && response.data?.admin) {
      setState({
        admin: response.data.admin,
        role: response.data.role,
        isAuthenticated: true,
        isLoading: false,
      });
    }
  };

  const logout = async () => {
    try {
      await adminAuthApi.logout();
    } catch {
      // Clear client state even if network call encounters error
    } finally {
      setState({
        admin: null,
        role: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const refreshAdmin = async () => {
    await checkAdminSession();
  };

  return (
    <AdminAuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        refreshAdmin,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
