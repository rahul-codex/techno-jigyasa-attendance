import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { studentQrApi } from '../../services/qr.api';
import type { QrApiResponseData } from '../../services/qr.api';
import { StudentNavbar } from '../../components/layout/StudentNavbar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { downloadSingleQr, downloadStudentIdCard } from '../../utils/cardDownload.util';
import { DEPARTMENT_OPTIONS } from '../../types/auth.types';
import {
  Download,
  RefreshCw,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  Building2,
  Layers,
  Sparkles,
  IdCard,
  AlertCircle,
  CheckCircle2,
  User,
} from 'lucide-react';

export const StudentQrPage = () => {
  const { user, updateUserSession } = useAuth();

  const [qrData, setQrData] = useState<QrApiResponseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isDownloadingCard, setIsDownloadingCard] = useState(false);

  // Messages
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Regeneration modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fetchQr = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await studentQrApi.getQr();
      if (res.success && res.data) {
        setQrData(res.data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load QR pass.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQr();
  }, []);

  const handleRegenerate = async () => {
    setShowConfirmModal(false);
    try {
      setIsRegenerating(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const res = await studentQrApi.regenerateQr();
      if (res.success && res.data) {
        setQrData(res.data);
        updateUserSession(res.data.student);
        setSuccessMessage('✓ New QR pass generated. Previous versions are now revoked.');
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to regenerate QR.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDownloadQrOnly = () => {
    if (!qrData) return;
    downloadSingleQr(qrData.qrDataUrl, qrData.student.erpId);
  };

  const handleDownloadIdCard = async () => {
    if (!qrData) return;
    try {
      setIsDownloadingCard(true);
      await downloadStudentIdCard(qrData.student, qrData.qrDataUrl);
    } catch (err) {
      setErrorMessage('Failed to generate card download. Please try again.');
    } finally {
      setIsDownloadingCard(false);
    }
  };

  const getDeptLabel = (val: string | null) => {
    const found = DEPARTMENT_OPTIONS.find((d) => d.value === val);
    return found ? found.label : val || 'Not set';
  };

  const photoDisplay = user?.profileImage
    ? `http://localhost:5000${user.profileImage}`
    : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <StudentNavbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-flex items-center space-x-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 mb-3">
            <QrCode className="w-3.5 h-3.5" />
            <span>Official Attendance Pass</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            My Digital Attendance Pass
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Present this signed QR code during daily sessions for rapid camera verification.
          </p>
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="max-w-2xl mx-auto mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center space-x-3 text-sm">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="max-w-2xl mx-auto mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center space-x-3 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isLoading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" text="Generating digital security token..." />
          </div>
        ) : qrData ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-4xl mx-auto">
            {/* LEFT / CENTER: The Digital ID Card Preview */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
              {/* Card Header Glow */}
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500" />
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center space-x-2 text-[11px] font-bold text-indigo-400 uppercase tracking-widest mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>TECHNO JIGYASA CLUB</span>
              </div>
              <h2 className="text-lg font-black text-white tracking-wider">
                SMART ATTENDANCE CARD
              </h2>

              {/* Student Circular Photo */}
              <div className="mt-5 relative">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-indigo-500/40 bg-slate-950 flex items-center justify-center shadow-xl">
                  {photoDisplay ? (
                    <img
                      src={photoDisplay}
                      alt={qrData.student.name || qrData.student.erpId}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-slate-500 stroke-[1.5]" />
                  )}
                </div>
                <div
                  className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-1 rounded-full shadow border-2 border-slate-900"
                  title="Profile Active"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Student Details */}
              <h3 className="text-xl font-bold text-white mt-3">{qrData.student.name}</h3>

              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono text-cyan-400 font-bold mt-1 shadow-sm">
                <span>ERP ID: {qrData.student.erpId}</span>
              </div>

              <div className="flex items-center justify-center space-x-3 text-xs text-slate-300 font-medium mt-2">
                <span className="flex items-center space-x-1">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{getDeptLabel(qrData.student.department)}</span>
                </span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center space-x-1">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Section {qrData.student.section || 'A'}</span>
                </span>
              </div>

              {/* LARGE HIGH-CONTRAST QR CODE CONTAINER */}
              <div className="mt-6 p-4 bg-white rounded-2xl shadow-xl shadow-slate-950/50 border border-slate-200">
                <img
                  src={qrData.qrDataUrl}
                  alt="Student Attendance QR"
                  className="w-56 h-56 object-contain"
                />
              </div>

              {/* Security & Instructions */}
              <p className="mt-4 text-xs font-semibold text-slate-300">
                Attendance QR • Security Version v{qrData.qrTokenVersion}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                Scan by authorized club administrator only. Show directly on screen or download card.
              </p>
            </div>

            {/* RIGHT SIDE: Action Controls & Pass Info */}
            <div className="lg:col-span-5 space-y-5">
              {/* Action Buttons Box */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                  Pass Actions
                </h3>

                {/* Button 1: Download ID Card */}
                <button
                  onClick={handleDownloadIdCard}
                  disabled={isDownloadingCard}
                  className="w-full flex items-center justify-center space-x-2.5 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  <IdCard className="w-4 h-4" />
                  <span>{isDownloadingCard ? 'Generating Card...' : 'Download ID Card (PNG)'}</span>
                </button>

                {/* Button 2: Download QR Only */}
                <button
                  onClick={handleDownloadQrOnly}
                  className="w-full flex items-center justify-center space-x-2.5 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all border border-slate-700/60"
                >
                  <Download className="w-4 h-4" />
                  <span>Download QR Only</span>
                </button>

                {/* Button 3: Regenerate QR */}
                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={isRegenerating}
                  className="w-full flex items-center justify-center space-x-2.5 py-2.5 px-4 bg-slate-950/80 hover:bg-rose-950/30 text-rose-400 hover:text-rose-300 rounded-xl text-xs font-semibold transition-all border border-rose-900/30 hover:border-rose-500/50 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                  <span>Regenerate QR Code</span>
                </button>
              </div>

              {/* Security Details Box */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-3 text-xs text-slate-400">
                <div className="flex items-center space-x-2 text-indigo-400 font-bold uppercase text-[11px] tracking-wide">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Tamper-Proof Anti-Spoofing</span>
                </div>
                <p className="leading-relaxed">
                  Your QR pass does not contain plain text identifiers. It is signed with a high-entropy HMAC cryptographic signature.
                </p>
                <div className="pt-2 border-t border-slate-800 space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Active Version:</span>
                    <span className="text-white font-bold">v{qrData.qrTokenVersion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Verification:</span>
                    <span className="text-emerald-400 font-bold">Cryptographically Signed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {/* Confirmation Modal for Regeneration */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-white mb-2">
              Regenerate QR Code?
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Regenerating your QR will immediately invalidate your previous QR code. Any printed or saved copies of version v{qrData?.qrTokenVersion} will no longer scan at attendance sessions.
            </p>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRegenerate}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30 transition-all"
              >
                Yes, Regenerate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
