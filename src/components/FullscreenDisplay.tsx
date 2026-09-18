import React from 'react';
import { Minimize, Bell, Clock, Calendar, Sparkles, Pause, Play, AlertCircle } from 'lucide-react';
import { formatDisplayTime } from '../services/scheduler';
import { Period, ScheduledBellEvent } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  schoolName: string;
  currentTime: Date;
  timeFormat: '12h' | '24h';
  currentPeriod: Period | null;
  nextBell: ScheduledBellEvent | null;
  countdownString: string;
  isAutomaticActive: boolean;
  isPaused: boolean;
  isHolidayOrOff: boolean;
  holidayName?: string;
  onManualRing: () => void;
  onTogglePause: () => void;
}

export const FullscreenDisplay: React.FC<Props> = ({
  isOpen,
  onClose,
  schoolName,
  currentTime,
  timeFormat,
  currentPeriod,
  nextBell,
  countdownString,
  isAutomaticActive,
  isPaused,
  isHolidayOrOff,
  holidayName,
  onManualRing,
  onTogglePause,
}) => {
  if (!isOpen) return null;

  // Format date display
  const dateStr = currentTime.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Hours, minutes, seconds string
  let timeStr = '';
  let ampmStr = '';
  if (timeFormat === '24h') {
    timeStr = currentTime.toTimeString().split(' ')[0];
  } else {
    let hours = currentTime.getHours();
    const mins = currentTime.getMinutes().toString().padStart(2, '0');
    const secs = currentTime.getSeconds().toString().padStart(2, '0');
    ampmStr = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    timeStr = `${hours}:${mins}:${secs}`;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between p-8 sm:p-12 overflow-hidden select-none relative">
      {/* Background Watermark */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.06] overflow-hidden">
        <img
          src="/saraswoti_logo.jpg"
          alt="TR Memorial English Boarding School Emblem"
          className="w-[700px] h-[700px] object-contain filter drop-shadow-2xl"
        />
      </div>

      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-500/10 shrink-0">
            <img
              src="/saraswoti_logo.jpg"
              alt="TR Memorial English Boarding School Emblem"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">{schoolName || 'TR Memorial English Boarding School'}</h1>
            <div className="flex items-center gap-2 text-sm text-slate-400 mt-0.5">
              <span className="font-bold text-amber-400">Sukhad, Kailali</span>
              <span>•</span>
              <Calendar className="w-4 h-4 text-amber-500" />
              <span>{dateStr}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Badge */}
          {isHolidayOrOff ? (
            <div className="px-4 py-1.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs sm:text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>Holiday: {holidayName || 'School Closed'}</span>
            </div>
          ) : isPaused ? (
            <div className="px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs sm:text-sm font-semibold flex items-center gap-2">
              <Pause className="w-4 h-4" />
              <span>Bell Schedule Paused</span>
            </div>
          ) : isAutomaticActive ? (
            <div className="px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs sm:text-sm font-semibold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Automatic Bell System Active</span>
            </div>
          ) : (
            <div className="px-4 py-1.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs sm:text-sm font-semibold">
              Manual Mode
            </div>
          )}

          <button
            onClick={onClose}
            className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Exit Fullscreen Mode"
          >
            <Minimize className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Center Clock & Status Matrix */}
      <div className="my-auto py-8">
        <div className="text-center mb-10">
          <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">
            Official Synchronized Clock
          </div>
          <div className="inline-flex items-baseline justify-center font-mono font-bold tracking-tight text-6xl sm:text-8xl md:text-9xl text-white drop-shadow-md">
            <span>{timeStr}</span>
            {ampmStr && <span className="ml-3 text-3xl sm:text-5xl text-amber-400 font-sans font-bold">{ampmStr}</span>}
          </div>
        </div>

        {/* 3 Main Display Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Column 1: Current Period */}
          <div className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-sm text-center">
            <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">
              Current Period
            </div>
            {currentPeriod ? (
              <div>
                <div className="text-3xl font-extrabold text-amber-400 mb-1">{currentPeriod.name}</div>
                <div className="text-slate-400 text-sm font-mono">
                  {formatDisplayTime(currentPeriod.startTime, timeFormat)} –{' '}
                  {formatDisplayTime(currentPeriod.endTime, timeFormat)}
                </div>
              </div>
            ) : (
              <div className="py-2">
                <div className="text-2xl font-bold text-slate-400">Recess / Between Periods</div>
                <div className="text-slate-500 text-xs mt-1">No active class session</div>
              </div>
            )}
          </div>

          {/* Column 2: Next Bell */}
          <div className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-sm text-center">
            <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">Next Bell</div>
            {nextBell ? (
              <div>
                <div className="text-3xl font-extrabold text-white mb-1 flex items-center justify-center gap-2">
                  <Bell className="w-6 h-6 text-amber-400 shrink-0" />
                  <span className="truncate">{nextBell.eventName}</span>
                </div>
                <div className="text-amber-400 text-lg font-mono font-bold">
                  At {formatDisplayTime(nextBell.timeString, timeFormat)}
                </div>
              </div>
            ) : (
              <div className="py-2">
                <div className="text-2xl font-bold text-slate-400">Day Dismissed</div>
                <div className="text-slate-500 text-xs mt-1">No more scheduled bells today</div>
              </div>
            )}
          </div>

          {/* Column 3: Live Countdown */}
          <div className="bg-gradient-to-b from-amber-500/10 to-amber-600/5 rounded-3xl p-6 border border-amber-500/30 text-center">
            <div className="text-xs uppercase tracking-wider text-amber-400 font-semibold mb-2 flex items-center justify-center gap-1.5">
              <Clock className="w-4 h-4" />
              Countdown to Bell
            </div>
            <div className="text-4xl sm:text-5xl font-mono font-extrabold text-amber-400 tracking-wider">
              {nextBell ? countdownString : '--:--:--'}
            </div>
            <div className="text-xs text-amber-200/70 mt-1">
              {nextBell ? 'Precision countdown to bell strike' : 'Schedule idle'}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Large Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/80 pt-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onTogglePause}
            className={`px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all cursor-pointer ${
              isPaused
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            <span>{isPaused ? 'Resume Bell Schedule' : 'Pause Schedule'}</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onManualRing}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-lg tracking-wide shadow-xl shadow-amber-500/20 flex items-center gap-3 transition-transform active:scale-95 cursor-pointer"
          >
            <Bell className="w-6 h-6 fill-slate-950 animate-bounce" />
            <span>RING BELL NOW</span>
          </button>
        </div>
      </div>
    </div>
  );
};
