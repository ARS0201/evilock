import React, { useState, useEffect } from 'react';
import { Search, Bell, Shield, UserCheck, ChevronDown, Check } from 'lucide-react';
import { useAuth, DEMO_ACCOUNTS } from '../../context/AuthContext';
import { api } from '../../services/api';
import { NotificationItem, RoleName } from '../../types';

export const Topbar: React.FC = () => {
  const { user, switchRole } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const notifs = await api.getNotifications();
        setNotifications(notifs);
      } catch (_) {}
    };
    fetchNotifications();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const currentRoleName = user?.roles[0]?.name;

  return (
    <header className="h-16 bg-[#FFFDF9] border-b border-[#E5D7C8] px-6 flex items-center justify-between shadow-subtle select-none z-20">
      {/* Search Input */}
      <div className="relative w-80">
        <Search className="w-4 h-4 text-[#88776B] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search FIRs, Case numbers, Checksums..."
          className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#F7F3EE] border border-[#E5D7C8] text-sm text-[#30241F] placeholder-[#88776B]/70 focus:outline-none focus:ring-2 focus:ring-[#B8875B] transition-all"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Role Switcher Pill */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#E5D7C8]/40 hover:bg-[#E5D7C8]/70 border border-[#E5D7C8] text-xs font-semibold text-[#4B342B] transition-all"
            title="Switch Demonstration Role"
          >
            <UserCheck className="w-3.5 h-3.5 text-[#B8875B]" />
            <span>Role: <strong className="text-[#3B2923]">{user?.roles[0]?.display_name || 'Loading'}</strong></span>
            <ChevronDown className="w-3.5 h-3.5 text-[#88776B]" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-[#FFFDF9] border border-[#E5D7C8] rounded-xl shadow-elevation p-2 z-50">
              <div className="px-3 py-2 border-b border-[#E5D7C8] mb-1">
                <p className="text-xs font-bold text-[#3B2923]">Demonstration Role Switcher</p>
                <p className="text-[11px] text-[#88776B]">Simulate role-based authorization views</p>
              </div>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {DEMO_ACCOUNTS.map((acc) => {
                  const isCurrent = acc.role === currentRoleName;
                  return (
                    <button
                      key={acc.role}
                      onClick={async () => {
                        setShowRoleMenu(false);
                        await switchRole(acc.role);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                        isCurrent 
                          ? 'bg-[#795548] text-white font-semibold' 
                          : 'hover:bg-[#F7F3EE] text-[#4B342B]'
                      }`}
                    >
                      <div>
                        <p className={isCurrent ? 'text-white' : 'font-medium text-[#30241F]'}>{acc.label}</p>
                        <p className={`text-[10px] ${isCurrent ? 'text-[#E5D7C8]' : 'text-[#88776B]'}`}>{acc.title}</p>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-[#B8875B]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Department Badge */}
        {user?.department && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3B2923]/5 border border-[#3B2923]/10 text-xs font-medium text-[#4B342B]">
            <Shield className="w-3.5 h-3.5 text-[#B8875B]" />
            <span>{user.department.name}</span>
          </div>
        )}

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg hover:bg-[#F7F3EE] text-[#4B342B] transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#B84040] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#FFFDF9] border border-[#E5D7C8] rounded-xl shadow-elevation p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5D7C8] mb-2">
                <span className="text-xs font-bold text-[#3B2923]">Notifications</span>
                <span className="text-[11px] text-[#88776B]">{unreadCount} unread</span>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-[#88776B] text-center py-4">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-lg text-xs border ${
                        n.is_read ? 'bg-white border-[#E5D7C8]/50' : 'bg-[#B8875B]/10 border-[#B8875B]/30'
                      }`}
                    >
                      <p className="font-semibold text-[#30241F]">{n.title}</p>
                      <p className="text-[#88776B] mt-0.5">{n.message}</p>
                      <span className="text-[10px] text-[#88776B]/80 mt-1 block">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
