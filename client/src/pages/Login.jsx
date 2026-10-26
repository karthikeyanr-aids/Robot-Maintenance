import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Bot,
  Zap
} from 'lucide-react';

export const Login = () => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('TECHNICIAN');
  const [department, setDepartment] = useState('Robotics Maintenance');

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const { login, user, token } = useAuth();
  const navigate = useNavigate();

  // If user is already signed in, redirect them directly to Dashboard
  useEffect(() => {
    if (token && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [token, user, navigate]);

  // Subtle interactive parallax lighting based on mouse movement
  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const x = (clientX / window.innerWidth - 0.5) * 20;
      const y = (clientY / window.innerHeight - 0.5) * 20;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleLoginSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      await login(identifier.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username/email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!name.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!identifier.trim()) {
      setError('Please provide a username or email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const cleanId = identifier.trim();
      await authAPI.register({
        name: name.trim(),
        identifier: cleanId,
        email: cleanId.includes('@') ? cleanId : undefined,
        username: !cleanId.includes('@') ? cleanId : undefined,
        password,
        role,
        department: department.trim() || 'General Operations',
      });

      setPassword('');
      setIsRegisterMode(false);
      setSuccessMessage('Account created successfully! Please sign in with your credentials.');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Username or email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans overflow-hidden bg-gradient-to-tr from-[#162032] via-[#e2e8f0] to-[#c1e8c9]">

      {/* Dynamic Animated Ambient Glow Lights */}
      <div
        className="absolute -top-32 -right-32 w-[480px] h-[480px] rounded-full bg-emerald-300/45 blur-[100px] pointer-events-none transition-transform duration-700 ease-out"
        style={{ transform: `translate(${mousePos.x * -1}px, ${mousePos.y * -1}px)` }}
      />
      <div
        className="absolute top-1/2 -left-36 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-[#1b2537]/85 blur-[90px] pointer-events-none transition-transform duration-700 ease-out"
        style={{ transform: `translate(${mousePos.x * 1.2}px, ${mousePos.y * 1.2}px)` }}
      />
      <div
        className="absolute -bottom-28 right-1/4 w-[380px] h-[380px] rounded-full bg-teal-200/50 blur-[90px] pointer-events-none transition-transform duration-700 ease-out"
        style={{ transform: `translate(${mousePos.x * 0.8}px, ${mousePos.y * 0.8}px)` }}
      />

      {/* Main Glassmorphic Card Container */}
      <div className="w-full max-w-4xl relative z-10 rounded-[36px] sm:rounded-[44px] border border-white/80 bg-white/30 backdrop-blur-3xl shadow-[0_30px_70px_-20px_rgba(15,23,42,0.3)] overflow-hidden transition-all duration-300">

        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[570px]">

          {/* LEFT FORM PANEL (Slate Dark Glassmorphic Capsule) */}
          <div className="md:col-span-6 lg:col-span-6 bg-[#1a2636] text-white p-7 sm:p-10 lg:p-12 flex flex-col justify-between relative shadow-2xl overflow-hidden">

            {/* Subtle inner ambient glow */}
            <div className="absolute -top-24 -left-24 w-52 h-52 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-44 h-44 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />

            <div className="relative z-10">
              {/* Brand Identity Header */}
              <div className="flex items-center gap-2.5 mb-7">
                <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-400 backdrop-blur-md shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-extrabold tracking-widest text-emerald-400 uppercase">ROBOCARE</span>
                  <p className="text-[10px] text-slate-200 font-medium leading-none mt-0.5">Industrial Systems</p>
                </div>
              </div>

              {/* Title Header */}
              <div className="mb-6">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-wider text-white uppercase drop-shadow-sm">
                  {isRegisterMode ? 'REGISTER' : 'WELCOME'}
                </h1>
                <p className="text-xs text-slate-200 mt-1.5 font-medium leading-relaxed">
                  {isRegisterMode
                    ? 'Create your credentials to access system telemetry'
                    : 'Sign in to monitor robotic fleet health & AI diagnostics'}
                </p>
              </div>

              {/* Notifications */}
              {successMessage && (
                <div className="mb-4 p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-100 text-xs flex items-center gap-2.5 backdrop-blur-md animate-fadeIn shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-medium">{successMessage}</span>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 rounded-2xl bg-rose-950/80 border border-rose-500/60 text-rose-100 text-xs flex items-center gap-2.5 backdrop-blur-md animate-fadeIn shadow-sm">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {/* Form Controls */}
              <form onSubmit={isRegisterMode ? handleRegisterSubmit : handleLoginSubmit} className="space-y-4">

                {isRegisterMode && (
                  <>
                    <div>
                      <label className="text-[11px] font-bold tracking-widest text-slate-100 uppercase block mb-1.5 ml-2">
                        FULL NAME
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-full border border-slate-600/90 bg-[#111927] px-5 py-2.5 text-xs sm:text-sm text-white font-medium placeholder:text-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition-all shadow-inner"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold tracking-widest text-slate-100 uppercase block mb-1.5 ml-2">
                          ROLE
                        </label>
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          className="w-full rounded-full border border-slate-600/90 bg-[#111927] px-4 py-2.5 text-xs sm:text-sm text-white font-medium focus:outline-none focus:border-cyan-400 transition-all cursor-pointer shadow-inner"
                        >
                          <option value="TECHNICIAN" className="bg-slate-900 text-white">Maintenance Engineer</option>
                          <option value="ADMIN" className="bg-slate-900 text-white">Admin</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold tracking-widest text-slate-100 uppercase block mb-1.5 ml-2">
                          DEPARTMENT
                        </label>
                        <input
                          type="text"
                          placeholder="Maintenance"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="w-full rounded-full border border-slate-600/90 bg-[#111927] px-4 py-2.5 text-xs sm:text-sm text-white font-medium placeholder:text-slate-400 focus:outline-none focus:border-cyan-400 transition-all shadow-inner"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* USER NAME / EMAIL */}
                <div>
                  <label className="text-[11px] font-bold tracking-widest text-slate-100 uppercase block mb-1.5 ml-2">
                    USER NAME / EMAIL
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. admin or name@robocare.com"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full rounded-full border border-slate-600/90 bg-[#111927] px-5 py-2.5 sm:py-3 text-xs sm:text-sm text-white font-medium placeholder:text-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition-all shadow-inner"
                    />
                  </div>
                </div>

                {/* PASSWORD */}
                <div>
                  <label className="text-[11px] font-bold tracking-widest text-slate-100 uppercase block mb-1.5 ml-2">
                    PASSWORD
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-full border border-slate-600/90 bg-[#111927] pl-5 pr-11 py-2.5 sm:py-3 text-xs sm:text-sm text-white font-medium placeholder:text-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition-all shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white focus:outline-none cursor-pointer transition-colors p-1"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* ACTION BUTTON */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 sm:py-3.5 px-6 rounded-full bg-white text-slate-900 font-extrabold text-xs sm:text-sm tracking-widest uppercase shadow-lg hover:bg-slate-100 hover:shadow-xl active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 group"
                  >
                    {loading ? (
                      <span>PROCESSING...</span>
                    ) : (
                      <>
                        <span>{isRegisterMode ? 'CREATE ACCOUNT' : 'LOGIN'}</span>
                        <Zap className="w-4 h-4 text-emerald-600 transition-transform group-hover:scale-110" />
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>

            {/* Switch Mode Footer Link */}
            <div className="mt-6 pt-4 border-t border-slate-700/80 text-center relative z-10">
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setError('');
                  setSuccessMessage('');
                }}
                className="text-xs text-slate-200 hover:text-white transition-all cursor-pointer font-medium hover:underline"
              >
                {isRegisterMode ? (
                  <span>Already have an account? <strong className="text-white underline">Sign In</strong></span>
                ) : (
                  <span>Don't have an account? <strong className="text-white underline">Create one</strong></span>
                )}
              </button>
            </div>

          </div>

          {/* RIGHT SHOWCASE PANEL (Aesthetic Clean 3D Illustration & Platform Info) */}
          <div className="md:col-span-6 lg:col-span-6 bg-gradient-to-br from-white/80 via-white/50 to-emerald-50/60 p-6 sm:p-8 lg:p-10 flex flex-col justify-center items-center text-center relative overflow-hidden backdrop-blur-md">

            {/* Ambient Background Aura */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-200/30 rounded-full blur-3xl pointer-events-none" />

            {/* 3D Isometric Illustration (Frameless, Organic Float) */}
            <div className="relative w-full max-w-[310px] flex items-center justify-center mb-5 animate-float">
              <img
                src="/login-illustration.jpg"
                alt="Robotics Predictive Maintenance"
                className="w-full h-auto object-cover rounded-2xl drop-shadow-[0_15px_30px_rgba(30,41,59,0.15)] transition-transform duration-500 hover:scale-[1.03]"
              />
            </div>

            {/* Platform Overview Content */}
            <div className="relative z-10 max-w-sm px-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
                Welcome to <span className="text-emerald-600">ROBOCARE</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 font-normal leading-relaxed">
                Next-generation industrial predictive maintenance platform. Real-time telemetry monitoring, neural diagnostics, and proactive failure prevention.
              </p>

              {/* Minimal Highlight Badges */}
              <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-white/90 border border-slate-200/80 text-[10px] font-semibold text-slate-700 shadow-sm backdrop-blur-md">
                  🤖 Multi-Axial Telemetry
                </span>
                <span className="px-3 py-1 rounded-full bg-white/90 border border-slate-200/80 text-[10px] font-semibold text-slate-700 shadow-sm backdrop-blur-md">
                  🧠 Neural Failure Prediction
                </span>
                <span className="px-3 py-1 rounded-full bg-white/90 border border-slate-200/80 text-[10px] font-semibold text-slate-700 shadow-sm backdrop-blur-md">
                  🔧 Prescriptive Maintenance
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default Login;
