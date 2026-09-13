import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bus, Bell, Volume2, VolumeX, Shield, GraduationCap, 
  Briefcase, AlertTriangle, RefreshCw, ChevronDown, CheckCheck,
  Smartphone, Monitor, Radio, Compass, UserPlus, Sparkles, KeyRound, LogOut
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    currentUser, 
    users, 
    setCurrentUser, 
    notifications, 
    markAllNotificationsAsRead, 
    markNotificationAsRead,
    soundEnabled, 
    setSoundEnabled,
    simulateSuddenDelay,
    resetAllData,
    activeViewMode,
    setActiveViewMode,
    isSimulating,
    setIsSimulating,
    selectedBusId,
    setIsRegistrationOpen,
    logout
  } = useApp();

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4 text-rose-400" />;
      case 'student': return <GraduationCap className="w-4 h-4 text-amber-400" />;
      case 'staff': return <Briefcase className="w-4 h-4 text-emerald-400" />;
      case 'driver': return <Compass className="w-4 h-4 text-sky-400" />;
      default: return <GraduationCap className="w-4 h-4" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-rose-500/10 text-rose-300 border-rose-500/20';
      case 'student': return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
      case 'staff': return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
      case 'driver': return 'bg-sky-500/10 text-sky-300 border-sky-500/20';
      default: return 'bg-slate-700 text-slate-200 border-slate-600';
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100 shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
            <Bus className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-base sm:text-lg tracking-tight text-white flex items-center gap-1">
                BUS<span className="text-amber-400">LIVE</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className={`w-1.5 h-1.5 rounded-full bg-emerald-400 ${isSimulating ? 'animate-pulse' : ''}`}></span>
                {isSimulating ? 'GPS LIVE' : 'PAUSED'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">Your Campus. Your Bus. Live.</p>
          </div>
        </div>

        {/* Center: View Switcher Tabs */}
        <div className="hidden md:flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            id="view-mode-login"
            onClick={() => setActiveViewMode('login')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeViewMode === 'login'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Login Portal
          </button>
          <button
            id="view-mode-mobile"
            onClick={() => setActiveViewMode('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeViewMode === 'mobile'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Passenger App
          </button>
          <button
            id="view-mode-admin"
            onClick={() => setActiveViewMode('admin_portal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeViewMode === 'admin_portal'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            Admin Portal & Auditing
          </button>
          <button
            id="view-mode-driver"
            onClick={() => setActiveViewMode('driver_console')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeViewMode === 'driver_console'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            Driver Console
          </button>
        </div>

        {/* Right side actions: Real-time Register, Quick Simulator, Sound, Notifications, User Selector */}
        <div className="flex items-center gap-2">
          {/* Prominent Real-Time Pass Registration */}
          <button
            id="btn-realtime-register-navbar"
            onClick={() => setIsRegistrationOpen(true)}
            title="Register for a new student/faculty live bus pass in real-time"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Register Pass</span>
            <span className="sm:hidden">Register</span>
          </button>

          {/* Quick delay simulator button */}
          <button
            id="btn-simulate-delay"
            onClick={() => simulateSuddenDelay(selectedBusId || 'bus-101')}
            title="Trigger a simulated 15m delay with push notification to students"
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium transition"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Test Delay Alert</span>
          </button>

          {/* Sound toggle */}
          <button
            id="btn-sound-toggle"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition text-xs"
            title={soundEnabled ? 'Mute alert sounds' : 'Enable alert chimes'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Notification Bell with Badge */}
          <div className="relative">
            <button
              id="btn-notification-bell"
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="relative p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
              title="Push Notifications Center"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification drop menu */}
            {showNotifMenu && (
              <div 
                className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
                onMouseLeave={() => setShowNotifMenu(false)}
              >
                <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white">Live Push Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <CheckCheck className="w-3 h-3" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 p-1">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">No notifications yet</div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => markNotificationAsRead(notif.id)}
                        className={`p-3 text-xs transition cursor-pointer hover:bg-slate-800/50 rounded-xl ${
                          !notif.read ? 'bg-slate-800/30 font-medium' : 'text-slate-400'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className={`font-semibold ${notif.type === 'delay' ? 'text-amber-400' : notif.type === 'fee_reminder' ? 'text-rose-400' : 'text-slate-200'}`}>
                            {notif.title}
                          </span>
                          <span className="text-[10px] text-slate-500 whitespace-nowrap">{notif.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Role Switcher Menu */}
          <div className="relative">
            <button
              id="btn-user-role-selector"
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition ${getRoleBadgeColor(currentUser.role)}`}
            >
              <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700/80 flex items-center justify-center text-[10px] font-bold text-amber-400 shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div className="text-left hidden sm:block">
                <p className="leading-none text-[11px] text-white font-medium">{currentUser.name.split(' ')[0]}</p>
                <p className="text-[9px] uppercase tracking-wider opacity-80">{currentUser.role}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {showRoleMenu && (
              <div 
                className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-2 overflow-hidden"
                onMouseLeave={() => setShowRoleMenu(false)}
              >
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <p className="text-[11px] font-bold text-white uppercase tracking-wider">Switch Active Account</p>
                  <p className="text-[10px] text-slate-400">Test different user perspectives</p>
                </div>

                <div className="space-y-1">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setCurrentUser(u);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left text-xs transition ${
                        currentUser.id === u.id
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-amber-400 shrink-0">
                        {u.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white truncate">{u.name}</span>
                          <span className="text-[10px] uppercase font-bold text-slate-400">{u.role}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">{u.departmentOrClass || u.studentOrStaffId}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="pt-2 mt-2 border-t border-slate-800 flex flex-col gap-1.5 px-1">
                  <button
                    onClick={() => {
                      logout();
                      setShowRoleMenu(false);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out / Return to Login</span>
                  </button>
                  <div className="flex items-center justify-between px-1 pt-1">
                    <button
                      onClick={() => {
                        resetAllData();
                        setShowRoleMenu(false);
                      }}
                      className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Reset Demo Data
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
