import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { StudentStaffMobileView } from './components/StudentStaffMobileView';
import { AdminDashboard } from './components/AdminDashboard';
import { DriverConsole } from './components/DriverConsole';
import { LoginPage } from './components/LoginPage';
import { NotificationToast } from './components/NotificationToast';
import { RealTimeRegistrationModal } from './components/RealTimeRegistrationModal';
import { 
  Smartphone, Monitor, Radio, AlertTriangle, 
  GraduationCap, Briefcase, Shield, Compass, Sparkles, UserPlus, KeyRound, LogOut, Code2 
} from 'lucide-react';

const MainContent: React.FC = () => {
  const { 
    activeViewMode, 
    setActiveViewMode, 
    currentUser, 
    setCurrentUser, 
    users, 
    simulateSuddenDelay, 
    triggerMonthEndFeeReminders,
    setIsRegistrationOpen 
  } = useApp();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <NotificationToast />
      <RealTimeRegistrationModal />

      {/* Quick Interactive Testing & Role Bar */}
      <aside aria-label="Testing Controls" className="bg-slate-900/60 border-b border-slate-800/80 px-3 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Quick Persona Switcher */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
              Test Personas:
            </span>
            {users.map((u) => {
              const isSelected = currentUser.id === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => {
                    setCurrentUser(u);
                    if (u.role === 'admin') setActiveViewMode('admin_portal');
                    else if (u.role === 'driver') setActiveViewMode('driver_console');
                    else setActiveViewMode('mobile');
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                    isSelected ? 'bg-slate-900/30 text-slate-950' : 'bg-slate-700/80 text-slate-200'
                  }`}>
                    {u.name.charAt(0)}
                  </span>
                  <span>{u.name.split(' ')[0]}</span>
                  <span className={`text-[9px] uppercase font-bold px-1 rounded ${
                    isSelected ? 'bg-slate-950/20 text-slate-900' : 'bg-slate-900 text-slate-400'
                  }`}>
                    {u.role}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Action Triggers for Testing / Presentation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveViewMode('login')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm ${
                activeViewMode === 'login'
                  ? 'bg-amber-500 text-slate-950 shadow-md ring-1 ring-amber-400'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Login Page</span>
            </button>
            <button
              onClick={() => setIsRegistrationOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Real-Time Register</span>
            </button>
            <button
              onClick={() => simulateSuddenDelay('bus-101')}
              className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>Delay (+15m)</span>
            </button>
            <button
              onClick={triggerMonthEndFeeReminders}
              className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <span>Month-End Notice</span>
            </button>
            <a
              href="/vanilla.html"
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Open Pure HTML, CSS & Vanilla JavaScript Version"
            >
              <Code2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Pure HTML/CSS/JS Mode</span>
            </a>
          </div>
        </div>
      </aside>

      {/* Main View Area */}
      <main className="flex-1 p-3 sm:p-6 flex flex-col justify-start">
        {activeViewMode === 'login' && (
          <LoginPage />
        )}

        {activeViewMode === 'mobile' && (
          <div className="w-full flex flex-col items-center justify-center my-auto">
            {/* Passenger App View Frame */}
            <StudentStaffMobileView />
          </div>
        )}

        {activeViewMode === 'admin_portal' && (
          <AdminDashboard />
        )}

        {activeViewMode === 'driver_console' && (
          <DriverConsole />
        )}
      </main>

      {/* Bottom Footer Note */}
      <footer className="py-3 px-4 border-t border-slate-900 text-center text-xs text-slate-500">
        <p>Bus Live Tracking & Fleet Management System • Real-Time GPS Simulation • Autonomous Month-End Fee Reminders</p>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
