import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, CheckCircle2, AlertTriangle, ChevronRight, Settings, LogOut, ChevronDown, User as UserIcon, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { ProfileSettingsModal } from '../profile/ProfileSettingsModal';

export const Navbar = ({ toggleSidebar, isCollapsed }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  const profileRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (n) => {
    markAsRead(n._id);
    setShowNotifications(false);
    if (n.link) {
      navigate(n.link);
    }
  };

  const displayName = user?.name === 'Lead Technician' ? 'Maintenance Engineer' : (user?.name || 'Operator');
  const displayRole =
    user?.role === 'TECHNICIAN' || user?.role === 'MAINTENANCE_ENGINEER'
      ? 'MAINTENANCE ENGINEER'
      : (user?.role || 'USER');
  const initials = displayName ? displayName.substring(0, 2).toUpperCase() : 'ME';

  return (
    <header className="h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between transition-colors duration-200">
      
      {/* Left side: Menubar toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200/80 dark:border-slate-700/80"
          title={isCollapsed ? 'Expand Menubar' : 'Collapse Menubar'}
          aria-label="Toggle Menubar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md">
            System Live
          </span>
        </div>
      </div>

      {/* Right side: Dark Mode Toggle, Notifications & User profile badge */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dark / Light Mode Switcher */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-amber-400 transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700/60"
          title={isDark ? 'Switch to White Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700/60"
            title="System Alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Predictive Alerts</h4>
                  {unreadCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    All systems operating nominally. No active alerts.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors flex items-start gap-3 ${
                        !n.read ? 'bg-cyan-50/40 dark:bg-cyan-950/20' : ''
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {n.severity === 'CRITICAL' ? (
                          <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs text-slate-800 dark:text-slate-200 leading-snug ${!n.read ? 'font-semibold' : 'font-normal'}`}>
                          {n.message}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 self-center" />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Trigger & Dropdown */}
        <div className="relative pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-800" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 p-1 sm:px-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer group"
            title="Account & Profile Settings"
            aria-label="Profile Menu"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                {displayName}
              </p>
              <p className="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                {displayRole}
              </p>
            </div>
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-cyan-400 border border-slate-700/60 group-hover:bg-cyan-700 group-hover:text-white flex items-center justify-center font-bold text-xs shadow-sm transition-colors">
                {initials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-xs" />
            </div>
            <ChevronDown
              className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform duration-200 hidden sm:block"
              style={{ transform: showProfileMenu ? 'rotate(180deg)' : 'none' }}
            />
          </button>

          {/* Profile Popover / Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950 text-white border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-600/30 border border-cyan-400/30 text-cyan-300 flex items-center justify-center font-bold text-sm">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate">{displayName}</p>
                    <p className="text-xs text-slate-300 truncate">{user?.email || user?.username}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-slate-700/60">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Role</span>
                  <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                    {displayRole}
                  </span>
                </div>
              </div>

              <div className="p-2 space-y-1 bg-white dark:bg-slate-900">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-cyan-50 dark:hover:bg-slate-800 hover:text-cyan-700 dark:hover:text-cyan-400 transition-colors text-left cursor-pointer"
                >
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">Profile Settings</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">Manage account, security & theme</p>
                  </div>
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left cursor-pointer"
                >
                  <div className="p-1.5 rounded-lg bg-rose-100/60 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}

          {/* Profile Settings Modal */}
          <ProfileSettingsModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
          />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
