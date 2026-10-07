import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  studentAttendanceApi,
  type StudentAttendanceSummary,
  type StudentAttendanceHistoryItem,
} from '../../services/studentAttendance.api';
import {
  Calendar,
  Clock,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RefreshCw,
  QrCode,
  PieChart,
} from 'lucide-react';

export const StudentAttendancePage = () => {
  const [summary, setSummary] = useState<StudentAttendanceSummary | null>(null);
  const [history, setHistory] = useState<StudentAttendanceHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchAttendanceData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [summaryRes, historyRes] = await Promise.all([
        studentAttendanceApi.getSummary(),
        studentAttendanceApi.getHistory(),
      ]);

      if (summaryRes.success && summaryRes.data) {
        setSummary(summaryRes.data);
      }
      if (historyRes.success && historyRes.data) {
        setHistory(historyRes.data.history);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load attendance records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const percentage = summary?.attendancePercentage ?? 0;
  const isHighAttendance = percentage >= 75;
  const isModerateAttendance = percentage >= 60 && percentage < 75;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-slate-900/80 border-b border-slate-800 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              to="/student/dashboard"
              className="inline-flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <p className="text-[10px] font-bold tracking-wider text-indigo-400 uppercase">
                TECHNO JIGYASA CLUB
              </p>
              <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                My Attendance
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/student/qr"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-sm"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>My QR Pass</span>
            </Link>

            <button
              onClick={fetchAttendanceData}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Refresh Records"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner */}
        <div className="mb-8">
          <div className="inline-flex items-center space-x-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <PieChart className="w-3.5 h-3.5" />
            <span>Academic Performance Metric</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Attendance Overview
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Attendance percentage is calculated strictly from officially concluded (closed) club sessions.
          </p>
        </div>

        {/* Error Notice */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
            {errorMessage}
          </div>
        )}

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {/* Card 1: Attendance Percentage */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-sm relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Percentage
              </span>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isHighAttendance
                    ? 'bg-emerald-400 animate-pulse'
                    : isModerateAttendance
                    ? 'bg-amber-400'
                    : 'bg-rose-500'
                }`}
              />
            </div>
            <div className="mt-4">
              <div className="flex items-baseline space-x-1">
                <span className="text-3xl font-black text-white">{percentage}</span>
                <span className="text-base font-bold text-slate-400">%</span>
              </div>
              <p
                className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${
                  isHighAttendance
                    ? 'text-emerald-400'
                    : isModerateAttendance
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {isHighAttendance
                  ? 'Eligible (>= 75%)'
                  : isModerateAttendance
                  ? 'Warning (60-74%)'
                  : 'Critical (< 60%)'}
              </p>
            </div>
          </div>

          {/* Card 2: Present Sessions */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-sm flex flex-col justify-between">
            <div className="flex items-center space-x-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Present</span>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-white">
                {summary?.presentCount ?? 0}
              </span>
              <p className="text-[10px] text-slate-400 uppercase mt-1">Sessions Attended</p>
            </div>
          </div>

          {/* Card 3: Absent Sessions */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-sm flex flex-col justify-between">
            <div className="flex items-center space-x-2 text-rose-400">
              <XCircle className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Absent</span>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-white">
                {summary?.absentCount ?? 0}
              </span>
              <p className="text-[10px] text-slate-400 uppercase mt-1">Sessions Missed</p>
            </div>
          </div>

          {/* Card 4: Total Closed Sessions */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-sm flex flex-col justify-between">
            <div className="flex items-center space-x-2 text-indigo-400">
              <Calendar className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Concluded</span>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-white">
                {summary?.totalClosedSessions ?? 0}
              </span>
              <p className="text-[10px] text-slate-400 uppercase mt-1">Closed Sessions</p>
            </div>
          </div>
        </div>

        {/* History Table Section */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between pb-6 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white">Attendance History</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete record of club morning &amp; afternoon attendance sessions
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            {isLoading ? (
              <div className="py-16 text-center text-xs text-slate-400">
                <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2" />
                Loading attendance history...
              </div>
            ) : history.length === 0 ? (
              <div className="py-16 text-center">
                <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-white mb-1">No Attendance Records Yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Your attendance will appear here once you scan your digital QR code during active club sessions.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Session</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Recorded Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-white">
                        {new Date(item.date).toLocaleDateString([], {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-medium">
                        {item.sessionType === 'SESSION_1' ? 'Morning Session' : 'Afternoon Session'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase ${
                            item.status === 'PRESENT'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {item.status === 'PRESENT' ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          <span>{item.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-400 font-mono">
                        <span className="inline-flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>
                            {new Date(item.markedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
