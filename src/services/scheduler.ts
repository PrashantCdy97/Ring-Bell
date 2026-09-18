import {
  BellType,
  DaySchedule,
  Holiday,
  Period,
  ScheduledBellEvent,
  SpecialSchedule,
} from '../types';

/**
 * Utility: Convert "HH:MM" (24-hour) to minutes from midnight (0..1439)
 */
export const timeToMinutes = (timeStr: string): number => {
  const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10));
  return (h || 0) * 60 + (m || 0);
};

/**
 * Utility: Convert minutes from midnight back to "HH:MM" (24-hour)
 */
export const minutesToTime = (minutes: number): string => {
  const norm = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

/**
 * Utility: Format "HH:MM" or Date into 12-hour AM/PM or 24-hour format
 */
export const formatDisplayTime = (timeStr: string, format: '12h' | '24h' | string = '12h'): string => {
  if (!timeStr) return '--:--';
  if (format === '24h') return timeStr;

  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
};

/**
 * Checks if a specific date (YYYY-MM-DD) falls on a holiday
 */
export const checkIsHoliday = (
  dateStr: string,
  holidays: Holiday[]
): { isHoliday: boolean; holiday?: Holiday } => {
  for (const h of holidays) {
    if (h.date === dateStr) {
      return { isHoliday: true, holiday: h };
    }
    if (h.endDate && dateStr >= h.date && dateStr <= h.endDate) {
      return { isHoliday: true, holiday: h };
    }
  }
  return { isHoliday: false };
};

/**
 * Retrieves the effective active schedule for a given date
 */
export const getEffectiveScheduleForDate = ({
  date,
  weeklySchedules,
  specialSchedules,
  holidays,
}: {
  date: Date;
  weeklySchedules: DaySchedule[];
  specialSchedules: SpecialSchedule[];
  holidays: Holiday[];
}): {
  sourceType: 'special' | 'weekly' | 'holiday';
  name: string;
  isOff: boolean;
  holiday?: Holiday;
  periods: Period[];
} => {
  const dateStr = date.toISOString().split('T')[0];

  // 1. Check Holiday Calendar
  const holCheck = checkIsHoliday(dateStr, holidays);
  if (holCheck.isHoliday) {
    return {
      sourceType: 'holiday',
      name: holCheck.holiday?.name || 'School Holiday',
      isOff: true,
      holiday: holCheck.holiday,
      periods: [],
    };
  }

  // 2. Check Active Special Schedule
  const activeSpecial = specialSchedules.find(
    (s) => s.isActive && dateStr >= s.startDate && dateStr <= s.endDate
  );
  if (activeSpecial) {
    return {
      sourceType: 'special',
      name: activeSpecial.name,
      isOff: false,
      periods: activeSpecial.periods,
    };
  }

  // 3. Fallback to Day of Week Weekly Schedule
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday...
  const daySchedule = weeklySchedules.find((s) => s.dayOfWeek === dayOfWeek) || {
    id: 'default',
    dayOfWeek,
    name: 'Standard Day Schedule',
    isHolidayOrOff: false,
    periods: [],
  };

  return {
    sourceType: 'weekly',
    name: daySchedule.name,
    isOff: daySchedule.isHolidayOrOff,
    periods: daySchedule.periods,
  };
};

/**
 * Extracts and sorts all individual scheduled bell events for a list of periods
 */
export const compileScheduledEvents = (
  periods: Period[],
  defaultSoundId: string = 'classic'
): ScheduledBellEvent[] => {
  const events: ScheduledBellEvent[] = [];

  for (const p of periods) {
    if (!p.enabled) continue;

    const startMins = timeToMinutes(p.startTime);
    const endMins = timeToMinutes(p.endTime);

    // 1. Warning Bell
    if (p.hasWarningBell && p.warningMinutesBefore > 0) {
      const warnMins = startMins - p.warningMinutesBefore;
      if (warnMins >= 0) {
        const warnTimeStr = minutesToTime(warnMins);
        events.push({
          id: `${p.id}_warning`,
          periodId: p.id,
          timeString: warnTimeStr,
          timeValue: warnMins,
          eventName: `Warning: ${p.name} in ${p.warningMinutesBefore}m`,
          periodName: p.name,
          periodNumber: p.periodNumber,
          bellType: 'warning',
          soundId: p.warningSoundId || p.startSoundId || defaultSoundId,
          ringCount: 1,
          isWarning: true,
          signature: `${p.id}_warn_${warnTimeStr}`,
        });
      }
    }

    // 2. Single Bell Event (Manual/Standalone Bell Time)
    if (p.isSingleBell) {
      events.push({
        id: `${p.id}_single`,
        periodId: p.id,
        timeString: p.startTime,
        timeValue: startMins,
        eventName: p.name,
        periodName: p.name,
        periodNumber: p.periodNumber,
        bellType: p.bellType,
        soundId: p.startSoundId || defaultSoundId,
        ringCount: p.ringCount || 2,
        isWarning: false,
        signature: `${p.id}_single_${p.startTime}`,
      });
      continue;
    }

    // 3. Period Start Bell
    if (p.ringAtStart) {
      let bType: BellType = p.bellType;
      if (bType === 'school_bell') bType = 'period_start';

      events.push({
        id: `${p.id}_start`,
        periodId: p.id,
        timeString: p.startTime,
        timeValue: startMins,
        eventName: `${p.name} Starts`,
        periodName: p.name,
        periodNumber: p.periodNumber,
        bellType: bType,
        soundId: p.startSoundId || defaultSoundId,
        ringCount: p.ringCount || 2,
        isWarning: false,
        signature: `${p.id}_start_${p.startTime}`,
      });
    }

    // 3. Period End Bell
    if (p.ringAtEnd && p.endTime && p.endTime !== p.startTime) {
      events.push({
        id: `${p.id}_end`,
        periodId: p.id,
        timeString: p.endTime,
        timeValue: endMins,
        eventName: `${p.name} Ends`,
        periodName: p.name,
        periodNumber: p.periodNumber,
        bellType: p.bellType === 'closing' ? 'closing' : 'period_end',
        soundId: p.endSoundId || p.startSoundId || defaultSoundId,
        ringCount: p.ringCount || 2,
        isWarning: false,
        signature: `${p.id}_end_${p.endTime}`,
      });
    }
  }

  // Sort chronologically
  return events.sort((a, b) => a.timeValue - b.timeValue);
};

/**
 * Detects scheduling conflicts (multiple bells scheduled for the exact same time)
 */
export const detectScheduleConflicts = (
  periods: Period[]
): { hasConflicts: boolean; conflicts: { time: string; events: string[] }[] } => {
  const events = compileScheduledEvents(periods);
  const timeMap: Record<string, string[]> = {};

  for (const ev of events) {
    if (!timeMap[ev.timeString]) {
      timeMap[ev.timeString] = [];
    }
    timeMap[ev.timeString].push(ev.eventName);
  }

  const conflicts: { time: string; events: string[] }[] = [];
  for (const [time, evNames] of Object.entries(timeMap)) {
    if (evNames.length > 1) {
      conflicts.push({ time, events: evNames });
    }
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
  };
};

/**
 * Calculates current period, next bell, countdown, and previous bell based on current clock time
 */
export const calculateScheduleStatus = ({
  currentTime,
  periods,
  defaultSoundId = 'classic',
  isHolidayOrOff = false,
}: {
  currentTime: Date;
  periods: Period[];
  defaultSoundId?: string;
  isHolidayOrOff?: boolean;
}): {
  currentPeriod: Period | null;
  nextBellEvent: ScheduledBellEvent | null;
  previousBellEvent: ScheduledBellEvent | null;
  countdownSeconds: number;
  countdownString: string;
  allEvents: ScheduledBellEvent[];
} => {
  if (isHolidayOrOff || periods.length === 0) {
    return {
      currentPeriod: null,
      nextBellEvent: null,
      previousBellEvent: null,
      countdownSeconds: 0,
      countdownString: '00:00:00',
      allEvents: [],
    };
  }

  const events = compileScheduledEvents(periods, defaultSoundId);
  const curHours = currentTime.getHours();
  const curMins = currentTime.getMinutes();
  const curSecs = currentTime.getSeconds();
  const currentTotalSeconds = curHours * 3600 + curMins * 60 + curSecs;
  const currentMinutes = curHours * 60 + curMins;

  // Determine current active period
  const activePeriod =
    periods.find((p) => {
      if (!p.enabled) return false;
      const start = timeToMinutes(p.startTime);
      const end = timeToMinutes(p.endTime);
      return currentMinutes >= start && currentMinutes < end;
    }) || null;

  // Find next upcoming bell event and previous passed event
  let nextEvent: ScheduledBellEvent | null = null;
  let prevEvent: ScheduledBellEvent | null = null;

  for (const ev of events) {
    const evTotalSeconds = ev.timeValue * 60;
    if (evTotalSeconds > currentTotalSeconds) {
      if (!nextEvent) {
        nextEvent = ev;
      }
    } else {
      prevEvent = ev;
    }
  }

  let countdownSeconds = 0;
  if (nextEvent) {
    countdownSeconds = Math.max(0, nextEvent.timeValue * 60 - currentTotalSeconds);
  }

  const ch = Math.floor(countdownSeconds / 3600);
  const cm = Math.floor((countdownSeconds % 3600) / 60);
  const cs = countdownSeconds % 60;
  const countdownString = `${ch.toString().padStart(2, '0')}:${cm
    .toString()
    .padStart(2, '0')}:${cs.toString().padStart(2, '0')}`;

  return {
    currentPeriod: activePeriod,
    nextBellEvent: nextEvent,
    previousBellEvent: prevEvent,
    countdownSeconds,
    countdownString,
    allEvents: events,
  };
};

export const generateDayScheduleEvents = compileScheduledEvents;

export const getCurrentPeriod = (periods: Period[], currentMinutes: number): Period | null => {
  return (
    periods.find((p) => {
      if (!p.enabled) return false;
      const start = timeToMinutes(p.startTime);
      const end = timeToMinutes(p.endTime);
      return currentMinutes >= start && currentMinutes < end;
    }) || null
  );
};

export const getNextBellEvent = (
  events: ScheduledBellEvent[],
  currentMinutes: number
): ScheduledBellEvent | null => {
  for (const ev of events) {
    if (ev.timeValue > currentMinutes) {
      return ev;
    }
  }
  return null;
};

export const computeCountdownString = (
  nextEvent: ScheduledBellEvent | null,
  currentMinutes: number,
  currentSeconds: number
): string => {
  if (!nextEvent) return '00:00:00';
  const currentTotalSeconds = currentMinutes * 60 + currentSeconds;
  const targetTotalSeconds = nextEvent.timeValue * 60;
  const diff = Math.max(0, targetTotalSeconds - currentTotalSeconds);
  const ch = Math.floor(diff / 3600);
  const cm = Math.floor((diff % 3600) / 60);
  const cs = diff % 60;
  return `${ch.toString().padStart(2, '0')}:${cm.toString().padStart(2, '0')}:${cs
    .toString()
    .padStart(2, '0')}`;
};

export const findActiveSpecialSchedule = (
  dateStr: string,
  specialSchedules: SpecialSchedule[]
): SpecialSchedule | undefined => {
  return specialSchedules.find(
    (s) => s.isActive && dateStr >= s.startDate && dateStr <= s.endDate
  );
};

export const adjustTimeByMinutes = (timeString: string, deltaMinutes: number): string => {
  const mins = timeToMinutes(timeString);
  let newMins = (mins + deltaMinutes) % 1440;
  if (newMins < 0) newMins += 1440;
  return minutesToTime(newMins);
};

