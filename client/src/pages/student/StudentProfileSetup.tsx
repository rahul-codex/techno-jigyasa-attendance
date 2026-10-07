import { useState, useRef, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { studentApi } from '../../services/student.api';
import { DEPARTMENT_OPTIONS, SECTION_OPTIONS } from '../../types/auth.types';
import type { DepartmentType, SectionType } from '../../types/auth.types';
import {
  Camera,
  Trash2,
  User,
  Building2,
  Layers,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export const StudentProfileSetup = () => {
  const navigate = useNavigate();
  const { user, updateUserSession } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || '');
  const [department, setDepartment] = useState<DepartmentType | ''>(
    user?.department || ''
  );
  const [section, setSection] = useState<SectionType | ''>(user?.section || '');

  // Photo management state
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    user?.profileImage ? `http://localhost:5000${user.profileImage}` : null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPhotoRemoving, setIsPhotoRemoving] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Image size is too large. Maximum allowed size is 2MB.');
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Invalid file format. Please upload a JPG, JPEG, PNG, or WebP photo.');
      return;
    }

    setSelectedFile(file);
    setIsPhotoRemoving(false);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsPhotoRemoving(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedName = name.trim();

    // Validation
    if (!trimmedName) {
      setErrorMessage('Full name is required.');
      return;
    }

    if (trimmedName.length < 2) {
      setErrorMessage('Full name must contain at least 2 characters.');
      return;
    }

    if (!department) {
      setErrorMessage('Please select your department.');
      return;
    }

    if (!section) {
      setErrorMessage('Please select your section.');
      return;
    }

    // Photo is required for first-time profile completion
    if (!previewUrl && !selectedFile) {
      setErrorMessage('Please upload a clear profile photo to complete your registration.');
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. If a new photo file was picked, upload it first
      if (selectedFile) {
        await studentApi.uploadProfileImage(selectedFile);
      } else if (isPhotoRemoving && user?.profileImage) {
        await studentApi.deleteProfileImage();
      }

      // 2. Update profile details (Name, Department, Section)
      const updateRes = await studentApi.updateProfile({
        name: trimmedName,
        department: department as DepartmentType,
        section: section as SectionType,
      });

      if (updateRes.success && updateRes.data) {
        const finalStudent = updateRes.data.student;
        const isComplete = updateRes.data.isProfileComplete;

        // Update global auth state
        updateUserSession(finalStudent, isComplete);
        setSuccessMessage('✓ Profile completed successfully.');

        // Smooth redirect to dashboard
        setTimeout(() => {
          navigate('/student/dashboard', { replace: true });
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        {/* Header Branding */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 mb-3 shadow-lg shadow-indigo-500/10">
            <Sparkles className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold tracking-wider text-indigo-400 uppercase">
            TECHNO JIGYASA CLUB
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Complete Your Profile
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-sm mx-auto">
            Please fill in your student details to activate your digital attendance pass.
          </p>
        </div>

        {/* Profile Setup Card */}
        <div className="mt-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
          {/* Success Banner */}
          {successMessage && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-start space-x-3 text-sm">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{successMessage}</p>
                <p className="text-xs text-emerald-500/80 mt-0.5">Redirecting to your dashboard...</p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-start space-x-3 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Circular Profile Photo Upload UI */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative group">
                <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-indigo-500/40 bg-slate-950 flex items-center justify-center shadow-xl shadow-indigo-950/50">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Student Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <User className="w-12 h-12 stroke-[1.5]" />
                      <span className="text-[10px] mt-1 font-medium">No Photo</span>
                    </div>
                  )}
                </div>

                {/* Upload Button Overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg border-2 border-slate-900 transition-transform active:scale-95"
                  title="Upload profile photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Photo Action Links */}
              <div className="mt-3 flex items-center space-x-3 text-xs">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  {previewUrl ? 'Change Photo' : 'Upload Photo'}
                </button>
                {previewUrl && (
                  <>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="text-rose-400 hover:text-rose-300 flex items-center space-x-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  </>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                JPG, PNG, or WebP (Max 2MB)
              </p>
            </div>

            {/* Read-Only ERP ID Field */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wide">
                  ERP ID
                </label>
                <span className="text-[10px] text-indigo-400/90 font-medium bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  READ ONLY
                </span>
              </div>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                </div>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={user?.erpId || ''}
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-slate-300 text-sm font-mono cursor-not-allowed select-none opacity-80"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Registered college enrollment identifier (cannot be changed)
              </p>
            </div>

            {/* Full Name Field */}
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-slate-300 uppercase tracking-wide">
                Full Name <span className="text-indigo-400">*</span>
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="e.g. John Doe"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Department Dropdown */}
            <div>
              <label htmlFor="department" className="block text-xs font-medium text-slate-300 uppercase tracking-wide">
                Department <span className="text-indigo-400">*</span>
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Building2 className="h-4 w-4" />
                </div>
                <select
                  id="department"
                  value={department}
                  onChange={(e) => {
                    setDepartment(e.target.value as DepartmentType);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="" disabled className="bg-slate-900 text-slate-500">
                    Select your Department
                  </option>
                  {DEPARTMENT_OPTIONS.map((dept) => (
                    <option key={dept.value} value={dept.value} className="bg-slate-900 text-white">
                      {dept.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Section Dropdown */}
            <div>
              <label htmlFor="section" className="block text-xs font-medium text-slate-300 uppercase tracking-wide">
                Section <span className="text-indigo-400">*</span>
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Layers className="h-4 w-4" />
                </div>
                <select
                  id="section"
                  value={section}
                  onChange={(e) => {
                    setSection(e.target.value as SectionType);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="" disabled className="bg-slate-900 text-slate-500">
                    Select your Section
                  </option>
                  {SECTION_OPTIONS.map((sec) => (
                    <option key={sec.value} value={sec.value} className="bg-slate-900 text-white">
                      {sec.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/30"
              >
                {isSubmitting ? (
                  <span className="flex items-center space-x-2">
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Saving Profile...</span>
                  </span>
                ) : (
                  'Complete & Save Profile'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
