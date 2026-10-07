import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { ShieldCheck, Lock, UserCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAdminAuth();

  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedAdminId = adminId.trim();

    if (!trimmedAdminId) {
      setErrorMessage('Admin ID is required.');
      return;
    }

    if (!password) {
      setErrorMessage('Password is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login({ adminId: trimmedAdminId, password });

      // Redirect to target admin route or admin dashboard placeholder
      const destination = (location.state as any)?.from?.pathname || '/admin/dashboard';
      navigate(destination, { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid Admin ID or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Security Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Header Branding */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 mb-4 shadow-xl shadow-amber-500/10">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <p className="text-xs font-bold tracking-widest text-amber-400 uppercase">
            TECHNO JIGYASA CLUB
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase">
            ADMIN PORTAL
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Smart Attendance Management System
          </p>
        </div>

        {/* Card Form */}
        <div className="mt-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {/* Security Notice */}
          <div className="mb-6 py-2.5 px-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-400 flex items-center space-x-2.5">
            <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Restricted Access: Authorized Administrators Only</span>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-start space-x-3 text-sm animate-fade-in"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            {/* Admin ID Field */}
            <div>
              <label
                htmlFor="adminId"
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider"
              >
                Admin ID
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <UserCheck className="h-4 w-4" />
                </div>
                <input
                  id="adminId"
                  name="adminId"
                  type="text"
                  autoComplete="username"
                  required
                  value={adminId}
                  onChange={(e) => {
                    setAdminId(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Enter your Admin ID"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider"
              >
                Password
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-400/20 active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <span className="flex items-center space-x-2">
                    <span className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                    <span>AUTHENTICATING...</span>
                  </span>
                ) : (
                  'LOGIN'
                )}
              </button>
            </div>
          </form>

          {/* Footer Security Advisory */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-500">
              Techno Jigyasa Club &bull; High Security Management Session
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
