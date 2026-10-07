import { useNavigate, Link } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  Shield,
  ShieldAlert,
  CheckCircle2,
  LogOut,
  Key,
  UserCheck,
  Clock,
  QrCode,
  ArrowRight,
  Calendar,
} from 'lucide-react';

export const AdminDashboardPlaceholder = () => {
  const { admin, role, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  const isSuperAdmin = role === 'SUPER_ADMIN';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-slate-900/80 border-b border-slate-800 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-md shadow-amber-500/10">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-wider text-amber-400 uppercase">
                TECHNO JIGYASA CLUB
              </p>
              <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                ADMIN PORTAL
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/admin/attendance"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 border border-slate-700/80 hover:bg-slate-700 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Attendance</span>
            </Link>

            <Link
              to="/admin/scanner"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors shadow-md shadow-amber-400/20"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR Scanner</span>
            </Link>

            <div className="hidden sm:flex items-center space-x-2">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase border ${
                  isSuperAdmin
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                {role || 'ADMIN'}
              </span>
              <span className="text-xs text-slate-400">{admin?.name}</span>
            </div>

            <button
              id="admin-logout-btn"
              onClick={handleLogout}
              className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-rose-600/20 hover:border-rose-500/30 border border-slate-700/80 transition-all cursor-pointer shadow-sm"
              title="Sign out of Admin Session"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        {/* Verification Status Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-sm">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center space-x-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Active Session</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Admin Dashboard
              </h2>
              <p className="mt-1 text-base text-slate-300">
                Welcome, <span className="text-white font-semibold">{admin?.name || 'Administrator'}</span>
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold tracking-wide uppercase border flex items-center space-x-1.5 ${
                  isSuperAdmin
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                {isSuperAdmin ? (
                  <ShieldAlert className="w-4 h-4" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
                <span>{role || 'ADMIN'}</span>
              </span>

              <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
                {admin?.status || 'ACTIVE'}
              </span>
            </div>
          </div>

          {/* Quick Navigation Actions */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/admin/attendance"
              className="group p-5 rounded-2xl bg-gradient-to-r from-indigo-600/15 to-purple-600/15 hover:from-indigo-600/25 hover:to-purple-600/25 border border-indigo-500/30 hover:border-indigo-400/50 transition-all flex items-center justify-between shadow-xl shadow-indigo-500/5"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-bold shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                    Attendance Sessions
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Manage Morning &amp; Afternoon sessions, closures, &amp; rosters.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/admin/scanner"
              className="group p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 to-orange-600/15 hover:from-amber-500/25 hover:to-orange-600/25 border border-amber-500/30 hover:border-amber-400/50 transition-all flex items-center justify-between shadow-xl shadow-amber-500/5"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-amber-400/20 group-hover:scale-105 transition-transform">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                    QR Scanner
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live camera verification &amp; attendance marking.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Success Validation Message */}
          <div className="mt-6 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-start space-x-4">
            <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-emerald-400 mt-0.5" />
            <div>
              <h3 className="text-base font-bold text-white">
                Admin authentication is working successfully.
              </h3>
              <p className="mt-1 text-sm text-emerald-300/90 leading-relaxed">
                Your credentials and role-based permissions have been cryptographically verified through secure httpOnly session cookies and backend RBAC middleware.
              </p>
            </div>
          </div>

          {/* Session Information Grid */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center space-x-2 text-slate-400 text-xs font-medium uppercase mb-1">
                <UserCheck className="w-4 h-4 text-amber-400" />
                <span>Admin Identifier</span>
              </div>
              <p className="text-sm font-mono font-bold text-white">
                {admin?.adminId || 'N/A'}
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center space-x-2 text-slate-400 text-xs font-medium uppercase mb-1">
                <Key className="w-4 h-4 text-indigo-400" />
                <span>Role Level</span>
              </div>
              <p className="text-sm font-semibold text-white">
                {role === 'SUPER_ADMIN' ? 'Super Administrator' : 'Administrator'}
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center space-x-2 text-slate-400 text-xs font-medium uppercase mb-1">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Authentication State</span>
              </div>
              <p className="text-sm font-semibold text-emerald-400">
                Verified &amp; Active
              </p>
            </div>
          </div>

          {/* Planned Features Advisory */}
          <div className="mt-8 p-5 rounded-2xl bg-slate-950/70 border border-slate-800 text-slate-400 text-sm">
            <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider mb-1.5">
              Future Modules
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automated multi-session finalization, student directory management, and executive analytics reports will be integrated in upcoming development steps.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
