import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, RoleName } from '../types';
import { api } from '../services/api';

interface DemoAccount {
  role: RoleName;
  username: string;
  pass: string;
  label: string;
  title: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: 'INVESTIGATING_OFFICER', username: 'io_rajesh', pass: 'Officer@1234', label: 'Investigating Officer', title: 'Insp. Rajesh Kumar (CID)' },
  { role: 'POLICE_OFFICER', username: 'po_vikram', pass: 'Police@1234', label: 'Police Officer', title: 'Sub-Insp. Vikram Singh (CCIC)' },
  { role: 'PROSECUTOR', username: 'prosecutor_meera', pass: 'Legal@1234', label: 'Prosecutor', title: 'Adv. Meera Sen (DOP)' },
  { role: 'COURT_USER', username: 'judge_sharma', pass: 'Court@1234', label: 'Judge / Court', title: 'Justice K. P. Sharma (District Court)' },
  { role: 'FORENSIC_EXPERT', username: 'dr_sunita', pass: 'Forensic@1234', label: 'Forensic Expert', title: 'Dr. Sunita Rao (FSL)' },
  { role: 'AUDITOR', username: 'auditor_verma', pass: 'Audit@1234', label: 'Security Auditor', title: 'Anand Verma (CAG/Audit)' },
  { role: 'ADMIN', username: 'admin', pass: 'Admin@1234', label: 'System Admin', title: 'Vikramaditya Rathore (IT Sec)' },
];

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: RoleName) => Promise<void>;
  hasRole: (roles: RoleName | RoleName[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (api.getToken()) {
          const profile = await api.getMe();
          setUser(profile);
        }
      } catch (err) {
        api.setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (username: string, pass: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.login(username, pass);
      setUser(res.user);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.logout();
    } catch (_) {}
    setUser(null);
    setIsLoading(false);
  };

  const switchRole = async (targetRole: RoleName) => {
    const account = DEMO_ACCOUNTS.find(a => a.role === targetRole);
    if (!account) return;
    await login(account.username, account.pass);
  };

  const hasRole = (roles: RoleName | RoleName[]): boolean => {
    if (!user) return false;
    const userRoles = user.roles.map(r => r.name);
    if (Array.isArray(roles)) {
      return roles.some(r => userRoles.includes(r));
    }
    return userRoles.includes(roles);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        logout,
        switchRole,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
