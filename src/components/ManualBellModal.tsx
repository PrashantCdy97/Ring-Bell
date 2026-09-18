import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  Volume2,
  ShieldCheck,
  Clock,
  Plus,
  Trash2,
  Play,
  Square,
  Sparkles,
  CheckCircle2,
  Calendar,
  FastForward,
  RotateCcw,
  Sliders,
  Flame,
} from 'lucide-react';
import { BellSound, BellType, ManualScheduledBell, ScheduledBellEvent } from '../types';
import { adjustTimeByMinutes, formatDisplayTime, timeToMinutes } from '../services/scheduler';
import { audioEngine } from '../services/audioEngine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sounds: BellSound[];
  defaultSoundId: string;
  timeFormat?: '12h' | '24h' | string;
  initialTab?: 'ring_now' | 'set_time' | 'postpone' | 'presets' | 'scheduled';
  currentTime?: Date;
  onRing: (options: { soundId: string; ringCount: number; customDuration?: number; eventName: string }) => void;
  requireConfirmation: boolean;
  manualBells?: ManualScheduledBell[];
  onAddManualBell?: (bell: Omit<ManualScheduledBell, 'id' | 'createdAt'>) => void;
  onDeleteManualBell?: (id: string) => void;
  nextBell?: ScheduledBellEvent | null;
  onPostponeNextBell?: (minutes: number) => void;
  onSkipNextBell?: () => void;
  schoolName?: string;
}

