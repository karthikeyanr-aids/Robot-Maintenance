import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { authAPI } from '../../services/api';
import {
  X,
  User,
  Shield,
  Key,
  Building,
  Mail,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sliders,
  Bell,
  Cpu,
  Sun,
  Moon,
} from 'lucide-react';

export const ProfileSettingsModal = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();
  const { theme, setTheme, toggleTheme, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    department: '',
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sync state whenever modal opens or user updates
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name === 'Lead Technician' ? 'Maintenance Engineer' : (user.name || ''),
        email: user.email || '',
        username: user.username || '',
        department: user.department || 'Robotics Maintenance',
      });
    }
    setError('');
    setSuccess('');
    setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
  }, [user, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const roleDisplay =
    user?.role === 'TECHNICIAN' || user?.role === 'MAINTENANCE_ENGINEER'
      ? 'MAINTENANCE ENGINEER'
      : (user?.role || 'USER');

  const handleGeneralSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await authAPI.updateProfile({
        name: formData.name.trim(),
        email: formData.email.trim(),
        department: formData.department.trim(),
      });

      if (res.data.success) {
        updateUser(res.data.user);
        setSuccess('Profile settings successfully updated!');
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile settings.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!passwords.currentPassword) {
      setError('Please provide your current password.');
      return;
    }
    if (passwords.newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.updateProfile({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });

      if (res.data.success) {
        setSuccess('Password updated successfully!');
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div
          className="relative transform overflow-hidden rounded-3xl bg-white dark:bg-slate-900 text-left shadow-2xl transition-all sm:my-8 w-full max-w-xl border border-slate-200/90 dark:border-slate-800"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Banner */}
          <div className="relative bg-slate-50 dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-800 dark:to-cyan-950 px-6 py-6 text-slate-800 dark:text-white overflow-hidden border-b border-slate-200 dark:border-slate-800 transition-colors">
            <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-100 dark:bg-cyan-600/30 border border-cyan-200 dark:border-cyan-400/30 text-cyan-700 dark:text-cyan-300 flex items-center justify-center font-bold text-base shadow-inner">
                    {formData.name ? formData.name.substring(0, 2).toUpperCase() : 'ME'}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-sm" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                    {formData.name || 'User Profile'}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="px-2 py-0.5 rounded-md bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-400/30 text-[10px] font-mono font-bold tracking-wider uppercase">
                      {roleDisplay}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-xs truncate max-w-[180px]">
                      {formData.email || user?.email}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-slate-200/60 hover:bg-slate-200 text-slate-500 hover:text-slate-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer"
                aria-label="Close settings"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 mt-5 border-b border-slate-200 dark:border-slate-700/60 pt-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('general');
                  setError('');
                  setSuccess('');
                }}
                className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 transition-all border-b-2 cursor-pointer ${
                  activeTab === 'general'
                    ? 'border-cyan-600 dark:border-cyan-400 text-cyan-700 dark:text-cyan-300'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>General Profile</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('security');
                  setError('');
                  setSuccess('');
                }}
                className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 transition-all border-b-2 cursor-pointer ${
                  activeTab === 'security'
                    ? 'border-cyan-600 dark:border-cyan-400 text-cyan-700 dark:text-cyan-300'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>Security & Password</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('preferences');
                  setError('');
                  setSuccess('');
                }}
                className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 transition-all border-b-2 cursor-pointer ${
                  activeTab === 'preferences'
                    ? 'border-cyan-600 dark:border-cyan-400 text-cyan-700 dark:text-cyan-300'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Preferences</span>
              </button>
            </div>
          </div>

          {/* Feedback Banners */}
          <div className="px-6 pt-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}
          </div>

          {/* Tab 1: General Profile */}
          {activeTab === 'general' && (
            <form onSubmit={handleGeneralSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Alex Morgan"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <span className="text-slate-400 font-mono text-xs absolute left-3.5 top-3">@</span>
                    <input
                      type="text"
                      disabled
                      value={formData.username}
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-500 text-sm font-mono cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@robocare.com"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Department
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="Robotics Maintenance"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Role Details Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Operational Role:</span>
                    <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">{roleDisplay}</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Assigned certified access for robotic fleet monitoring, automated telemetry diagnostics, work orders, and sensor calibration.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-150 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: Security & Password */}
          {activeTab === 'security' && (
            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Current Password *
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                      placeholder="Min. 6 characters"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                      placeholder="Re-enter new password"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <Shield className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Your session remains securely authenticated with JWT token encryption.</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-150 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Tab 3: System Preferences */}
          {activeTab === 'preferences' && (
            <div className="p-6 space-y-5">
              {/* Theme Selector (White Mode / Dark Mode) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  Display Appearance
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 transition-all text-left cursor-pointer ${
                      theme === 'light'
                        ? 'border-cyan-500 bg-cyan-50/80 dark:bg-cyan-950/30 text-cyan-900 dark:text-cyan-300 shadow-sm ring-2 ring-cyan-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-amber-100 text-amber-600 shrink-0">
                      <Sun className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">White Mode</p>
                      <p className={`text-[10px] ${theme === 'light' ? 'text-cyan-700 dark:text-cyan-400 font-medium' : 'text-slate-400'}`}>
                        Clean light interface
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 transition-all text-left cursor-pointer ${
                      theme === 'dark'
                        ? 'border-cyan-500 bg-cyan-50/80 dark:bg-cyan-950/30 text-cyan-900 dark:text-cyan-300 shadow-sm ring-2 ring-cyan-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0">
                      <Moon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">Dark Mode</p>
                      <p className={`text-[10px] ${theme === 'dark' ? 'text-cyan-700 dark:text-cyan-400 font-medium' : 'text-slate-400'}`}>
                        High-contrast dark theme
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Telemetry Polling */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Real-time Telemetry Polling</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Auto-refresh metrics every 30 seconds</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                    Active
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Critical Failure Alerts</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Audio and visual badges for critical risk robots</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                    Enabled
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-slate-150 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
