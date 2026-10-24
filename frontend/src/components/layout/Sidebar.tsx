import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Upload, 
  Briefcase, 
  ShieldCheck, 
  GitCommit, 
  KeyRound, 
  History, 
  LogOut,
  Sliders,
  Bell,
  Scale
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../common/Logo';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  roles?: string[];
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Evidence Vault', path: '/documents', icon: FileText },
  { name: 'Upload Evidence', path: '/documents/upload', icon: Upload },
  { name: 'Case Management', path: '/cases', icon: Briefcase },
  { name: 'Verify Integrity', path: '/verify', icon: ShieldCheck },
  { name: 'Integrity Ledger', path: '/ledger', icon: GitCommit },
  { name: 'Access Requests', path: '/access-requests', icon: KeyRound },
  { name: 'Audit Trail', path: '/audit-trail', icon: History },
  { name: 'System Settings', path: '/settings', icon: Sliders, roles: ['ADMIN'] },
];

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const primaryRole = user?.roles[0]?.display_name || 'Authorized Personnel';

  return (
    <aside className="w-64 bg-[#3B2923] text-[#FFFDF9] flex flex-col h-screen select-none border-r border-[#4B342B]/80 flex-shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#4B342B]">
        <Logo variant="dark" size="sm" showTagline={true} />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider uppercase text-[#E5D7C8]/50">
          Core Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-[#795548] text-white shadow-sm border-l-4 border-[#B8875B]'
                    : 'text-[#E5D7C8]/80 hover:bg-[#4B342B] hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 text-[#B8875B] group-hover:text-white transition-colors" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Status Profile Card */}
      <div className="p-4 border-t border-[#4B342B] bg-[#34241F]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-[#795548] flex items-center justify-center text-white font-bold text-sm shadow-subtle border border-[#B8875B]/30">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {user?.full_name || 'Officer'}
            </p>
            <p className="text-[11px] text-[#B8875B] font-medium truncate">
              {primaryRole}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#4B342B] hover:bg-[#B84040]/80 text-[#E5D7C8] hover:text-white text-xs font-medium transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