export const ManualBellModal: React.FC<Props> = ({
  isOpen,
  onClose,
  sounds,
  defaultSoundId,
  timeFormat = '12h',
  initialTab = 'ring_now',
  currentTime = new Date(),
  onRing,
  requireConfirmation,
  manualBells = [],
  onAddManualBell,
  onDeleteManualBell,
  nextBell,
  onPostponeNextBell,
  onSkipNextBell,
  schoolName = 'TR Memorial English Boarding School',
}) => {
  const [activeTab, setActiveTab] = useState<'ring_now' | 'set_time' | 'postpone' | 'presets' | 'scheduled'>(initialTab);

  // --- Immediate Ring State (Defaults to Temple Bell 1-strike) ---
  const effectiveDefaultSound = sounds.find((s) => s.id === 'temple') ? 'temple' : defaultSoundId || 'classic';
  const [selectedSoundId, setSelectedSoundId] = useState(effectiveDefaultSound);
  const [ringOption, setRingOption] = useState<'once' | '2times' | '3times' | 'custom'>('once');
  const [customRings, setCustomRings] = useState(1);
  const [customDuration, setCustomDuration] = useState(4.5);
  const [immediateEventName, setImmediateEventName] = useState('Manual Temple Bell');
  const [isConfirming, setIsConfirming] = useState(false);

  // --- Manual Bell Time State ---
  const currentHH = currentTime.getHours().toString().padStart(2, '0');
  const currentMM = currentTime.getMinutes().toString().padStart(2, '0');
  // Default to 5 minutes in the future
  const defaultFutureTime = adjustTimeByMinutes(`${currentHH}:${currentMM}`, 5);

  const [scheduledTime, setScheduledTime] = useState(defaultFutureTime);
  const [scheduledEventName, setScheduledEventName] = useState('Special Bell');
  const [scheduledSoundId, setScheduledSoundId] = useState(effectiveDefaultSound);
  const [scheduledRingCount, setScheduledRingCount] = useState<number>(1);
  const [scheduledBellType, setScheduledBellType] = useState<BellType>('special');
  const [scheduleSuccessMsg, setScheduleSuccessMsg] = useState('');
  const [postponeSuccessMsg, setPostponeSuccessMsg] = useState('');

  // Audio Preview State
  const [isPreviewing, setIsPreviewing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setIsConfirming(false);
      setScheduleSuccessMsg('');
      setPostponeSuccessMsg('');
      setSelectedSoundId(effectiveDefaultSound);
      setScheduledSoundId(effectiveDefaultSound);
    }
  }, [isOpen, initialTab, effectiveDefaultSound]);

  if (!isOpen) return null;

  const getEffectiveRingCount = () => {
    switch (ringOption) {
      case 'once':
        return 1;
      case '2times':
        return 2;
      case '3times':
        return 3;
      case 'custom':
        return customRings;
    }
  };

  const handleExecuteRing = () => {
    if (requireConfirmation && !isConfirming) {
      setIsConfirming(true);
      return;
    }

    onRing({
      soundId: selectedSoundId,
      ringCount: getEffectiveRingCount(),
      customDuration: ringOption === 'custom' ? customDuration : undefined,
      eventName: immediateEventName.trim() || 'Temple Bell (Manual)',
    });
    setIsConfirming(false);
    onClose();
  };

  // Instant 1-Strike Temple Bell shortcut
  const handleInstantTempleBell = () => {
    onRing({
      soundId: 'temple',
      ringCount: 1,
      customDuration: 4.5,
      eventName: 'Temple Bell Ring (1 Time)',
    });
    onClose();
  };

  const handlePreviewSound = async (soundId: string) => {
    if (isPreviewing) {
      audioEngine.stopBell();
      setIsPreviewing(false);
      return;
    }

    const soundObj = sounds.find((s) => s.id === soundId);
    if (!soundObj) return;

    setIsPreviewing(true);
    await audioEngine.playBellSequence({
      soundType: soundObj.builtinType || 'temple',
      customDataUrl: soundObj.audioDataUrl,
      durationSeconds: Math.min(3.5, soundObj.durationSeconds || 4),
      ringCount: 1,
      volume: 0.85,
    });
    setIsPreviewing(false);
  };

  const handleQuickAdjustTime = (deltaMinutes: number) => {
    setScheduledTime((prev) => adjustTimeByMinutes(prev, deltaMinutes));
  };

  const handleSetRelativeTime = (minutesFromNow: number) => {
    const nowHH = currentTime.getHours().toString().padStart(2, '0');
    const nowMM = currentTime.getMinutes().toString().padStart(2, '0');
    setScheduledTime(adjustTimeByMinutes(`${nowHH}:${nowMM}`, minutesFromNow));
  };

  const handleSaveScheduledManualBell = () => {
    if (!onAddManualBell) return;

    const todayDateStr = currentTime.toISOString().split('T')[0];

    onAddManualBell({
      timeString: scheduledTime,
      eventName: scheduledEventName.trim() || 'Manual Temple Bell',
      soundId: scheduledSoundId,
      ringCount: scheduledRingCount,
      bellType: scheduledBellType,
      dateStr: todayDateStr,
      enabled: true,
      notes: 'Manually scheduled',
    });

    setScheduleSuccessMsg(`Bell time set for ${formatDisplayTime(scheduledTime, timeFormat)}!`);
    setTimeout(() => {
      setScheduleSuccessMsg('');
    }, 3000);
  };

  const handleTriggerPreset = (name: string, soundId: string, count: number) => {
    onRing({
      soundId,
      ringCount: count,
      eventName: name,
    });
    onClose();
  };

  const handlePostpone = (minutes: number) => {
    if (!onPostponeNextBell) return;
    onPostponeNextBell(minutes);
    setPostponeSuccessMsg(`Next bell delayed by +${minutes} minutes.`);
    setTimeout(() => setPostponeSuccessMsg(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 max-h-[92vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 shrink-0">
              <Bell className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                <span>Manual Bell & Timing Hub</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Easy Control
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {schoolName} • Immediate 1-strike Temple bell or set exact bell timing
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (isPreviewing) audioEngine.stopBell();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Tap Quick Action: Temple Bell Ring 1 Time */}
        <div className="my-4 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-emerald-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-black">
              <Bell className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Temple Bell (1 Strike)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-300 font-bold">
                  Recommended
                </span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Sacred resonance • 1 time chime broadcast
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleInstantTempleBell}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/25 transition-transform active:scale-95 cursor-pointer whitespace-nowrap flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>RING 1x NOW</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-5 gap-1 my-3 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl text-[11px] font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('ring_now');
              setIsConfirming(false);
            }}
            className={`py-2 px-1 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'ring_now'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Ring Now</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('set_time');
              setIsConfirming(false);
            }}
            className={`py-2 px-1 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'set_time'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Set Time</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('postpone');
              setIsConfirming(false);
            }}
            className={`py-2 px-1 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'postpone'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>Delay/Shift</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('presets');
              setIsConfirming(false);
            }}
            className={`py-2 px-1 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Presets</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('scheduled');
              setIsConfirming(false);
            }}
            className={`py-2 px-1 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer relative ${
              activeTab === 'scheduled'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Scheduled ({manualBells.length})</span>
          </button>
        </div>

        {/* TAB 1: RING NOW (INSTANT) */}
        {activeTab === 'ring_now' && (
          <div className="space-y-4 pt-1">
            {/* Number of Strikes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                Strikes / Rings (Default: 1 Time)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'once', label: '1 Strike (Temple Bell)' },
                  { id: '2times', label: '2 Strikes' },
                  { id: '3times', label: '3 Strikes' },
                  { id: 'custom', label: 'Custom' },
                ].map((opt) => (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => {
                      setRingOption(opt.id as any);
                      setIsConfirming(false);
                    }}
                    className={`py-2.5 px-1 text-xs font-bold rounded-xl border transition-all text-center cursor-pointer ${
                      ringOption === opt.id
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom count sliders */}
            {ringOption === 'custom' && (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-3 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Total Strikes:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white font-mono">{customRings} rings</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={customRings}
                  onChange={(e) => setCustomRings(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500 cursor-pointer"
                />

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Duration per Strike:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white font-mono">{customDuration}s</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            )}

            {/* Bell Sound Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Bell Sound Profile
                </label>
                <button
                  type="button"
                  onClick={() => handlePreviewSound(selectedSoundId)}
                  className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {isPreviewing ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPreviewing ? 'Stop Preview' : 'Test Audio'}</span>
                </button>
              </div>

              <select
                value={selectedSoundId}
                onChange={(e) => setSelectedSoundId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 font-bold cursor-pointer"
              >
                {sounds.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.id === 'temple' ? '⭐ (Default Temple Bell)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Event note */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                Event Description / Note
              </label>
              <input
                type="text"
                value={immediateEventName}
                onChange={(e) => setImmediateEventName(e.target.value)}
                placeholder="e.g. Special Assembly, Emergency Drill, Dismissal"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Confirmation Warning if required */}
            {isConfirming && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded-xl flex items-center gap-2 text-xs text-amber-800 dark:text-amber-200">
                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Confirm broadcast: Click again below to ring speakers immediately.</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRing}
                className={`flex-1 py-3 rounded-xl text-slate-950 text-xs font-black shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer ${
                  isConfirming
                    ? 'bg-amber-600 text-white ring-2 ring-amber-400'
                    : 'bg-amber-500 hover:bg-amber-600'
                }`}
              >
                <Bell className="w-4 h-4 fill-current animate-bounce" />
                {isConfirming ? 'CONFIRM RING NOW' : `BROADCAST RING (${getEffectiveRingCount()}x)`}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: SET BELL TIME MANUALLY */}
        {activeTab === 'set_time' && (
          <div className="space-y-4 pt-1">
            {scheduleSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{scheduleSuccessMsg}</span>
              </div>
            )}

            {/* Time Picker and Rapid Manual Steppers */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Exact Scheduled Bell Time
                </label>
                <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                  {formatDisplayTime(scheduledTime, timeFormat)}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-base font-bold font-mono text-slate-900 dark:text-white"
                />
              </div>

              {/* Rapid Manual Adjust Steppers */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Quick Manual Adjustment:
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {[-30, -15, -5, +5, +15, +30].map((delta) => (
                    <button
                      key={delta}
                      type="button"
                      onClick={() => handleQuickAdjustTime(delta)}
                      className="py-1.5 px-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 cursor-pointer text-center"
                    >
                      {delta > 0 ? `+${delta}m` : `${delta}m`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Set Relative from Current Time */}
              <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-700/80">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Schedule from Now:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[2, 5, 10, 15, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => handleSetRelativeTime(mins)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-100/70 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 cursor-pointer"
                    >
                      +{mins} mins
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Event Name & Classification */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Event Title
                </label>
                <input
                  type="text"
                  value={scheduledEventName}
                  onChange={(e) => setScheduledEventName(e.target.value)}
                  placeholder="e.g. Special Assembly"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Classification
                </label>
                <select
                  value={scheduledBellType}
                  onChange={(e) => setScheduledBellType(e.target.value as BellType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-100 cursor-pointer"
                >
                  <option value="special">Special Event</option>
                  <option value="assembly">Assembly Bell</option>
                  <option value="break">Break / Recess</option>
                  <option value="lunch">Lunch Bell</option>
                  <option value="warning">Warning Chime</option>
                  <option value="closing">School Dismissal</option>
                  <option value="school_bell">Standard Bell</option>
                </select>
              </div>
            </div>

            {/* Sound & Strike Count (Defaults to Temple Bell 1x) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Bell Sound
                  </label>
                  <button
                    type="button"
                    onClick={() => handlePreviewSound(scheduledSoundId)}
                    className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {isPreviewing ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3" />}
                    <span>{isPreviewing ? 'Stop' : 'Test'}</span>
                  </button>
                </div>
                <select
                  value={scheduledSoundId}
                  onChange={(e) => setScheduledSoundId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100 cursor-pointer"
                >
                  {sounds.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.id === 'temple' ? '⭐ (Default)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Strike Count (Default: 1x)
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setScheduledRingCount(count)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer text-center ${
                        scheduledRingCount === count
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {count}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Set Bell Time Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveScheduledManualBell}
                className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>SAVE MANUAL BELL FOR {formatDisplayTime(scheduledTime, timeFormat)}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: DELAY / SHIFT (POSTPONE SCHEDULE) */}
        {activeTab === 'postpone' && (
          <div className="space-y-4 pt-1">
            {postponeSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{postponeSuccessMsg}</span>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Target Scheduled Bell
              </div>
              {nextBell ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-base font-extrabold text-slate-900 dark:text-white">
                      {nextBell.eventName}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Scheduled time: <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{formatDisplayTime(nextBell.timeString, timeFormat)}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    Next in Queue
                  </span>
                </div>
              ) : (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  No upcoming bells queued for today right now.
                </div>
              )}
            </div>

            {/* Quick Postpone Nudge Buttons */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                Postpone Next Bell by:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 30].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    disabled={!nextBell}
                    onClick={() => handlePostpone(mins)}
                    className="py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-500 bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-800 dark:text-slate-100 font-bold text-xs flex flex-col items-center justify-center gap-1 disabled:opacity-40 cursor-pointer"
                  >
                    <FastForward className="w-4 h-4 text-amber-500" />
                    <span>+{mins} min</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Skip Next Bell Option */}
            {onSkipNextBell && (
              <div className="pt-2">
                <button
                  type="button"
                  disabled={!nextBell}
                  onClick={() => {
                    onSkipNextBell();
                    setPostponeSuccessMsg('Next bell skipped.');
                    setTimeout(() => setPostponeSuccessMsg(''), 3000);
                  }}
                  className="w-full py-3 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold hover:bg-rose-100 disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Skip Next Bell ({nextBell ? nextBell.eventName : 'None'})</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: 1-TAP QUICK PRESETS */}
        {activeTab === 'presets' && (
          <div className="space-y-3 pt-1">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Broadcast standard school chime events instantly with 1 tap using the Temple Bell:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { title: 'Morning Assembly', desc: 'Temple Bell • 1 Strike', soundId: 'temple', count: 1, icon: Bell, color: 'text-amber-500' },
                { title: 'Class / Period Start', desc: 'Temple Bell • 1 Strike', soundId: 'temple', count: 1, icon: Clock, color: 'text-blue-500' },
                { title: 'Recess / Short Break', desc: 'Temple Bell • 1 Strike', soundId: 'temple', count: 1, icon: Sparkles, color: 'text-emerald-500' },
                { title: 'Lunch Break Bell', desc: 'Temple Bell • 1 Strike', soundId: 'temple', count: 1, icon: Sparkles, color: 'text-orange-500' },
                { title: 'School Dismissal Chime', desc: 'Temple Bell • 1 Strike', soundId: 'temple', count: 1, icon: Bell, color: 'text-purple-500' },
                { title: 'Emergency Alert Siren', desc: 'Siren Alarm • 3 Strikes', soundId: 'emergency_siren', count: 3, icon: Flame, color: 'text-rose-500' },
              ].map((p, idx) => {
                const IconComp = p.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleTriggerPreset(p.title, p.soundId, p.count)}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 bg-white dark:bg-slate-800/80 hover:bg-amber-50/40 dark:hover:bg-amber-950/30 text-left transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl bg-slate-100 dark:bg-slate-700/60 ${p.color}`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-extrabold text-xs text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">
                          {p.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {p.desc}
                        </div>
                      </div>
                    </div>
                    <Play className="w-4 h-4 text-slate-400 group-hover:text-amber-500 fill-current opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: ACTIVE SCHEDULED MANUAL BELLS */}
        {activeTab === 'scheduled' && (
          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Today's Manually Set Bells ({manualBells.length})
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('set_time')}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New</span>
              </button>
            </div>

            {manualBells.length === 0 ? (
              <div className="py-8 px-4 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No manual bells scheduled for today
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                  Easily schedule custom bell strikes for assemblies, rehearsals, or special tests.
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('set_time')}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-black shadow-xs cursor-pointer"
                >
                  Set Bell Time Now
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {manualBells.map((bell) => {
                  const soundObj = sounds.find((s) => s.id === bell.soundId);
                  const nowMins = currentTime.getHours() * 60 + currentTime.getMinutes();
                  const bellMins = timeToMinutes(bell.timeString);
                  const isPast = nowMins > bellMins;

                  return (
                    <div
                      key={bell.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                        isPast
                          ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                          : 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-2 rounded-xl bg-amber-500 text-slate-950 font-black font-mono text-sm shadow-xs">
                          {formatDisplayTime(bell.timeString, timeFormat)}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{bell.eventName}</span>
                            {isPast && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                Passed
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {soundObj?.name || bell.soundId} • {bell.ringCount} strike{bell.ringCount > 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onRing({
                              soundId: bell.soundId,
                              ringCount: bell.ringCount,
                              eventName: bell.eventName,
                            });
                            onClose();
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-amber-50 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                          title="Ring this bell right now"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Ring</span>
                        </button>

                        {onDeleteManualBell && (
                          <button
                            type="button"
                            onClick={() => onDeleteManualBell(bell.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Remove manual bell"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

