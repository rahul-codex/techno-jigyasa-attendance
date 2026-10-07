import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { StudentLogin } from './pages/auth/StudentLogin';
import { StudentRegister } from './pages/auth/StudentRegister';
import { AdminLogin } from './pages/auth/AdminLogin';
import { StudentProfileSetup } from './pages/student/StudentProfileSetup';
import { StudentProfilePage } from './pages/student/StudentProfilePage';
import { StudentQrPage } from './pages/student/StudentQrPage';
import { StudentDashboardPlaceholder } from './pages/student/StudentDashboardPlaceholder';
import { StudentAttendancePage } from './pages/student/StudentAttendancePage';
import { AdminDashboardPlaceholder } from './pages/admin/AdminDashboardPlaceholder';
import { AdminScannerPage } from './pages/admin/AdminScannerPage';
import { AdminAttendancePage } from './pages/admin/AdminAttendancePage';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AdminProtectedRoute } from './routes/AdminProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AdminAuthProvider>
          <Routes>
            {/* Student Public Auth Routes */}
            <Route path="/student/login" element={<StudentLogin />} />
            <Route path="/student/register" element={<StudentRegister />} />

            {/* Admin Public Auth Route */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* First Login Mandatory Student Profile Setup */}
            <Route
              path="/student/profile/setup"
              element={
                <ProtectedRoute requireCompleteProfile={false}>
                  <StudentProfileSetup />
                </ProtectedRoute>
              }
            />

            {/* Protected Student Profile View / Edit Page */}
            <Route
              path="/student/profile"
              element={
                <ProtectedRoute requireCompleteProfile={true}>
                  <StudentProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Personal Student QR Code & Digital ID Pass Page */}
            <Route
              path="/student/qr"
              element={
                <ProtectedRoute requireCompleteProfile={true}>
                  <StudentQrPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Student Attendance History & Overview */}
            <Route
              path="/student/attendance"
              element={
                <ProtectedRoute requireCompleteProfile={true}>
                  <StudentAttendancePage />
                </ProtectedRoute>
              }
            />

            {/* Protected Student Dashboard */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute requireCompleteProfile={true}>
                  <StudentDashboardPlaceholder />
                </ProtectedRoute>
              }
            />

            {/* Protected Admin Dashboard */}
            <Route
              path="/admin/dashboard"
              element={
                <AdminProtectedRoute>
                  <AdminDashboardPlaceholder />
                </AdminProtectedRoute>
              }
            />

            {/* Protected Admin QR Scanner */}
            <Route
              path="/admin/scanner"
              element={
                <AdminProtectedRoute>
                  <AdminScannerPage />
                </AdminProtectedRoute>
              }
            />

            {/* Protected Admin Attendance Session Management */}
            <Route
              path="/admin/attendance"
              element={
                <AdminProtectedRoute>
                  <AdminAttendancePage />
                </AdminProtectedRoute>
              }
            />

            {/* Default Fallback Redirects */}
            <Route path="/" element={<Navigate to="/student/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/student/login" replace />} />
          </Routes>
        </AdminAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
