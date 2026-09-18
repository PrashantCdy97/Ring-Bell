import React, { useState } from 'react';
import {
  Bell,
  Clock,
  Calendar,
  Play,
  Pause,
  SkipForward,
  Slash,
  Maximize2,
  Volume2,
  AlertTriangle,
  Flame,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Timer,
  VolumeX,
  Trash2,
  Plus,
  Monitor,
} from 'lucide-react';
import { BellSound, Period, ScheduledBellEvent, SchoolSettings } from '../types';
import { formatDisplayTime, timeToMinutes } from '../services/scheduler';

interface Props {
  schoolSettings: SchoolSettings;
  currentTime: Date;
  todayDayName: string;
  todayDateFormatted: string;
  isAutomaticActive: boolean;
  isPaused: boolean;
  isTodayDisabled: boolean;
  isHolidayOrOff: boolean;
  holidayName?: string;
  specialScheduleTitle?: string;
  currentPeriod: Period | null;
  nextBell: ScheduledBellEvent | null;
  previousBell: ScheduledBellEvent | null;
  countdownString: string;
  todayScheduleTimeline: {
    event: ScheduledBellEvent;
    status: 'completed' | 'in_progress' | 'upcoming';
  }[];
  sounds: BellSound[];
  isAdmin: boolean;
  onRingNow: () => void;
  onOpenSetBellTime?: () => void;
  onOpenWindowsModal?: () => void;
  onDeleteManualBell?: (id: string) => void;
  onToggleAutomatic: () => void;
  onTogglePause: () => void;
  onSkipNextBell: () => void;
  onDisableTodaySchedule: () => void;
  onPostponeNextBell: (minutes: number) => void;
  onTriggerEmergencyBell: (type: 'fire' | 'evacuation' | 'earthquake' | 'lockdown') => void;
  onOpenFullscreen: () => void;
  onRequestAdmin: () => void;
}

