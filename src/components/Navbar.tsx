import React from 'react';
import {
  Bell,
  Clock,
  Calendar,
  Sparkles,
  Volume2,
  History,
  Settings,
  Maximize2,
  Lock,
  Unlock,
  Sun,
  Moon,
  CalendarDays,
  Smartphone,
  Monitor,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export type ActiveTab =
  | 'dashboard'
  | 'timetable'
  | 'weekly'
  | 'holidays'
  | 'special'
  | 'sounds'
  | 'history'
  | 'settings';

interface Props {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  schoolName: string;
  isAutomaticActive: boolean;
  isPaused: boolean;
  isHolidayOrOff: boolean;
  isAdmin: boolean;
  onToggleAdmin: () => void;
  onOpenFullscreen: () => void;
  onQuickManualRing: () => void;
  onOpenSetBellTime?: () => void;
  onOpenAndroidModal: () => void;
  onOpenWindowsModal?: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  onTabChange,
  schoolName,
  isAutomaticActive,
  isPaused,
  isHolidayOrOff,
  isAdmin,
  onToggleAdmin,
  onOpenFullscreen,
  onQuickManualRing,
  onOpenSetBellTime,
  onOpenAndroidModal,
  onOpenWindowsModal,
  theme,
  onToggleTheme,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Clock },
    { id: 'timetable', label: 'Timetable', icon: Clock },
    { id: 'weekly', label: 'Weekly Schedule', icon: Calendar },
    { id: 'holidays', label: 'Holidays', icon: CalendarDays },
    { id: 'special', label: 'Special Schedule', icon: Sparkles },
    { id: 'sounds', label: 'Bell Sounds', icon: Volume2 },
    { id: 'history', label: 'Bell History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Main Top Bar */}
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl overflow-hidden bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center shadow-md shadow-amber-500/10 shrink-0 relative">
              <img
                src="/saraswoti_logo.jpg"
                alt="TR Memorial English Boarding School Emblem"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback if image fails to load
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <Bell className="w-5 h-5 fill-amber-500 text-amber-500 absolute inset-0 m-auto -z-10" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base sm:text-lg text-slate-900 dark:text-white tracking-tight leading-tight">
                  {schoolName || 'TR Memorial English Boarding School'}
                </span>
                {isAdmin ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 uppercase tracking-wider">
                    Admin
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    Viewer
                  </span>
                )}
              </div>
              <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold truncate max-w-[220px] sm:max-w-xs flex items-center gap-1">
                <span>Sukhad, Kailali</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500 dark:text-slate-400 font-normal">Automated Bell System</span>
              </div>
            </div>
          </div>

          {/* Status Indicator Chips */}
          <div className="hidden md:flex items-center gap-2">
            {isHolidayOrOff ? (
              <div className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Holiday / Day Off</span>
              </div>
            ) : isPaused ? (
              <div className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 text-xs font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Bell Paused</span>
              </div>
            ) : isAutomaticActive ? (
              <div className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 text-xs font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Auto Bell Active</span>
              </div>
            ) : (
              <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold">
                Manual Mode
              </div>
            )}
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-2">
            {/* Install App / Android APK Button */}
            <PWAInstallButton onOpenModal={onOpenAndroidModal} />

            <button
              onClick={onOpenAndroidModal}
              className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300/60 dark:border-amber-700/60 bg-amber-50/60 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-xs font-bold transition-colors cursor-pointer"
              title="Install on Android or Generate APK"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-500" />
              <span>Android APK</span>
            </button>

            {/* Windows PC & Laptop App Button */}
            {onOpenWindowsModal && (
              <button
                onClick={onOpenWindowsModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-400/80 dark:border-blue-600/80 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/70 text-blue-900 dark:text-blue-200 font-extrabold text-xs transition-colors cursor-pointer shadow-xs"
                title="TR Memorial School Bell for Windows PC & Laptop: Desktop App, Auto-Boot, Shortcuts"
              >
                <Monitor className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Windows App</span>
              </button>
            )}

            {/* Easy Manual Timing Hub Button */}
            <button
              onClick={onOpenSetBellTime || onQuickManualRing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-400/80 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-extrabold text-xs transition-colors cursor-pointer shadow-xs"
              title="Easy Manual Timing: Instant ring, set bell time, or delay schedule"
            >
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Manual Timing</span>
            </button>

            {/* Quick 1-Strike Ring Now Button */}
            <button
              onClick={onQuickManualRing}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
              title="Ring Temple Bell (1 Strike) Immediately"
            >
              <Bell className="w-4 h-4 fill-slate-950" />
              <span className="hidden sm:inline">Ring Now</span>
            </button>

            {/* Fullscreen Mode Button */}
            <button
              onClick={onOpenFullscreen}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Open Fullscreen Speaker Display"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Admin Lock / Unlock */}
            <button
              onClick={onToggleAdmin}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isAdmin
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={isAdmin ? 'Lock Admin Mode' : 'Unlock Admin Mode (PIN)'}
            >
              {isAdmin ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Toggle Light / Dark Mode"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <nav className="flex space-x-1 overflow-x-auto pb-1 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id as ActiveTab)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'text-amber-700 dark:text-amber-400 bg-amber-50/80 dark:bg-amber-950/40 border-b-2 border-amber-500'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
