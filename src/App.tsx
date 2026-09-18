import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  AppBackupData,
  ActiveRingingState,
  BellHistoryEntry,
  BellSound,
  DaySchedule,
  Holiday,
  Period,
  ScheduledBellEvent,
  SchoolSettings,
  SpecialSchedule,
  ManualScheduledBell,
} from './types';
import { StorageService, BUILTIN_SOUNDS } from './services/storage';
import { audioEngine } from './services/audioEngine';
import {
  checkIsHoliday,
  computeCountdownString,
  findActiveSpecialSchedule,
  generateDayScheduleEvents,
  getCurrentPeriod,
  getNextBellEvent,
  timeToMinutes,
} from './services/scheduler';
import { Bell, Clock } from 'lucide-react';

// Components
import { Navbar, ActiveTab } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { TimetableEditor } from './components/TimetableEditor';
import { WeeklyScheduleView } from './components/WeeklyScheduleView';
import { HolidayManager } from './components/HolidayManager';
import { SpecialSchedules } from './components/SpecialSchedules';
import { SoundManager } from './components/SoundManager';
import { BellHistory } from './components/BellHistory';
import { SettingsModal } from './components/SettingsModal';
import { FullscreenDisplay } from './components/FullscreenDisplay';
import { ManualBellModal } from './components/ManualBellModal';
import { AdminPinModal } from './components/AdminPinModal';
import { BellRingingOverlay } from './components/BellRingingOverlay';
import { AndroidInstallModal } from './components/AndroidInstallModal';
import { WindowsInstallModal } from './components/WindowsInstallModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { wakeLockService } from './services/wakeLock';

