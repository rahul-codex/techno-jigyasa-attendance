import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  adminAttendanceApi,
  type AttendanceSessionData,
  type AttendanceRecordItem,
} from '../../services/adminAttendance.api';
import {
  Calendar,
  Clock,
  Play,
  StopCircle,
  PlusCircle,
  Users,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  Search,
  QrCode,
  ShieldAlert,
} from 'lucide-react';

export const AdminAttendancePage = () => {
  const [sessions, setSessions] = useState<AttendanceSessionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Selected session for viewing attendance records
  const [selectedSession, setSelectedSession] = useState<AttendanceSessionData | null>(null);
  const [records, setRecords] = useState<AttendanceRecordItem[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

  // Record filters
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Manual correction state
  const [correctingRecordId, setCorrectingRecordId] = useState<string | null>(null);

  const fetchTodaySessions = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await adminAttendanceApi.getTodaySessions();
      if (response.success && response.data) {
        setSessions(response.data.sessions);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch sessions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTodaySessions();
  }, []);

  const handleCreateSession = async (sessionType: 'SESSION_1' | 'SESSION_2') => {
    setActionLoading(`create-${sessionType}`);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const response = await adminAttendanceApi.createSession(sessionType);
      if (response.success) {
        setSuccessMessage(
          `${sessionType === 'SESSION_1' ? 'Morning' : 'Afternoon'} session created successfully.`
        );
        await fetchTodaySessions();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create session.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartSession = async (sessionId: string) => {
    setActionLoading(`start-${sessionId}`);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const response = await adminAttendanceApi.startSession(sessionId);
      if (response.success) {
        setSuccessMessage('Session started successfully! Ready to accept QR scans.');
        await fetchTodaySessions();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to start session.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCloseSession = async (sessionId: string) => {
    if (
      !window.confirm(
        'Are you sure you want to close this session? All eligible students without attendance will automatically be reconciled as ABSENT.'
      )
    ) {
      return;
    }

    setActionLoading(`close-${sessionId}`);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const response = await adminAttendanceApi.closeSession(sessionId);
      if (response.success) {
        setSuccessMessage('Session closed. Absent reconciliation completed successfully.');
        await fetchTodaySessions();
        if (selectedSession?.id === sessionId) {
          fetchSessionRecords(sessionId);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to close session.');
    } finally {
      setActionLoading(null);
    }
  };

  const fetchSessionRecords = async (sessionId: string) => {
    setRecordsLoading(true);
    try {
      const response = await adminAttendanceApi.getSessionRecords(sessionId, {
        department: filterDepartment || undefined,
        section: filterSection || undefined,
        status: filterStatus || undefined,
        search: searchQuery || undefined,
      });
      if (response.success && response.data) {
        setRecords(response.data.records);
      }
    } catch (err: any) {
      console.error('Failed to load session records:', err);
    } finally {
      setRecordsLoading(false);
    }
  };

  const openSessionRecordsModal = (session: AttendanceSessionData) => {
    setSelectedSession(session);
    fetchSessionRecords(session.id);
  };

  const handleCorrectRecord = async (recordId: string, newStatus: 'PRESENT' | 'ABSENT') => {
    setCorrectingRecordId(recordId);
    try {
      const response = await adminAttendanceApi.correctRecord(recordId, newStatus);
      if (response.success) {
        setRecords((prev) =>
          prev.map((r) => (r.id === recordId ? { ...r, status: newStatus } : r))
        );
        await fetchTodaySessions();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to correct record.');
    } finally {
      setCorrectingRecordId(null);
    }
  };

  // Find Morning and Afternoon sessions from today's list
  const morningSession = sessions.find((s) => s.sessionType === 'SESSION_1');
  const afternoonSession = sessions.find((s) => s.sessionType === 'SESSION_2');

  const renderSessionCard = (
    type: 'SESSION_1' | 'SESSION_2',
    session: AttendanceSessionData | undefined
  ) => {
    const title = type === 'SESSION_1' ? 'Morning Session' : 'Afternoon Session';
    const plannedTime = type === 'SESSION_1' ? '09:00 AM – 12:00 PM' : '01:00 PM – 04:00 PM';
    const isMorning = type === 'SESSION_1';

    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl backdrop-blur-sm relative overflow-hidden flex flex-col justify-between">
        {/* Subtle accent border */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 ${
            session?.status === 'ACTIVE'
              ? 'bg-amber-400 animate-pulse'
              : session?.status === 'CLOSED'
              ? 'bg-slate-700'
              : session
              ? 'bg-indigo-500'
              : 'bg-slate-800'
          }`}
        />

        <div>
          {/* Card Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                {isMorning ? 'Daily Session 1' : 'Daily Session 2'}
              </span>
              <h2 className="text-xl font-extrabold text-white mt-0.5">{title}</h2>
              <div className="flex items-center space-x-1.5 text-xs text-slate-400 mt-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{plannedTime}</span>
              </div>
            </div>

            {/* Status Badge */}
            {session ? (
              <span
                className={`px-3 py-1 rounded-full text-xs font-extrabold tracking-wider uppercase border flex items-center space-x-1.5 ${
                  session.status === 'ACTIVE'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : session.status === 'CLOSED'
                    ? 'bg-slate-800 text-slate-400 border-slate-700'
                    : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                }`}
              >
                {session.status === 'ACTIVE' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
                <span>{session.status}</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-500 border border-slate-700/60 uppercase">
                Not Created
              </span>
            )}
          </div>

          {/* Metrics Overview */}
          {session ? (
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5">
                <span className="text-[11px] font-semibold text-emerald-400 block uppercase">
                  Present
                </span>
                <span className="text-2xl font-black text-white mt-1 block">
                  {session.presentCount}
                </span>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5">
                <span className="text-[11px] font-semibold text-rose-400 block uppercase">
                  Absent
                </span>
                <span className="text-2xl font-black text-white mt-1 block">
                  {session.absentCount}
                </span>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                  Total
                </span>
                <span className="text-2xl font-black text-white mt-1 block">
                  {session.totalEligibleStudents}
                </span>
              </div>
            </div>
          ) : (
            <div className="my-8 py-4 text-center text-xs text-slate-500">
              Session has not yet been scheduled for today.
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col gap-2.5">
          {!session && (
            <button
              onClick={() => handleCreateSession(type)}
              disabled={actionLoading === `create-${type}`}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer shadow-md shadow-amber-400/10"
            >
              <PlusCircle className="w-4 h-4" />
              <span>
                {actionLoading === `create-${type}` ? 'CREATING...' : 'CREATE SESSION'}
              </span>
            </button>
          )}

          {session?.status === 'SCHEDULED' && (
            <button
              onClick={() => handleStartSession(session.id)}
              disabled={actionLoading === `start-${session.id}`}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-600/20"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                {actionLoading === `start-${session.id}` ? 'STARTING...' : 'START SESSION'}
              </span>
            </button>
          )}

          {session?.status === 'ACTIVE' && (
            <div className="flex gap-2">
              <Link
                to="/admin/scanner"
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors flex items-center justify-center space-x-1.5 shadow-md shadow-amber-400/10"
              >
                <QrCode className="w-4 h-4" />
                <span>SCANNER</span>
              </Link>

              <button
                onClick={() => handleCloseSession(session.id)}
                disabled={actionLoading === `close-${session.id}`}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer shadow-md shadow-rose-600/20"
              >
                <StopCircle className="w-4 h-4" />
                <span>
                  {actionLoading === `close-${session.id}` ? 'CLOSING...' : 'CLOSE SESSION'}
                </span>
              </button>
            </div>
          )}

          {session && (
            <button
              onClick={() => openSessionRecordsModal(session)}
              className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>View Attendance Records</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="bg-slate-900/80 border-b border-slate-800 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <p className="text-[10px] font-bold tracking-wider text-amber-400 uppercase">
                TECHNO JIGYASA CLUB
              </p>
              <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center space-x-2">
                <span>Attendance Sessions</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/admin/scanner"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors shadow-sm"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR Scanner</span>
            </Link>

            <button
              onClick={fetchTodaySessions}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner with date & status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Today's Dual-Session Management</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Attendance Control
            </h2>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>Timezone: Asia/Kolkata (IST)</span>
          </div>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-start space-x-3 text-sm">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-start space-x-3 text-sm">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Today's Two Session Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {renderSessionCard('SESSION_1', morningSession)}
          {renderSessionCard('SESSION_2', afternoonSession)}
        </div>

        {/* Records Modal / Drawer */}
        {selectedSession && (
          <div className="mt-12 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  Session Records
                </span>
                <h3 className="text-xl font-bold text-white">
                  {selectedSession.sessionType === 'SESSION_1' ? 'Morning' : 'Afternoon'} Session
                  Attendee Roster
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Status: {selectedSession.status} &bull; Present: {selectedSession.presentCount} &bull;
                  Absent: {selectedSession.absentCount}
                </p>
              </div>

              <button
                onClick={() => setSelectedSession(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold self-start sm:self-auto cursor-pointer"
              >
                Close View
              </button>
            </div>

            {/* Filters Bar */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <input
                  type="text"
                  placeholder="Search ERP ID / Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="">All Departments</option>
                  <option value="BCA">BCA</option>
                  <option value="B_TECH_AIML">B.Tech AIML</option>
                  <option value="B_TECH_CSE">B.Tech CSE</option>
                  <option value="B_TECH_EN">B.Tech E.N</option>
                  <option value="MCA">MCA</option>
                </select>
              </div>

              <div>
                <select
                  value={filterSection}
                  onChange={(e) => setFilterSection(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="">All Sections</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                  <option value="D">Section D</option>
                </select>
              </div>

              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="">All Statuses</option>
                  <option value="PRESENT">PRESENT</option>
                  <option value="ABSENT">ABSENT</option>
                </select>

                <button
                  onClick={() => fetchSessionRecords(selectedSession.id)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  title="Apply Filters"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Records Table */}
            <div className="mt-6 overflow-x-auto">
              {recordsLoading ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  <div className="w-6 h-6 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin mx-auto mb-2" />
                  Loading records...
                </div>
              ) : records.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No attendance records found matching filters.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">ERP ID</th>
                      <th className="py-3 px-4">Dept / Section</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Marked At</th>
                      {selectedSession.status === 'CLOSED' && (
                        <th className="py-3 px-4 text-right">Admin Correction</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {records.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-semibold text-white">
                          {r.student.name || 'Student'}
                        </td>
                        <td className="py-3 px-4 font-mono text-amber-400">{r.student.erpId}</td>
                        <td className="py-3 px-4 text-slate-300">
                          {r.student.department || 'N/A'}{' '}
                          {r.student.section ? `- ${r.student.section}` : ''}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase ${
                              r.status === 'PRESENT'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {new Date(r.markedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        {selectedSession.status === 'CLOSED' && (
                          <td className="py-3 px-4 text-right">
                            {r.status === 'ABSENT' ? (
                              <button
                                onClick={() => handleCorrectRecord(r.id, 'PRESENT')}
                                disabled={correctingRecordId === r.id}
                                className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40 text-[10px] font-bold uppercase transition-colors cursor-pointer"
                              >
                                Mark Present
                              </button>
                            ) : (
                              <button
                                onClick={() => handleCorrectRecord(r.id, 'ABSENT')}
                                disabled={correctingRecordId === r.id}
                                className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/40 text-[10px] font-bold uppercase transition-colors cursor-pointer"
                              >
                                Mark Absent
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
