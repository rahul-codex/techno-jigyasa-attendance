import { useState, useRef, type FormEvent, type ChangeEvent, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { studentApi } from '../../services/student.api';
import { StudentNavbar } from '../../components/layout/StudentNavbar';
import { DEPARTMENT_OPTIONS, SECTION_OPTIONS } from '../../types/auth.types';
import type { DepartmentType, SectionType } from '../../types/auth.types';
import {
  User,
  Camera,
  Trash2,
  Building2,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Edit3,
  X,
  Calendar,
  Sparkles,
} from 'lucide-react';

export const StudentProfilePage = () => {
  const { user, updateUserSession } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
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

  // Status state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync state whenever user changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setDepartment(user.department || '');
      setSection(user.section || '');
      setPreviewUrl(user.profileImage ? `http://localhost:5000${user.profileImage}` : null);
    }
  }, [user]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Image size is too large. Maximum allowed size is 2MB.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Invalid file format. Please upload JPG, PNG, or WebP.');
      return;
    }

    setSelectedFile(file);
    setIsPhotoRemoving(false);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsPhotoRemoving(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setName(user?.name || '');
    setDepartment(user?.department || '');
    setSection(user?.section || '');
    setPreviewUrl(user?.profileImage ? `http://localhost:5000${user.profileImage}` : null);
    setSelectedFile(null);
    setIsPhotoRemoving(false);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedName = name.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage('Full name must contain at least 2 characters.');
      return;
    }

    if (!department) {
      setErrorMessage('Please select a department.');
      return;
    }

    if (!section) {
      setErrorMessage('Please select a section.');
      return;
    }

    try {
      setIsSubmitting(true);

      // Upload new photo if selected
      if (selectedFile) {
        const uploadRes = await studentApi.uploadProfileImage(selectedFile);
        if (uploadRes.success && uploadRes.data) {
          updateUserSession(uploadRes.data.student, uploadRes.data.isProfileComplete);
        }
      } else if (isPhotoRemoving && user?.profileImage) {
        const deleteRes = await studentApi.deleteProfileImage();
        if (deleteRes.success && deleteRes.data) {
          updateUserSession(deleteRes.data.student, deleteRes.data.isProfileComplete);
        }
      }

      // Update name, department, section
      const updateRes = await studentApi.updateProfile({
        name: trimmedName,
        department: department as DepartmentType,
        section: section as SectionType,
      });

      if (updateRes.success && updateRes.data) {
        updateUserSession(updateRes.data.student, updateRes.data.isProfileComplete);
        setSuccessMessage('✓ Profile updated successfully.');
        setIsEditing(false);
        setSelectedFile(null);
        setIsPhotoRemoving(false);

        setTimeout(() => {
          setSuccessMessage(null);
        }, 4000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update profile.');
    } finally {
      setIsSubmitting(false);
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

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Student Profile</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Personal Information
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage your identity and department credentials
            </p>
          </div>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all self-start sm:self-auto"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center space-x-3 text-sm">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center space-x-3 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Profile Card View / Edit Container */}
        <div className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          {!isEditing ? (
            /* VIEW MODE */
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {/* Large Profile Photo */}
                <div className="relative">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-indigo-500/30 bg-slate-950 flex items-center justify-center shadow-2xl">
                    {photoDisplay ? (
                      <img
                        src={photoDisplay}
                        alt={user?.name || user?.erpId}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-16 h-16 text-slate-600 stroke-[1.5]" />
                    )}
                  </div>
                </div>

                {/* Profile Details Grid */}
                <div className="flex-1 text-center sm:text-left space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{user?.name || 'Incomplete Profile'}</h2>
                    <p className="text-xs text-indigo-400 font-mono mt-0.5">ERP ID: {user?.erpId}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                      <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
                        <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Department</span>
                      </div>
                      <p className="text-sm font-semibold text-white">
                        {getDeptLabel(user?.department || null)}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                      <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
                        <Layers className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Section</span>
                      </div>
                      <p className="text-sm font-semibold text-white">
                        {user?.section ? `Section ${user.section}` : 'Not set'}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                      <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Account Status</span>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {user?.status}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                      <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Registration Date</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-300">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* EDIT MODE */
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6" noValidate>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <h3 className="text-lg font-bold text-white">Edit Profile Details</h3>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Photo Upload in Edit Mode */}
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-indigo-500/40 bg-slate-950 flex items-center justify-center shadow-lg">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-slate-600 stroke-[1.5]" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg border border-slate-900"
                    title="Change Photo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1 text-center sm:text-left">
                  <p className="text-xs font-semibold text-white">Profile Photo</p>
                  <div className="flex items-center space-x-3 text-xs">
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
                  <p className="text-[11px] text-slate-500">
                    JPG, PNG, or WebP. Maximum size: 2MB
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Read-Only ERP ID */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-300 uppercase tracking-wide">
                      ERP ID
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded">
                      READ ONLY
                    </span>
                  </div>
                  <input
                    type="text"
                    disabled
                    readOnly
                    value={user?.erpId || ''}
                    className="block w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-400 text-sm font-mono cursor-not-allowed select-none opacity-80"
                  />
                </div>

                {/* Full Name Field */}
                <div className="sm:col-span-2">
                  <label htmlFor="name" className="block text-xs font-medium text-slate-300 uppercase tracking-wide mb-1">
                    Full Name <span className="text-indigo-400">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="block w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>

                {/* Department Dropdown */}
                <div>
                  <label htmlFor="department" className="block text-xs font-medium text-slate-300 uppercase tracking-wide mb-1">
                    Department <span className="text-indigo-400">*</span>
                  </label>
                  <select
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as DepartmentType)}
                    className="block w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="" disabled className="bg-slate-900 text-slate-500">
                      Select Department
                    </option>
                    {DEPARTMENT_OPTIONS.map((dept) => (
                      <option key={dept.value} value={dept.value} className="bg-slate-900 text-white">
                        {dept.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Section Dropdown */}
                <div>
                  <label htmlFor="section" className="block text-xs font-medium text-slate-300 uppercase tracking-wide mb-1">
                    Section <span className="text-indigo-400">*</span>
                  </label>
                  <select
                    id="section"
                    value={section}
                    onChange={(e) => setSection(e.target.value as SectionType)}
                    className="block w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="" disabled className="bg-slate-900 text-slate-500">
                      Select Section
                    </option>
                    {SECTION_OPTIONS.map((sec) => (
                      <option key={sec.value} value={sec.value} className="bg-slate-900 text-white">
                        {sec.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving Changes...' : 'Save Profile'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};
