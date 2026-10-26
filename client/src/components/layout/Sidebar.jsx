import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  Wrench,
  BrainCircuit,
  BarChart3,
  Users,
  LogOut,
  Bot,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ProfileSettingsModal } from '../profile/ProfileSettingsModal';

export const Sidebar = ({ isCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const { user, logout, hasRole } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navSections = [
    {
      title: 'OPERATIONS',
      links: [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/robots', label: 'Robots Fleet', icon: Bot },
        { to: '/predictions', label: 'Predictions', icon: BrainCircuit },
        { to: '/maintenance', label: 'Maintenance', icon: Wrench },
        { to: '/errors', label: 'Error Logs', icon: AlertTriangle },
      ],
    },
    {
      title: 'INSIGHTS',
      links: [
        { to: '/analytics', label: 'Analytics & Trends', icon: BarChart3 },
      ],
    },
  ];

  if (hasRole('ADMIN')) {
    navSections.push({
      title: 'SYSTEM & ADMIN',
      links: [{ to: '/users', label: 'User Management', icon: Users }],
    });
  }

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Main Sidebar Menubar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 flex flex-col border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-cyan-600/20">
              <Bot className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-wider flex items-center gap-1.5">
                  ROBOCARE
                </h1>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Robotics Maintenance</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {!isCollapsed ? (
                <div className="px-3 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                  {section.title}
                </div>
              ) : (
                <div className="h-px bg-slate-200 dark:bg-slate-800 my-2 mx-2" />
              )}
              
              {section.links.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsMobileOpen(false)}
                    title={isCollapsed ? link.label : undefined}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isCollapsed ? 'justify-center' : ''
                      } ${
                        isActive
                          ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!isCollapsed && <span className="truncate">{link.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* User Profile & Logout Section */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-2`}>
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-90 transition-opacity cursor-pointer group"
              title="Open Profile Settings"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 border border-slate-200 dark:border-slate-700 group-hover:border-cyan-500/50 flex items-center justify-center text-xs font-bold shrink-0 transition-colors">
                {user?.name === 'Lead Technician' ? 'ME' : user?.name ? user.name.charAt(0).toUpperCase() : 'ME'}
              </div>
              {!isCollapsed && (
                <div className="truncate">
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors truncate">
                    {user?.name === 'Lead Technician' ? 'Maintenance Engineer' : (user?.name || 'Operator')}
                  </p>
                  <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-semibold uppercase tracking-wider block truncate">
                    {user?.role === 'TECHNICIAN' || user?.role === 'MAINTENANCE_ENGINEER' ? 'MAINTENANCE ENGINEER' : user?.role}
                  </span>
                </div>
              )}
            </button>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Profile Settings Modal */}
        <ProfileSettingsModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
        />
      </aside>
    </>
  );
};

export default Sidebar;