export default function App() {
  // --- Persistent States ---
  const [settings, setSettings] = useState<SchoolSettings>(() => StorageService.getSettings());
  const [periods, setPeriods] = useState<Period[]>(() => StorageService.getPeriods());
  const [weeklySchedules, setWeeklySchedules] = useState<DaySchedule[]>(() =>
    StorageService.getWeeklySchedules()
  );
  const [holidays, setHolidays] = useState<Holiday[]>(() => StorageService.getHolidays());
  const [specialSchedules, setSpecialSchedules] = useState<SpecialSchedule[]>(() =>
    StorageService.getSpecialSchedules()
  );
  const [customSounds, setCustomSounds] = useState<BellSound[]>(() =>
    StorageService.getCustomSounds()
  );
  const [historyLogs, setHistoryLogs] = useState<BellHistoryEntry[]>(() =>
    StorageService.getHistory()
  );
  const [manualBells, setManualBells] = useState<ManualScheduledBell[]>(() =>
    StorageService.getManualBells()
  );

  // --- Runtime Operating States ---
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isAutomaticActive, setIsAutomaticActive] = useState<boolean>(settings.autoStartSchedule);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isTodayDisabled, setIsTodayDisabled] = useState<boolean>(false);
  const [skippedBellEventIds, setSkippedBellEventIds] = useState<Set<string>>(new Set());
  const [postponedMinutesMap, setPostponedMinutesMap] = useState<Record<string, number>>({});
  const [previousBell, setPreviousBell] = useState<ScheduledBellEvent | null>(null);

  // Admin and UI Modals
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [showAdminPinModal, setShowAdminPinModal] = useState<boolean>(false);
  const [showManualBellModal, setShowManualBellModal] = useState<boolean>(false);
  const [manualBellInitialTab, setManualBellInitialTab] = useState<'ring_now' | 'set_time'>('ring_now');
  const [isFullscreenDisplayOpen, setIsFullscreenDisplayOpen] = useState<boolean>(false);
  const [showAndroidInstallModal, setShowAndroidInstallModal] = useState<boolean>(false);
  const [showWindowsInstallModal, setShowWindowsInstallModal] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Ringing Animation Overlay State
  const [activeRinging, setActiveRinging] = useState<ActiveRingingState | null>(null);

  // Guard against duplicate ring in the same minute
  const lastRungMinuteRef = useRef<string>('');

  // All combined sounds (built-in + custom)
  const allSounds: BellSound[] = useMemo(() => {
    return [...BUILTIN_SOUNDS, ...customSounds];
  }, [customSounds]);

  // Sync theme class to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Save settings when changed
  const handleUpdateSettings = (newSettings: SchoolSettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
  };

  const handleSavePeriods = (newPeriods: Period[]) => {
    setPeriods(newPeriods);
    StorageService.savePeriods(newPeriods);
  };

  const handleSaveWeeklySchedules = (newWeekly: DaySchedule[]) => {
    setWeeklySchedules(newWeekly);
    StorageService.saveWeeklySchedules(newWeekly);
  };

  const handleSaveHolidays = (newHolidays: Holiday[]) => {
    setHolidays(newHolidays);
    StorageService.saveHolidays(newHolidays);
  };

  const handleSaveSpecialSchedules = (newSpecial: SpecialSchedule[]) => {
    setSpecialSchedules(newSpecial);
    StorageService.saveSpecialSchedules(newSpecial);
  };

  const handleSaveCustomSounds = (newSounds: BellSound[]) => {
    setCustomSounds(newSounds);
    StorageService.saveCustomSounds(newSounds);
  };

  const handleClearHistory = () => {
    StorageService.clearHistory();
    setHistoryLogs([]);
  };

  const handleAddManualBell = (bellData: Omit<ManualScheduledBell, 'id' | 'createdAt'>) => {
    const newBell: ManualScheduledBell = {
      ...bellData,
      id: 'mb_' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...manualBells, newBell];
    setManualBells(updated);
    StorageService.saveManualBells(updated);
  };

  const handleDeleteManualBell = (id: string) => {
    const updated = manualBells.filter((b) => b.id !== id);
    setManualBells(updated);
    StorageService.saveManualBells(updated);
  };

  // Full Backup snapshot
  const getFullBackupData = (): AppBackupData => {
    return {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      settings,
      periods,
      weeklySchedules,
      holidays,
      specialSchedules,
      customSounds,
      historyLogs,
      manualBells,
    };
  };

  // Restore from snapshot
  const handleRestoreBackup = (backup: AppBackupData) => {
    if (backup.settings) handleUpdateSettings(backup.settings);
    if (backup.periods) handleSavePeriods(backup.periods);
    if (backup.weeklySchedules) handleSaveWeeklySchedules(backup.weeklySchedules);
    if (backup.holidays) handleSaveHolidays(backup.holidays);
    if (backup.specialSchedules) handleSaveSpecialSchedules(backup.specialSchedules);
    if (backup.customSounds) handleSaveCustomSounds(backup.customSounds);
    if (backup.manualBells) {
      setManualBells(backup.manualBells);
      StorageService.saveManualBells(backup.manualBells);
    }
    if (backup.historyLogs) {
      localStorage.setItem('smart_bell_history', JSON.stringify(backup.historyLogs));
      setHistoryLogs(backup.historyLogs);
    }
  };

  // Reset to default templates
  const handleResetToDefaults = () => {
    StorageService.resetToDefaults();
    setSettings(StorageService.getSettings());
    setPeriods(StorageService.getPeriods());
    setWeeklySchedules(StorageService.getWeeklySchedules());
    setHolidays(StorageService.getHolidays());
    setSpecialSchedules(StorageService.getSpecialSchedules());
    setCustomSounds([]);
    setHistoryLogs([]);
    setManualBells([]);
  };

  // --- Real-Time Loop (every 1 second) ---
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // Perform automatic bell check
      checkAndTriggerAutomaticBell(now);
    }, 1000);

    return () => clearInterval(timer);
  }, [
    isAutomaticActive,
    isPaused,
    isTodayDisabled,
    periods,
    weeklySchedules,
    holidays,
    specialSchedules,
    settings,
    manualBells,
    skippedBellEventIds,
    postponedMinutesMap,
    allSounds,
  ]);

  // --- Active Schedule Calculation for Today ---
  const todayDateStr = currentTime.toISOString().split('T')[0];
  const todayDayOfWeek = currentTime.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // 1. Check if today is a Holiday
  const holidayStatus = checkIsHoliday(todayDateStr, holidays);

  // 2. Check if a Special Schedule is active today
  const activeSpecial = findActiveSpecialSchedule(todayDateStr, specialSchedules);

  // 3. Weekly Schedule definition for today
  const todayWeekly = weeklySchedules.find((w) => w.dayOfWeek === todayDayOfWeek);
  const isWeeklyOff = todayWeekly ? todayWeekly.isHolidayOrOff : false;

  const isHolidayOrOff = holidayStatus.isHoliday || isWeeklyOff;
  const activeHolidayName = holidayStatus.holiday?.name || (isWeeklyOff ? 'Weekly Off Day' : undefined);

  // Determine effective periods for today:
  // Priority 1: Special Schedule periods
  // Priority 2: Weekly Schedule's specific periods (if defined)
  // Priority 3: Default periods list
  const effectivePeriods: Period[] = useMemo(() => {
    if (isHolidayOrOff || isTodayDisabled) return [];

    if (activeSpecial && activeSpecial.periods.length > 0) {
      return activeSpecial.periods;
    }
    if (todayWeekly && todayWeekly.periods && todayWeekly.periods.length > 0) {
      return todayWeekly.periods;
    }
    return periods;
  }, [isHolidayOrOff, isTodayDisabled, activeSpecial, todayWeekly, periods]);

  // Generate today's complete scheduled events list (Periods + Manually Scheduled Bells)
  const rawScheduledEvents = useMemo(() => {
    const periodEvents = generateDayScheduleEvents(effectivePeriods);

    const manualEvents: ScheduledBellEvent[] = manualBells
      .filter((mb) => mb.enabled && (!mb.dateStr || mb.dateStr === todayDateStr))
      .map((mb) => ({
        id: `manual_evt_${mb.id}`,
        periodId: mb.id,
        eventName: mb.eventName,
        timeString: mb.timeString,
        soundId: mb.soundId,
        ringCount: mb.ringCount,
        bellType: mb.bellType || 'special',
        isManual: true,
      }));

    const combined = [...periodEvents, ...manualEvents];
    combined.sort((a, b) => timeToMinutes(a.timeString) - timeToMinutes(b.timeString));
    return combined;
  }, [effectivePeriods, manualBells, todayDateStr]);

  // Apply postponement adjustments if any
  const todayScheduledEvents: ScheduledBellEvent[] = useMemo(() => {
    return rawScheduledEvents.map((evt) => {
      const delay = postponedMinutesMap[evt.id] || 0;
      if (delay === 0) return evt;

      const currentMins = timeToMinutes(evt.timeString);
      const newMins = Math.min(1439, currentMins + delay);
      const h = Math.floor(newMins / 60);
      const m = newMins % 60;
      const newTimeString = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      return {
        ...evt,
        timeString: newTimeString,
        eventName: `${evt.eventName} (+${delay}m postponed)`,
      };
    });
  }, [rawScheduledEvents, postponedMinutesMap]);

  // Current minutes & seconds from midnight
  const currentMinutesFromMidnight = currentTime.getHours() * 60 + currentTime.getMinutes();
  const currentSeconds = currentTime.getSeconds();

  // Active current period
  const currentPeriod = useMemo(() => {
    return getCurrentPeriod(effectivePeriods, currentMinutesFromMidnight);
  }, [effectivePeriods, currentMinutesFromMidnight]);

  // Next scheduled bell
  const nextBell = useMemo(() => {
    // Filter out skipped events
    const validEvents = todayScheduledEvents.filter((e) => !skippedBellEventIds.has(e.id));
    return getNextBellEvent(validEvents, currentMinutesFromMidnight);
  }, [todayScheduledEvents, skippedBellEventIds, currentMinutesFromMidnight]);

  // Countdown string
  const countdownString = useMemo(() => {
    return computeCountdownString(nextBell, currentMinutesFromMidnight, currentSeconds);
  }, [nextBell, currentMinutesFromMidnight, currentSeconds]);

  // Timeline with status for Dashboard
  const todayScheduleTimeline = useMemo(() => {
    return todayScheduledEvents.map((evt) => {
      const evtMins = timeToMinutes(evt.timeString);
      let status: 'completed' | 'in_progress' | 'upcoming' = 'upcoming';

      if (currentMinutesFromMidnight > evtMins) {
        status = 'completed';
      } else if (currentMinutesFromMidnight === evtMins) {
        status = 'in_progress';
      }

      return {
        event: evt,
        status,
      };
    });
  }, [todayScheduledEvents, currentMinutesFromMidnight]);

  // --- Automatic Bell Trigger Handler ---
  const checkAndTriggerAutomaticBell = async (now: Date) => {
    if (!isAutomaticActive || isPaused || isTodayDisabled || isHolidayOrOff) {
      return;
    }

    const currentH = now.getHours().toString().padStart(2, '0');
    const currentM = now.getMinutes().toString().padStart(2, '0');
    const currentTimeHHMM = `${currentH}:${currentM}`;
    const nowSecs = now.getSeconds();

    // Trigger on the 0-2 second window of the minute
    if (nowSecs > 2) return;

    for (const evt of todayScheduledEvents) {
      if (skippedBellEventIds.has(evt.id)) continue;

      if (evt.timeString === currentTimeHHMM) {
        const minuteKey = `${todayDateStr}_${currentTimeHHMM}_${evt.id}`;
        if (lastRungMinuteRef.current === minuteKey) {
          // Already rung in this minute
          continue;
        }

        lastRungMinuteRef.current = minuteKey;
        setPreviousBell(evt);

        // Find sound object
        const soundObj = allSounds.find((s) => s.id === evt.soundId) || BUILTIN_SOUNDS[0];

        // Start animation overlay
        setActiveRinging({
          isRinging: true,
          eventName: evt.eventName,
          ringCount: evt.ringCount || settings.defaultRingCount,
          currentRingIndex: 1,
        });

        // Broadcast bell sequence
        const masterVol = settings.masterVolume / 100;
        const bellVol = settings.bellVolume / 100;
        const effectiveVolume = Math.max(0.05, masterVol * bellVol);

        const success = await audioEngine.playBellSequence({
          soundType: soundObj.builtinType || 'classic',
          customDataUrl: soundObj.audioDataUrl,
          durationSeconds: soundObj.durationSeconds || settings.defaultRingDuration,
          ringCount: evt.ringCount || settings.defaultRingCount,
          intervalSeconds: soundObj.intervalSeconds || settings.defaultInterval,
          volume: effectiveVolume,
          onRingStart: (curr, total) => {
            setActiveRinging((prev) =>
              prev
                ? {
                    ...prev,
                    currentRingIndex: curr,
                  }
                : null
            );
          },
        });

        // Close animation
        setActiveRinging(null);

        // Record history log
        const newLog = StorageService.addHistoryLog({
          date: todayDateStr,
          time: currentTimeHHMM,
          periodName: evt.eventName,
          bellType: evt.bellType,
          soundName: soundObj.name,
          trigger: 'automatic',
          status: success ? 'success' : 'failed',
        });
        setHistoryLogs((prev) => [newLog, ...prev]);

        break;
      }
    }
  };

  // --- Manual Bell Strike Handler ---
  const handleManualRing = async ({
    soundId,
    ringCount,
    customDuration,
    eventName,
  }: {
    soundId: string;
    ringCount: number;
    customDuration?: number;
    eventName: string;
  }) => {
    const soundObj = allSounds.find((s) => s.id === soundId) || BUILTIN_SOUNDS[0];

    setActiveRinging({
      isRinging: true,
      eventName,
      ringCount,
      currentRingIndex: 1,
    });

    const masterVol = settings.masterVolume / 100;
    const bellVol = settings.bellVolume / 100;
    const effectiveVolume = Math.max(0.05, masterVol * bellVol);

    const success = await audioEngine.playBellSequence({
      soundType: soundObj.builtinType || 'classic',
      customDataUrl: soundObj.audioDataUrl,
      durationSeconds: customDuration || soundObj.durationSeconds || settings.defaultRingDuration,
      ringCount,
      intervalSeconds: soundObj.intervalSeconds || settings.defaultInterval,
      volume: effectiveVolume,
      onRingStart: (curr) => {
        setActiveRinging((prev) => (prev ? { ...prev, currentRingIndex: curr } : null));
      },
    });

    setActiveRinging(null);

    const now = new Date();
    const timeFormatted = now.toTimeString().split(' ')[0];
    const newLog = StorageService.addHistoryLog({
      date: now.toISOString().split('T')[0],
      time: timeFormatted,
      periodName: eventName,
      bellType: 'special',
      soundName: soundObj.name,
      trigger: 'manual',
      status: success ? 'success' : 'failed',
    });
    setHistoryLogs((prev) => [newLog, ...prev]);
  };

  // --- Emergency Alarm Trigger ---
  const handleTriggerEmergencyBell = async (type: 'fire' | 'evacuation' | 'earthquake' | 'lockdown') => {
    const titleMap = {
      fire: 'FIRE ALARM BROADCAST',
      evacuation: 'EMERGENCY EVACUATION ALERT',
      earthquake: 'EARTHQUAKE ALERT SIREN',
      lockdown: 'CAMPUS LOCKDOWN BROADCAST',
    };
    const title = titleMap[type];

    setActiveRinging({
      isRinging: true,
      eventName: title,
      ringCount: 3,
      currentRingIndex: 1,
    });

    const success = await audioEngine.playBellSequence({
      soundType: 'emergency_siren',
      durationSeconds: 5,
      ringCount: 3,
      intervalSeconds: 0.5,
      volume: 1.0,
      onRingStart: (curr) => {
        setActiveRinging((prev) => (prev ? { ...prev, currentRingIndex: curr } : null));
      },
    });

    setActiveRinging(null);

    const now = new Date();
    const timeFormatted = now.toTimeString().split(' ')[0];
    const newLog = StorageService.addHistoryLog({
      date: now.toISOString().split('T')[0],
      time: timeFormatted,
      periodName: title,
      bellType: 'special',
      soundName: 'Emergency Siren Alarm',
      trigger: 'manual',
      status: success ? 'success' : 'failed',
    });
    setHistoryLogs((prev) => [newLog, ...prev]);
  };

  // Stop currently ringing audio immediately
  const handleStopBellImmediately = () => {
    audioEngine.stopBell();
    setActiveRinging(null);
  };

  // Skip next scheduled bell
  const handleSkipNextBell = () => {
    if (!nextBell) return;
    setSkippedBellEventIds((prev) => new Set([...prev, nextBell.id]));
  };

  // Postpone next bell by X minutes
  const handlePostponeNextBell = (minutes: number) => {
    if (!nextBell) return;
    setPostponedMinutesMap((prev) => ({
      ...prev,
      [nextBell.id]: (prev[nextBell.id] || 0) + minutes,
    }));
  };

  // Windows & Desktop Keyboard Shortcuts + Wake Lock
  useEffect(() => {
    // Keep screen awake for reliable continuous operation on Windows PCs/laptops
    wakeLockService.acquire();

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      // Spacebar: Ring Temple Bell (1 Strike) immediately
      if (e.code === 'Space') {
        e.preventDefault();
        handleManualRing({
          soundId: 'temple',
          ringCount: 1,
          customDuration: 3,
          eventName: 'Keyboard Shortcut (Space)',
        });
        return;
      }

      // 'M' or 'm': Open Manual Timing Hub
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setManualBellInitialTab('ring_now');
        setShowManualBellModal(true);
        return;
      }

      // 'F11' or toggle Fullscreen Modal
      if (e.key === 'F11') {
        setIsFullscreenDisplayOpen((prev) => !prev);
        return;
      }

      // 'Escape': Close all modals
      if (e.key === 'Escape') {
        setShowManualBellModal(false);
        setShowAdminPinModal(false);
        setShowAndroidInstallModal(false);
        setShowWindowsInstallModal(false);
        setIsFullscreenDisplayOpen(false);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Navigation tab switcher helper for Day Schedule editor
  const handleEditPeriodsForDay = (dayIdx: number) => {
    setActiveTab('timetable');
  };

  const handleEditPeriodsForSpecial = (scheduleId: string) => {
    setActiveTab('timetable');
  };

  const todayDayName = currentTime.toLocaleDateString(undefined, { weekday: 'long' });
  const todayDateFormatted = currentTime.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors flex flex-col font-sans relative overflow-x-hidden">
      {/* Background Watermark & Divine Aura - Saraswati Crest */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center">
        <div className="absolute w-[800px] h-[800px] rounded-full bg-amber-500/5 dark:bg-amber-400/[0.03] blur-3xl" />
        <img
          src="/saraswoti_logo.jpg"
          alt="School Emblem Watermark"
          className="w-[600px] h-[600px] max-w-none opacity-[0.035] dark:opacity-[0.045] object-contain filter grayscale contrast-125 select-none"
        />
      </div>

      {/* Top Application Navbar */}
      <div className="relative z-10">
        <Navbar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          schoolName={settings.schoolName}
          isAutomaticActive={isAutomaticActive}
          isPaused={isPaused}
          isHolidayOrOff={isHolidayOrOff}
          isAdmin={isAdmin}
          onToggleAdmin={() => {
            if (isAdmin) {
              setIsAdmin(false);
            } else {
              setShowAdminPinModal(true);
            }
          }}
          onOpenFullscreen={() => setIsFullscreenDisplayOpen(true)}
          onQuickManualRing={() => {
            setManualBellInitialTab('ring_now');
            setShowManualBellModal(true);
          }}
          onOpenSetBellTime={() => {
            setManualBellInitialTab('set_time');
            setShowManualBellModal(true);
          }}
          onOpenAndroidModal={() => setShowAndroidInstallModal(true)}
          onOpenWindowsModal={() => setShowWindowsInstallModal(true)}
          theme={theme}
          onToggleTheme={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
        />
      </div>

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 relative z-10">
        {activeTab === 'dashboard' && (
          <Dashboard
            schoolSettings={settings}
            currentTime={currentTime}
            todayDayName={todayDayName}
            todayDateFormatted={todayDateFormatted}
            isAutomaticActive={isAutomaticActive}
            isPaused={isPaused}
            isTodayDisabled={isTodayDisabled}
            isHolidayOrOff={isHolidayOrOff}
            holidayName={activeHolidayName}
            specialScheduleTitle={activeSpecial?.name}
            currentPeriod={currentPeriod}
            nextBell={nextBell}
            previousBell={previousBell}
            countdownString={countdownString}
            todayScheduleTimeline={todayScheduleTimeline}
            sounds={allSounds}
            isAdmin={isAdmin}
            onRingNow={() => {
              setManualBellInitialTab('ring_now');
              setShowManualBellModal(true);
            }}
            onOpenSetBellTime={() => {
              setManualBellInitialTab('set_time');
              setShowManualBellModal(true);
            }}
            onOpenWindowsModal={() => setShowWindowsInstallModal(true)}
            onDeleteManualBell={handleDeleteManualBell}
            onToggleAutomatic={() => setIsAutomaticActive((prev) => !prev)}
            onTogglePause={() => setIsPaused((prev) => !prev)}
            onSkipNextBell={handleSkipNextBell}
            onDisableTodaySchedule={() => setIsTodayDisabled((prev) => !prev)}
            onPostponeNextBell={handlePostponeNextBell}
            onTriggerEmergencyBell={handleTriggerEmergencyBell}
            onOpenFullscreen={() => setIsFullscreenDisplayOpen(true)}
            onRequestAdmin={() => setShowAdminPinModal(true)}
          />
        )}

        {activeTab === 'timetable' && (
          <TimetableEditor
            periods={periods}
            sounds={allSounds}
            timeFormat={settings.timeFormat}
            isAdmin={isAdmin}
            onSavePeriods={handleSavePeriods}
            onRequestAdmin={() => setShowAdminPinModal(true)}
          />
        )}

        {activeTab === 'weekly' && (
          <WeeklyScheduleView
            weeklySchedules={weeklySchedules}
            sounds={allSounds}
            timeFormat={settings.timeFormat}
            isAdmin={isAdmin}
            onSaveWeeklySchedules={handleSaveWeeklySchedules}
            onRequestAdmin={() => setShowAdminPinModal(true)}
            onEditPeriodsForDay={handleEditPeriodsForDay}
          />
        )}

        {activeTab === 'holidays' && (
          <HolidayManager
            holidays={holidays}
            isAdmin={isAdmin}
            onSaveHolidays={handleSaveHolidays}
            onRequestAdmin={() => setShowAdminPinModal(true)}
          />
        )}

        {activeTab === 'special' && (
          <SpecialSchedules
            specialSchedules={specialSchedules}
            sounds={allSounds}
            timeFormat={settings.timeFormat}
            isAdmin={isAdmin}
            onSaveSpecialSchedules={handleSaveSpecialSchedules}
            onRequestAdmin={() => setShowAdminPinModal(true)}
            onEditPeriods={handleEditPeriodsForSpecial}
          />
        )}

        {activeTab === 'sounds' && (
          <SoundManager
            sounds={allSounds}
            settings={settings}
            isAdmin={isAdmin}
            onUpdateSettings={handleUpdateSettings}
            onSaveCustomSounds={handleSaveCustomSounds}
            onRequestAdmin={() => setShowAdminPinModal(true)}
          />
        )}

        {activeTab === 'history' && (
          <BellHistory
            logs={historyLogs}
            timeFormat={settings.timeFormat}
            isAdmin={isAdmin}
            onClearLogs={handleClearHistory}
            onRequestAdmin={() => setShowAdminPinModal(true)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsModal
            settings={settings}
            isAdmin={isAdmin}
            onUpdateSettings={handleUpdateSettings}
            onRequestAdmin={() => setShowAdminPinModal(true)}
            getFullBackupData={getFullBackupData}
            onRestoreBackup={handleRestoreBackup}
            onResetToDefaults={handleResetToDefaults}
            onOpenAndroidModal={() => setShowAndroidInstallModal(true)}
          />
        )}
      </main>

      {/* Floating Easy Manual Timing Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => {
            setManualBellInitialTab('ring_now');
            setShowManualBellModal(true);
          }}
          className="group flex items-center gap-2.5 px-4 sm:px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/30 border border-amber-400/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Easy Manual Timing Hub: 1-Tap Ring, Set Time, Delay Schedule, Presets"
        >
          <div className="relative">
            <Clock className="w-5 h-5 text-slate-950" />
            <Bell className="w-3 h-3 fill-slate-950 text-slate-950 absolute -top-1 -right-1.5 animate-bounce" />
          </div>
          <span className="tracking-wide">Manual Timing</span>
          {manualBells.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-slate-950 text-amber-400 text-xs font-black flex items-center justify-center">
              {manualBells.length}
            </span>
          )}
        </button>
      </div>

      {/* Manual Bell Modal */}
      <ManualBellModal
        isOpen={showManualBellModal}
        onClose={() => setShowManualBellModal(false)}
        sounds={allSounds}
        defaultSoundId={settings.defaultSoundId}
        timeFormat={settings.timeFormat}
        initialTab={manualBellInitialTab}
        currentTime={currentTime}
        onRing={handleManualRing}
        requireConfirmation={settings.requireConfirmationForManualRing}
        manualBells={manualBells}
        onAddManualBell={handleAddManualBell}
        onDeleteManualBell={handleDeleteManualBell}
        nextBell={nextBell}
        onPostponeNextBell={handlePostponeNextBell}
        onSkipNextBell={handleSkipNextBell}
        schoolName={settings.schoolName}
      />

      {/* Admin Authentication PIN Modal */}
      <AdminPinModal
        isOpen={showAdminPinModal}
        onClose={() => setShowAdminPinModal(false)}
        onSuccess={() => setIsAdmin(true)}
        correctPin={settings.adminPin}
      />

      {/* Fullscreen Display Mode */}
      <FullscreenDisplay
        isOpen={isFullscreenDisplayOpen}
        onClose={() => setIsFullscreenDisplayOpen(false)}
        schoolName={settings.schoolName}
        currentTime={currentTime}
        timeFormat={settings.timeFormat}
        currentPeriod={currentPeriod}
        nextBell={nextBell}
        countdownString={countdownString}
        isAutomaticActive={isAutomaticActive}
        isPaused={isPaused}
        isHolidayOrOff={isHolidayOrOff}
        holidayName={activeHolidayName}
        onManualRing={() => setShowManualBellModal(true)}
        onTogglePause={() => setIsPaused((prev) => !prev)}
      />

      {/* Active Bell Ringing Overlay Animation */}
      <BellRingingOverlay
        activeRinging={activeRinging}
        onStopBell={handleStopBellImmediately}
      />

      {/* Android Install & APK Modal */}
      <AndroidInstallModal
        isOpen={showAndroidInstallModal}
        onClose={() => setShowAndroidInstallModal(false)}
      />

      {/* Windows PC & Laptop Desktop Modal */}
      <WindowsInstallModal
        isOpen={showWindowsInstallModal}
        onClose={() => setShowWindowsInstallModal(false)}
        onQuickManualRing={() => {
          setShowWindowsInstallModal(false);
          handleManualRing({
            soundId: 'temple',
            ringCount: 1,
            customDuration: 3,
            eventName: 'Windows Hub Quick Ring',
          });
        }}
      />

      {/* Connectivity Status Banner */}
      <OfflineIndicator />
    </div>
  );
}