export const Dashboard: React.FC<Props> = ({
  schoolSettings,
  currentTime,
  todayDayName,
  todayDateFormatted,
  isAutomaticActive,
  isPaused,
  isTodayDisabled,
  isHolidayOrOff,
  holidayName,
  specialScheduleTitle,
  currentPeriod,
  nextBell,
  previousBell,
  countdownString,
  todayScheduleTimeline,
  sounds,
  isAdmin,
  onRingNow,
  onOpenSetBellTime,
  onOpenWindowsModal,
  onDeleteManualBell,
  onToggleAutomatic,
  onTogglePause,
  onSkipNextBell,
  onDisableTodaySchedule,
  onPostponeNextBell,
  onTriggerEmergencyBell,
  onOpenFullscreen,
  onRequestAdmin,
}) => {
  const [showEmergencyPanel, setShowEmergencyPanel] = useState(false);
  const [showPostponeMenu, setShowPostponeMenu] = useState(false);

  // Time format display
  let timeStr = '';
  let ampmStr = '';
  if (schoolSettings.timeFormat === '24h') {
    timeStr = currentTime.toTimeString().split(' ')[0];
  } else {
    let hours = currentTime.getHours();
    const mins = currentTime.getMinutes().toString().padStart(2, '0');
    const secs = currentTime.getSeconds().toString().padStart(2, '0');
    ampmStr = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    timeStr = `${hours}:${mins}:${secs}`;
  }

  // Calculate today's completed periods
  const completedCount = todayScheduleTimeline.filter((t) => t.status === 'completed').length;
  const totalCount = todayScheduleTimeline.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner Card: Live Clock, School Name, Automatic Bell Status */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            {/* Saraswati School Crest / Logo */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl overflow-hidden bg-amber-500/10 border-2 border-amber-500/40 shadow-lg shadow-amber-500/15 shrink-0 flex items-center justify-center p-0.5">
              <img
                src="/saraswoti_logo.jpg"
                alt="TR Memorial English Boarding School Emblem"
                className="w-full h-full object-cover rounded-[22px]"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  Campus Bell & Audio Broadcast
                </span>
                {specialScheduleTitle && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                    Special: {specialScheduleTitle}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                {schoolSettings.schoolName}
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                <span className="font-bold text-amber-600 dark:text-amber-400">Sukhad, Kailali</span>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  <span>
                    {todayDayName}, {todayDateFormatted}
                  </span>
                </div>
                <span>•</span>
                <span className="font-mono text-xs text-slate-400">{schoolSettings.timezone}</span>
              </div>
            </div>
          </div>

          {/* Large Live Digital Clock & Status */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:text-right">
            <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                Current Time
              </div>
              <div className="font-mono font-black text-3xl sm:text-4xl text-slate-900 dark:text-white flex items-baseline gap-1">
                <span>{timeStr}</span>
                {ampmStr && <span className="text-sm font-sans font-bold text-amber-500">{ampmStr}</span>}
              </div>
            </div>

            {/* Mode Badge */}
            <div className="flex flex-col gap-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Mode
              </div>
              {isHolidayOrOff ? (
                <div className="px-4 py-2 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>HOLIDAY / CLOSED</span>
                </div>
              ) : isTodayDisabled ? (
                <div className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5">
                  <Slash className="w-3.5 h-3.5" />
                  <span>SCHEDULE DISABLED</span>
                </div>
              ) : isPaused ? (
                <div className="px-4 py-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-xs font-bold flex items-center gap-1.5">
                  <Pause className="w-3.5 h-3.5" />
                  <span>PAUSED</span>
                </div>
              ) : isAutomaticActive ? (
                <div className="px-4 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>AUTOMATIC ON</span>
                </div>
              ) : (
                <div className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                  MANUAL MODE
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Primary High-Impact "RING BELL NOW" + "SET BELL TIME" + Action Button Bar */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onRingNow}
              className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-sm sm:text-base tracking-wide shadow-lg shadow-amber-500/25 flex items-center gap-2.5 transition-transform active:scale-95 cursor-pointer"
              title="Ring Temple Bell (1-Strike) Instantly"
            >
              <Bell className="w-5 h-5 sm:w-6 sm:h-6 fill-slate-950 animate-bounce" />
              <span>RING BELL (1x NOW)</span>
            </button>

            {onOpenSetBellTime && (
              <button
                onClick={onOpenSetBellTime}
                className="px-5 sm:px-6 py-3.5 sm:py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-extrabold text-sm sm:text-base tracking-wide shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
                title="Open Manual Timing: Schedule custom bell time, delay schedule, or trigger presets"
              >
                <Clock className="w-5 h-5 text-amber-400 dark:text-amber-500" />
                <span>MANUAL TIMING</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Start / Pause Schedule */}
            <button
              onClick={onTogglePause}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border transition-all cursor-pointer ${
                isPaused
                  ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : 'bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              <span>{isPaused ? 'Resume Schedule' : 'Pause Schedule'}</span>
            </button>

            {/* Skip Next Bell */}
            <button
              onClick={() => {
                if (!isAdmin) onRequestAdmin();
                else onSkipNextBell();
              }}
              disabled={!nextBell}
              className="px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title="Skip the next scheduled bell strike"
            >
              <SkipForward className="w-4 h-4" />
              <span>Skip Next Bell</span>
            </button>

            {/* Postpone / Snooze Menu */}
            <div className="relative">
              <button
                onClick={() => setShowPostponeMenu(!showPostponeMenu)}
                disabled={!nextBell}
                className="px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <Timer className="w-4 h-4" />
                <span>Postpone</span>
              </button>

              {showPostponeMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-20 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                    Delay Next Bell
                  </div>
                  {[5, 10, 15, 20].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => {
                        onPostponeNextBell(mins);
                        setShowPostponeMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-amber-50 dark:hover:bg-amber-950/50 text-slate-700 dark:text-slate-200"
                    >
                      +{mins} Minutes
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Disable Today's Schedule */}
            <button
              onClick={() => {
                if (!isAdmin) onRequestAdmin();
                else onDisableTodaySchedule();
              }}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border transition-colors cursor-pointer ${
                isTodayDisabled
                  ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900'
                  : 'bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Slash className="w-4 h-4" />
              <span>{isTodayDisabled ? 'Re-enable Today' : 'Disable Today'}</span>
            </button>

            {/* Windows PC & Laptop Setup */}
            {onOpenWindowsModal && (
              <button
                onClick={onOpenWindowsModal}
                className="px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border border-blue-200 dark:border-blue-800 bg-blue-50/70 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-800 dark:text-blue-300 cursor-pointer transition-colors shadow-xs"
                title="Windows PC & Laptop Setup: Desktop App, Auto-Boot, Shortcuts"
              >
                <Monitor className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="hidden sm:inline">Windows PC</span>
              </button>
            )}

            {/* Fullscreen Button */}
            <button
              onClick={onOpenFullscreen}
              className="px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
              title="Launch Public Address Full-Screen Display"
            >
              <Maximize2 className="w-4 h-4" />
              <span className="hidden sm:inline">Fullscreen</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Key Metric Cards (Current Period, Next Bell, Live Countdown, Status) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: CURRENT PERIOD */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Current Period
            </div>
            {currentPeriod ? (
              <div>
                <h3 className="text-xl font-extrabold text-amber-500 mb-1">{currentPeriod.name}</h3>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  {formatDisplayTime(currentPeriod.startTime, schoolSettings.timeFormat)} –{' '}
                  {formatDisplayTime(currentPeriod.endTime, schoolSettings.timeFormat)}
                </p>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Recess / Transition
                </h3>
                <p className="text-xs text-slate-400">No period actively in session</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
            {currentPeriod ? `Classification: ${currentPeriod.bellType.replace('_', ' ')}` : 'Campus at ease'}
          </div>
        </div>

        {/* Card 2: NEXT BELL */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Next Bell</div>
              {nextBell?.isManual && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                  Manual Bell
                </span>
              )}
            </div>
            {nextBell ? (
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1 truncate">
                  {nextBell.eventName}
                </h3>
                <p className="text-sm font-mono font-bold text-amber-500">
                  At {formatDisplayTime(nextBell.timeString, schoolSettings.timeFormat)}
                </p>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-extrabold text-slate-500 mb-1">Dismissed</h3>
                <p className="text-xs text-slate-400">No more bells scheduled today</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Sound: {nextBell ? nextBell.soundId : 'N/A'}</span>
            {onOpenSetBellTime ? (
              <button
                type="button"
                onClick={onOpenSetBellTime}
                className="text-amber-600 dark:text-amber-400 hover:underline font-bold cursor-pointer"
              >
                + Set Manual Bell
              </button>
            ) : (
              nextBell && <span>{nextBell.ringCount} strikes</span>
            )}
          </div>
        </div>

        {/* Card 3: COUNTDOWN TO NEXT BELL */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-slate-900 rounded-2xl p-6 border border-amber-300/80 dark:border-amber-800/60 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Countdown to Bell</span>
            </div>
            <div className="text-3xl sm:text-4xl font-mono font-black text-amber-600 dark:text-amber-400 tracking-wider">
              {nextBell ? countdownString : '--:--:--'}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-800/80 dark:text-amber-300/80">
            {nextBell ? 'Real-time countdown to public ring' : 'Scheduler awaiting next session'}
          </div>
        </div>

        {/* Card 4: PREVIOUS BELL & STATS */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Previous Bell Rung
            </div>
            {previousBell ? (
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-0.5 truncate">
                  {previousBell.eventName}
                </h3>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  Rung at {formatDisplayTime(previousBell.timeString, schoolSettings.timeFormat)}
                </p>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-bold text-slate-400 mb-0.5">None yet today</h3>
                <p className="text-xs text-slate-400">Awaiting first scheduled event</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Completed: {completedCount}/{totalCount} bells</span>
            <span>Vol: {schoolSettings.masterVolume}%</span>
          </div>
        </div>
      </div>

      {/* Emergency Alert Bell Controls (Collapsible or visible) */}
      <div className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            <div>
              <h4 className="font-bold text-sm text-rose-900 dark:text-rose-100">
                Emergency Public Broadcast Alarms
              </h4>
              <p className="text-xs text-rose-700 dark:text-rose-300">
                High-priority siren broadcasts that immediately override all scheduled bells.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowEmergencyPanel(!showEmergencyPanel)}
            className="px-3 py-1 rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold hover:bg-rose-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            {showEmergencyPanel ? 'Hide Controls' : 'Show Emergency Alarms'}
          </button>
        </div>

        {showEmergencyPanel && (
          <div className="mt-4 pt-4 border-t border-rose-200 dark:border-rose-900 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => onTriggerEmergencyBell('fire')}
              className="p-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex flex-col items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
            >
              <Flame className="w-5 h-5" />
              <span>Fire Alarm</span>
            </button>

            <button
              onClick={() => onTriggerEmergencyBell('evacuation')}
              className="p-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex flex-col items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
            >
              <ShieldAlert className="w-5 h-5" />
              <span>Evacuation Alarm</span>
            </button>

            <button
              onClick={() => onTriggerEmergencyBell('earthquake')}
              className="p-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex flex-col items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
            >
              <AlertTriangle className="w-5 h-5" />
              <span>Earthquake Alert</span>
            </button>

            <button
              onClick={() => onTriggerEmergencyBell('lockdown')}
              className="p-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex flex-col items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>Campus Lockdown</span>
            </button>
          </div>
        )}
      </div>

      {/* Today's Complete Bell Schedule Timeline */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              Today's Complete Bell Schedule
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live timetable events for {todayDayName} with real-time broadcast status.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Scheduled Events: <span className="font-bold text-slate-900 dark:text-white">{totalCount}</span>
            </div>
            {onOpenSetBellTime && (
              <button
                type="button"
                onClick={onOpenSetBellTime}
                className="px-3 py-1.5 rounded-xl border border-amber-400 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Set Bell Time
              </button>
            )}
          </div>
        </div>

        {todayScheduleTimeline.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400">
            <Clock className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <div className="font-semibold">No bells scheduled for today.</div>
            <p className="text-xs mt-1">
              {isHolidayOrOff
                ? `School is closed today (${holidayName || 'Holiday/Off Day'}).`
                : 'Configure or enable periods in the Timetable editor.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 uppercase text-xs font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Scheduled Time</th>
                  <th className="px-4 py-3">Event Description</th>
                  <th className="px-4 py-3">Classification</th>
                  <th className="px-4 py-3">Sound Profile</th>
                  <th className="px-4 py-3">Cadence</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {todayScheduleTimeline.map(({ event, status }, idx) => {
                  const soundObj = sounds.find((s) => s.id === event.soundId);

                  return (
                    <tr
                      key={event.id}
                      className={`transition-colors ${
                        status === 'in_progress'
                          ? 'bg-amber-50/80 dark:bg-amber-950/40 font-semibold'
                          : status === 'completed'
                          ? 'opacity-60 bg-slate-50/40 dark:bg-slate-800/20'
                          : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {formatDisplayTime(event.timeString, schoolSettings.timeFormat)}
                      </td>

                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2 flex-wrap">
                          {status === 'in_progress' && (
                            <Bell className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
                          )}
                          <span>{event.eventName}</span>
                          {event.isManual && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                              Manual Bell Time
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
                          {event.bellType.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {soundObj?.name || event.soundId}
                      </td>

                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                        {event.ringCount} strikes
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {status === 'completed' ? (
                            <span className="inline-flex items-center gap-1 font-bold text-slate-500 dark:text-slate-400">
                              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                              Completed
                            </span>
                          ) : status === 'in_progress' ? (
                            <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                              Current Event
                            </span>
                          ) : (
                            <span className="font-semibold text-slate-400">Upcoming</span>
                          )}

                          {event.isManual && onDeleteManualBell && (
                            <button
                              type="button"
                              onClick={() => onDeleteManualBell(event.periodId)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Delete manual bell"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
