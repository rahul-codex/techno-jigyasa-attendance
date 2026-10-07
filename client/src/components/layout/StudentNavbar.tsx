import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  User,
  QrCode,
  CalendarCheck,
  LogOut,
  Sparkles,
} from 'lucide-react';

export const StudentNavbar = () => {
  const { user, logout, isProfileComplete } = useAuth();
  const location = useLocation();

  interface NavItem {
    name: string;
    path: string;
    icon: typeof LayoutDashboard;
    active: boolean;
    disabled: boolean;
    badge?: string;
  }

  const navItems: NavItem[] = [
    {
      name: 'Dashboard',
      path: '/student/dashboard',
      icon: LayoutDashboard,
      active: location.pathname === '/student/dashboard',
      disabled: !isProfileComplete,
    },
    {
      name: 'My Profile',
      path: '/student/profile',
      icon: User,
      active: location.pathname === '/student/profile',
      disabled: !isProfileComplete,
    },
    {
      name: 'My QR Pass',
      path: '/student/qr',
      icon: QrCode,
      active: location.pathname === '/student/qr',
      disabled: !isProfileComplete,
    },
    {
      name: 'Attendance',
      path: '/student/attendance',
      icon: CalendarCheck,
      active: location.pathname === '/student/attendance',
      disabled: !isProfileComplete,
    },
  ];

  const photoUrl = user?.profileImage
    ? `http://localhost:5000${user.profileImage}`
    : null;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <Link
              to={isProfileComplete ? '/student/dashboard' : '/student/profile/setup'}
              className="flex items-center space-x-2.5 group"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center group-hover:scale-105 transition-all shadow-md shadow-indigo-600/10">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 block -mb-0.5">
                  Techno Jigyasa
                </span>
                <span className="text-sm font-extrabold text-white tracking-tight">
                  Attendance System
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              if (item.disabled) {
                return (
                  <span
                    key={item.name}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 cursor-not-allowed select-none"
                    title={item.badge ? `${item.name} will be unlocked in ${item.badge}` : 'Complete your profile first'}
                  >
                    <Icon className="w-4 h-4 opacity-50" />
                    <span>{item.name}</span>
                    {item.badge && (
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full border border-slate-700">
                        {item.badge}
                      </span>
                    )}
                  </span>
                );
              }

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    item.active
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action: User Avatar & Logout */}
          <div className="flex items-center space-x-3">
            {user && (
              <div className="flex items-center space-x-2.5 bg-slate-950/60 border border-slate-800/80 rounded-full py-1 pl-1.5 pr-3">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={user.name || user.erpId}
                    className="w-7 h-7 rounded-full object-cover border border-indigo-500/40"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/30">
                    {user.name ? user.name.charAt(0).toUpperCase() : user.erpId.charAt(0)}
                  </div>
                )}
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-semibold text-white truncate max-w-[120px]">
                    {user.name || user.erpId}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono -mt-0.5">{user.erpId}</p>
                </div>
              </div>
            )}

            <button
              onClick={logout}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-lg transition-all"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
