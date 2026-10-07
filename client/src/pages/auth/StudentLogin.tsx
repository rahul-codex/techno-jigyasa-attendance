import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LogIn, KeyRound, User, AlertCircle, CheckCircle2, Eye, EyeOff, HelpCircle } from 'lucide-react';

export const StudentLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [erpId, setErpId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    (location.state as any)?.message || null
  );
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedErpId = erpId.trim();

    if (!trimmedErpId) {
      setErrorMessage('ERP ID is required.');
      return;
    }

    if (!password) {
      setErrorMessage('Password is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login({ erpId: trimmedErpId, password });
      setSuccessMessage('Login successful.');
      // Redirect to intended route or student dashboard placeholder
      const destination = (location.state as any)?.from?.pathname || '/student/dashboard';
      setTimeout(() => {
        navigate(destination, { replace: true });
      }, 500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid ERP ID or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Header Branding */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 mb-4 shadow-lg shadow-indigo-500/10">
            <LogIn className="w-7 h-7" />
          </div>
          <p className="text-xs font-semibold tracking-wider text-indigo-400 uppercase">
            TECHNO JIGYASA CLUB
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Student Login
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Smart Attendance Management Portal
          </p>
        </div>

        {/* Card Form */}
        <div className="mt-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
          {/* Success Banner */}
          {successMessage && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-start space-x-3 text-sm">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-start space-x-3 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            {/* ERP ID Field */}
            <div>
              <label htmlFor="erpId" className="block text-xs font-medium text-slate-300 uppercase tracking-wide">
                ERP ID
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="erpId"
                  name="erpId"
                  type="text"
                  autoComplete="username"
                  required
                  value={erpId}
                  onChange={(e) => {
                    setErpId(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="e.g. 2024BCA001"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-medium text-slate-300 uppercase tracking-wide">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="h-4 w-4" />
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
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
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
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/30"
              >
                {isSubmitting ? (
                  <span className="flex items-center space-x-2">
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </span>
                ) : (
                  'Login'
                )}
              </button>
            </div>
          </form>

          {/* Registration Link */}
          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <p className="text-sm text-slate-400">
              Don't have an account?{' '}
              <Link
                to="/student/register"
                className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors ml-1"
              >
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Password Assistance</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              For security compliance, student passwords cannot be reset automatically without verification. Please contact the Techno Jigyasa Club desk or email the club administrator with your ERP ID to reset your credentials.
            </p>
            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
