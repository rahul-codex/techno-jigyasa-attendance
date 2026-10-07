import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { adminScannerApi, type ScannerVerifyData } from '../../services/adminScanner.api';
import {
  Camera,
  CameraOff,
  Shield,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  User,
  Building,
  Hash,
  RefreshCw,
  Check,
  AlertTriangle,
  Info,
} from 'lucide-react';

export const AdminScannerPage = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const [cameraUnavailable, setCameraUnavailable] = useState(false);

  // Scan state
  const [isVerifying, setIsVerifying] = useState(false);
  const [scannedResult, setScannedResult] = useState<ScannerVerifyData | null>(null);
  const [currentQrToken, setCurrentQrToken] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Mark Present state
  const [isMarkingPresent, setIsMarkingPresent] = useState(false);
  const [markPresentMessage, setMarkPresentMessage] = useState<{
    type: 'success' | 'warning' | 'info';
    text: string;
  } | null>(null);

  const scannerInstanceRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);

  const startScanner = async () => {
    setScannerError(null);
    setCameraPermissionDenied(false);
    setCameraUnavailable(false);

    try {
      if (!scannerInstanceRef.current) {
        scannerInstanceRef.current = new Html5Qrcode('qr-reader-container');
      }

      const qrCode = scannerInstanceRef.current;

      if (qrCode.isScanning) {
        return;
      }

      const qrConfig = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await qrCode.start(
        { facingMode: 'environment' },
        qrConfig,
        (decodedText: string) => {
          handleScanSuccess(decodedText);
        },
        () => {
          // Frame scan error - ignore per-frame failures
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error('Camera initialization error:', err);
      const errMsg = err?.message || String(err);
      if (
        errMsg.toLowerCase().includes('permission') ||
        errMsg.toLowerCase().includes('denied') ||
        errMsg.toLowerCase().includes('notallowederror')
      ) {
        setCameraPermissionDenied(true);
        setScannerError('Camera permission was denied. Please allow camera access in your browser settings.');
      } else if (
        errMsg.toLowerCase().includes('notfounderror') ||
        errMsg.toLowerCase().includes('no device') ||
        errMsg.toLowerCase().includes('device not found')
      ) {
        setCameraUnavailable(true);
        setScannerError('No camera device detected on this system.');
      } else {
        setScannerError('Unable to start camera. Please verify device permissions and try again.');
      }
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerInstanceRef.current && scannerInstanceRef.current.isScanning) {
      try {
        await scannerInstanceRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  const handleScanSuccess = async (qrToken: string) => {
    // Prevent simultaneous requests
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    // Immediately stop camera scan to freeze frame
    await stopScanner();

    setIsVerifying(true);
    setVerificationError(null);
    setMarkPresentMessage(null);
    setCurrentQrToken(qrToken);

    try {
      const response = await adminScannerApi.verifyQr(qrToken);
      if (response.success && response.data) {
        setScannedResult(response.data);
      } else {
        setVerificationError(response.message || 'Invalid QR code.');
      }
    } catch (err: any) {
      setVerificationError(
        err.message || 'QR code verification failed. Please ask the student to present a valid QR.'
      );
    } finally {
      setIsVerifying(false);
      isProcessingRef.current = false;
    }
  };

  const resetForNextScan = async () => {
    setScannedResult(null);
    setCurrentQrToken(null);
    setVerificationError(null);
    setMarkPresentMessage(null);
    isProcessingRef.current = false;
    await startScanner();
  };

  const handleMarkPresent = async () => {
    if (!currentQrToken) return;

    setIsMarkingPresent(true);
    setMarkPresentMessage(null);

    try {
      const response = await adminScannerApi.markPresent(currentQrToken);
      if (response.success) {
        setMarkPresentMessage({
          type: 'success',
          text: response.message || 'Student attendance marked as Present ✓',
        });
        if (scannedResult) {
          setScannedResult({
            ...scannedResult,
            attendanceStatus: 'PRESENT',
          });
        }
      } else {
        // Attendance system not ready or already marked
        const responseCode = (response as any).code || response.data?.code;
        setMarkPresentMessage({
          type: responseCode === 'ALREADY_PRESENT' ? 'warning' : 'info',
          text: response.message || 'Attendance action completed.',
        });
      }
    } catch (err: any) {
      setMarkPresentMessage({
        type: 'warning',
        text: err.message || 'Failed to record attendance. Please try again.',
      });
    } finally {
      setIsMarkingPresent(false);
    }
  };

  // Start scanner on mount and clean up on unmount
  useEffect(() => {
    startScanner();

    return () => {
      if (scannerInstanceRef.current) {
        if (scannerInstanceRef.current.isScanning) {
          scannerInstanceRef.current.stop().catch(console.error);
        }
      }
    };
  }, []);

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
                <span>QR Scanner</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase">
                  Live Verify
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/admin/dashboard"
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Scanner Viewport Section */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div className="flex items-center space-x-2.5">
                <Camera className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">Device Camera Feed</h2>
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-2">
                {isScanning ? (
                  <button
                    onClick={stopScanner}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-all cursor-pointer"
                  >
                    <CameraOff className="w-3.5 h-3.5" />
                    <span>Stop Camera</span>
                  </button>
                ) : (
                  <button
                    onClick={startScanner}
                    disabled={isVerifying}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Start Camera</span>
                  </button>
                )}
              </div>
            </div>

            {/* Video Viewport Container */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/80 min-h-[300px] flex items-center justify-center">
              {/* HTML5 QR Container */}
              <div id="qr-reader-container" className="w-full max-w-[420px]" />

              {/* Verifying Overlay */}
              {isVerifying && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
                  <div className="w-10 h-10 border-3 border-amber-400/30 border-t-amber-400 rounded-full animate-spin mb-4" />
                  <p className="text-sm font-bold text-white">Verifying Student QR Code...</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Validating cryptographic HMAC signature against club database
                  </p>
                </div>
              )}

              {/* Camera Error Display */}
              {scannerError && !isScanning && !isVerifying && (
                <div className="p-6 text-center max-w-sm">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-3">
                    <CameraOff className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">
                    {cameraPermissionDenied
                      ? 'Camera Permission Required'
                      : cameraUnavailable
                      ? 'No Camera Found'
                      : 'Camera Initialization Failed'}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    {scannerError}
                  </p>
                  <button
                    onClick={startScanner}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
                  >
                    Retry Camera
                  </button>
                </div>
              )}
            </div>

            {/* Scanner Guidance Footer */}
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Encrypted &amp; Tamper-Proof Scan</span>
              </span>
              <span>Point camera at Student Digital QR Card</span>
            </div>
          </div>

          {/* Verification Result Section */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-sm">
            <h2 className="text-base font-bold text-white pb-4 border-b border-slate-800 mb-6 flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Student Verification Card</span>
            </h2>

            {/* Case 1: Active Verified Student Card */}
            {scannedResult ? (
              <div className="space-y-6">
                {/* Verified Header Badge */}
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-bold">Student Verified ✓</span>
                  </div>
                  <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    Active Account
                  </span>
                </div>

                {/* Student Identity Card */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
                  <div className="flex items-center space-x-4">
                    {/* Profile Photo */}
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center text-slate-400">
                      {scannedResult.student.profileImage ? (
                        <img
                          src={scannedResult.student.profileImage}
                          alt={scannedResult.student.name || 'Student Photo'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8" />
                      )}
                    </div>

                    {/* Basic Info */}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-white truncate">
                        {scannedResult.student.name || 'Student Name'}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="inline-flex items-center space-x-1 text-xs font-mono font-semibold text-amber-400">
                          <Hash className="w-3 h-3" />
                          <span>{scannedResult.student.erpId}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Academic Details */}
                  <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Department</span>
                      <span className="font-semibold text-slate-200 flex items-center space-x-1">
                        <Building className="w-3 h-3 text-slate-500" />
                        <span>{scannedResult.student.department || 'N/A'}</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Section</span>
                      <span className="font-semibold text-slate-200">
                        {scannedResult.student.section ? `Section ${scannedResult.student.section}` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Current Attendance Status */}
                <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3.5 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Current Status:</span>
                  <span
                    className={`font-bold px-2.5 py-1 rounded-lg uppercase ${
                      scannedResult.attendanceStatus === 'PRESENT'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : scannedResult.attendanceStatus === 'NO_ACTIVE_SESSION'
                        ? 'bg-slate-800 text-slate-400 border border-slate-700'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {scannedResult.attendanceStatus === 'NO_ACTIVE_SESSION'
                      ? 'No Active Session'
                      : scannedResult.attendanceStatus}
                  </span>
                </div>

                {/* Mark Present Feedback Message */}
                {markPresentMessage && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs flex items-start space-x-2.5 ${
                      markPresentMessage.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : markPresentMessage.type === 'warning'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                    }`}
                  >
                    {markPresentMessage.type === 'success' ? (
                      <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    ) : markPresentMessage.type === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    )}
                    <span>{markPresentMessage.text}</span>
                  </div>
                )}

                {/* No Active Session Warning */}
                {scannedResult.attendanceStatus === 'NO_ACTIVE_SESSION' && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start space-x-2.5">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
                    <div>
                      <p className="font-bold">No attendance session is currently active.</p>
                      <p className="mt-0.5 text-slate-400">
                        Please start Morning or Afternoon session from{' '}
                        <Link to="/admin/attendance" className="text-amber-400 underline font-semibold">
                          Attendance Management
                        </Link>{' '}
                        before recording attendance.
                      </p>
                    </div>
                  </div>
                )}

                {/* Explicit Action Buttons */}
                <div className="space-y-3 pt-2">
                  <button
                    id="mark-present-btn"
                    onClick={handleMarkPresent}
                    disabled={
                      isMarkingPresent ||
                      scannedResult.attendanceStatus === 'PRESENT' ||
                      scannedResult.attendanceStatus === 'NO_ACTIVE_SESSION'
                    }
                    className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-400/20 active:scale-[0.99] cursor-pointer"
                  >
                    {isMarkingPresent ? (
                      <>
                        <span className="w-4 h-4 border-2 border-slate-900/40 border-t-slate-900 rounded-full animate-spin" />
                        <span>RECORDING ATTENDANCE...</span>
                      </>
                    ) : scannedResult.attendanceStatus === 'PRESENT' ? (
                      <>
                        <Check className="w-4 h-4 text-slate-900" />
                        <span>ALREADY MARKED PRESENT</span>
                      </>
                    ) : scannedResult.attendanceStatus === 'NO_ACTIVE_SESSION' ? (
                      <span>NO ATTENDANCE SESSION ACTIVE</span>
                    ) : (
                      <span>MARK PRESENT</span>
                    )}
                  </button>

                  <button
                    onClick={resetForNextScan}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Scan Next Student</span>
                  </button>
                </div>
              </div>
            ) : verificationError ? (
              /* Case 2: Verification Error Banner */
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Verification Failed</h3>
                <p className="text-xs text-rose-300 leading-relaxed mb-6">
                  {verificationError}
                </p>
                <button
                  onClick={resetForNextScan}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Scan Next QR Code</span>
                </button>
              </div>
            ) : (
              /* Case 3: Idle / Ready State */
              <div className="py-12 px-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-slate-500 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Ready to Scan</h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Align student's digital QR pass in front of the camera. The verified profile card will appear here automatically.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
