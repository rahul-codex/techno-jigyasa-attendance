import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { StudentNavbar } from '../../components/layout/StudentNavbar';
import { DEPARTMENT_OPTIONS } from '../../types/auth.types';
import {
  User,
  Building2,
  Layers,
  Sparkles,
  CalendarCheck,
  ShieldCheck,
  Clock,
} from 'lucide-react';

export const StudentDashboardPlaceholder = () => {
  const { user } = useAuth();

  const getDeptLabel = (val: string | null) => {
    const found = DEPARTMENT_OPTIONS.find((d) => d.value === val);
    return found ? found.label : val || 'Not specified';
  };

  const photoDisplay = user?.profileImage
    ? `http://localhost:5000${user.profileImage}`
    : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <StudentNavbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden mb-8">
          <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
            {/* Circular Profile Photo */}
            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-indigo-500/40 bg-slate-950 flex items-center justify-center shadow-xl">
                {photoDisplay ? (
                  <img
                    src={photoDisplay}
                    alt={user?.name || user?.erpId}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-slate-500 stroke-[1.5]" />
                )}
              </div>
            </div>

            {/* Student Info */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Verified Member</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome, {user?.name || 'Student'}
              </h1>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-slate-300">
                <span className="font-mono bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
                  ERP: <strong className="text-white">{user?.erpId}</strong>
                </span>
                <span className="flex items-center space-x-1 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{getDeptLabel(user?.department || null)}</span>
                </span>
                <span className="flex items-center space-x-1 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Section {user?.section || '—'}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid (Overview) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {/* Card 1: Account Status */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Profile Status
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-lg font-bold text-white">Active & Complete</p>
            <p className="text-xs text-slate-400 mt-1">
              Your profile has all required identification details
            </p>
          </div>

          {/* Card 2: Upcoming Digital QR Pass */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Digital Pass
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <p className="text-lg font-bold text-indigo-300">Signed QR Token</p>
            <p className="text-xs text-slate-400 mt-1">
              Dynamic ID card generation coming in Step 5
            </p>
          </div>

          {/* Card 3: Session Tracking */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Daily Sessions
              </span>
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-lg font-bold text-cyan-300">Morning & Afternoon</p>
            <p className="text-xs text-slate-400 mt-1">
              Dual-session club schedule ready
            </p>
          </div>
        </div>

        {/* Attendance Action Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-center shadow-lg relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Track Your Club Attendance
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
            View your attendance percentage, completed sessions, and historical session roster.
          </p>
          <Link
            to="/student/attendance"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20"
          >
            <span>View Attendance Overview</span>
          </Link>
        </div>
      </main>
    </div>
  );
};
