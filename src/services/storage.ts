import {
  BellLog,
  BellSound,
  DaySchedule,
  Holiday,
  ManualScheduledBell,
  Period,
  SchoolSettings,
  SpecialSchedule,
} from '../types';

export const BUILTIN_SOUNDS: BellSound[] = [
  {
    id: 'temple',
    name: 'Sacred Temple Bell (1-Strike)',
    type: 'builtin',
    builtinType: 'temple',
    durationSeconds: 4.5,
    defaultRingCount: 1,
    intervalSeconds: 1.2,
  },
  {
    id: 'classic',
    name: 'Classic School Bell',
    type: 'builtin',
    builtinType: 'classic',
    durationSeconds: 3,
    defaultRingCount: 2,
    intervalSeconds: 1,
  },
  {
    id: 'chime',
    name: 'Westminster Chime',
    type: 'builtin',
    builtinType: 'chime',
    durationSeconds: 3.5,
    defaultRingCount: 1,
    intervalSeconds: 1,
  },
  {
    id: 'brass_hand',
    name: 'Traditional Brass Hand Bell',
    type: 'builtin',
    builtinType: 'brass_hand',
    durationSeconds: 2.5,
    defaultRingCount: 2,
    intervalSeconds: 1,
  },
  {
    id: 'digital_buzzer',
    name: 'Electronic Digital Buzzer',
    type: 'builtin',
    builtinType: 'digital_buzzer',
    durationSeconds: 2,
    defaultRingCount: 3,
    intervalSeconds: 0.8,
  },
  {
    id: 'gentle_gong',
    name: 'Gentle Acoustic Gong',
    type: 'builtin',
    builtinType: 'gentle_gong',
    durationSeconds: 4,
    defaultRingCount: 1,
    intervalSeconds: 1.5,
  },
  {
    id: 'emergency_siren',
    name: 'Emergency Siren / Alert',
    type: 'builtin',
    builtinType: 'emergency_siren',
    durationSeconds: 4,
    defaultRingCount: 3,
    intervalSeconds: 1,
  },
];

export const DEFAULT_PERIODS: Period[] = [
  {
    id: 'p_assembly',
    periodNumber: 0,
    name: 'Morning Assembly',
    startTime: '09:30',
    endTime: '09:45',
    bellType: 'assembly',
    ringAtStart: true,
    ringAtEnd: true,
    hasWarningBell: true,
    warningMinutesBefore: 5,
    startSoundId: 'chime',
    endSoundId: 'classic',
    warningSoundId: 'chime',
    ringCount: 2,
    enabled: true,
  },
  {
    id: 'p1',
    periodNumber: 1,
    name: 'Period 1',
    startTime: '09:45',
    endTime: '10:30',
    bellType: 'period_start',
    ringAtStart: true,
    ringAtEnd: true,
    hasWarningBell: false,
    warningMinutesBefore: 5,
    startSoundId: 'classic',
    endSoundId: 'classic',
    ringCount: 2,
    enabled: true,
  },
  {
    id: 'p2',
    periodNumber: 2,
    name: 'Period 2',
    startTime: '10:30',
    endTime: '11:15',
    bellType: 'school_bell',
    ringAtStart: true,
    ringAtEnd: true,
    hasWarningBell: false,
    warningMinutesBefore: 5,
    startSoundId: 'classic',
    endSoundId: 'classic',
    ringCount: 2,
    enabled: true,
  },
  {
    id: 'p_break',
    periodNumber: 0,
    name: 'Morning Recess',
    startTime: '11:15',
    endTime: '11:30',
    bellType: 'break',
    ringAtStart: true,
    ringAtEnd: true,
    hasWarningBell: true,
    warningMinutesBefore: 2,
    startSoundId: 'chime',
    endSoundId: 'classic',
    warningSoundId: 'digital_buzzer',
    ringCount: 2,
    enabled: true,
  },
  {
    id: 'p3',
    periodNumber: 3,
    name: 'Period 3',
    startTime: '11:30',
    endTime: '12:15',
    bellType: 'school_bell',
    ringAtStart: true,
    ringAtEnd: true,
    hasWarningBell: false,
    warningMinutesBefore: 5,
    startSoundId: 'classic',
    endSoundId: 'classic',
    ringCount: 2,
    enabled: true,
  },
  {
    id: 'p4',
    periodNumber: 4,
    name: 'Period 4',
    startTime: '12:15',
    endTime: '13:00',
    bellType: 'school_bell',
    ringAtStart: true,
    ringAtEnd: true,
    hasWarningBell: false,
    warningMinutesBefore: 5,
    startSoundId: 'classic',
    endSoundId: 'classic',
    ringCount: 2,
    enabled: true,
  },
  {
    id: 'p_lunch',
    periodNumber: 0,
    name: 'Lunch Break',
    startTime: '13:00',
    endTime: '13:30',
    bellType: 'lunch',
    ringAtStart: true,
    ringAtEnd: true,
    hasWarningBell: true,
    warningMinutesBefore: 3,
    startSoundId: 'chime',
    endSoundId: 'classic',
    warningSoundId: 'chime',
    ringCount: 3,
    enabled: true,
  },
  {
    id: 'p5',
    periodNumber: 5,
    name: 'Period 5',
    startTime: '13:30',
    endTime: '14:15',
    bellType: 'school_bell',
    ringAtStart: true,
    ringAtEnd: true,
    hasWarningBell: false,
    warningMinutesBefore: 5,
    startSoundId: 'classic',
    endSoundId: 'classic',
    ringCount: 2,
    enabled: true,
  },
  {
    id: 'p6',
    periodNumber: 6,
    name: 'Period 6',
    startTime: '14:15',
    endTime: '15:00',
    bellType: 'school_bell',
    ringAtStart: true,
    ringAtEnd: true,
    hasWarningBell: false,
    warningMinutesBefore: 5,
    startSoundId: 'classic',
    endSoundId: 'classic',
    ringCount: 2,
    enabled: true,
  },
  {
    id: 'p_closing',
    periodNumber: 0,
    name: 'School Dismissal / Closing',
    startTime: '15:00',
    endTime: '15:05',
    bellType: 'closing',
    ringAtStart: true,
    ringAtEnd: false,
    hasWarningBell: true,
    warningMinutesBefore: 5,
    startSoundId: 'chime',
    warningSoundId: 'chime',
    ringCount: 3,
    enabled: true,
  },
];

export const DEFAULT_WEEKLY_SCHEDULES: DaySchedule[] = [
  {
    id: 'sched_sun',
    dayOfWeek: 0,
    name: 'Sunday (Normal Schedule)',
    isHolidayOrOff: false,
    periods: JSON.parse(JSON.stringify(DEFAULT_PERIODS)),
  },
  {
    id: 'sched_mon',
    dayOfWeek: 1,
    name: 'Monday (Normal Schedule)',
    isHolidayOrOff: false,
    periods: JSON.parse(JSON.stringify(DEFAULT_PERIODS)),
  },
  {
    id: 'sched_tue',
    dayOfWeek: 2,
    name: 'Tuesday (Normal Schedule)',
    isHolidayOrOff: false,
    periods: JSON.parse(JSON.stringify(DEFAULT_PERIODS)),
  },
  {
    id: 'sched_wed',
    dayOfWeek: 3,
    name: 'Wednesday (Normal Schedule)',
    isHolidayOrOff: false,
    periods: JSON.parse(JSON.stringify(DEFAULT_PERIODS)),
  },
  {
    id: 'sched_thu',
    dayOfWeek: 4,
    name: 'Thursday (Normal Schedule)',
    isHolidayOrOff: false,
    periods: JSON.parse(JSON.stringify(DEFAULT_PERIODS)),
  },
  {
    id: 'sched_fri',
    dayOfWeek: 5,
    name: 'Friday (Half-Day Short Schedule)',
    isHolidayOrOff: false,
    periods: [
      {
        id: 'fri_assembly',
        periodNumber: 0,
        name: 'Assembly',
        startTime: '09:30',
        endTime: '09:45',
        bellType: 'assembly',
        ringAtStart: true,
        ringAtEnd: true,
        hasWarningBell: true,
        warningMinutesBefore: 5,
        startSoundId: 'chime',
        ringCount: 2,
        enabled: true,
      },
      {
        id: 'fri_p1',
        periodNumber: 1,
        name: 'Period 1',
        startTime: '09:45',
        endTime: '10:20',
        bellType: 'period_start',
        ringAtStart: true,
        ringAtEnd: true,
        hasWarningBell: false,
        warningMinutesBefore: 5,
        startSoundId: 'classic',
        ringCount: 2,
        enabled: true,
      },
      {
        id: 'fri_p2',
        periodNumber: 2,
        name: 'Period 2',
        startTime: '10:20',
        endTime: '11:00',
        bellType: 'school_bell',
        ringAtStart: true,
        ringAtEnd: true,
        hasWarningBell: false,
        warningMinutesBefore: 5,
        startSoundId: 'classic',
        ringCount: 2,
        enabled: true,
      },
      {
        id: 'fri_break',
        periodNumber: 0,
        name: 'Short Break',
        startTime: '11:00',
        endTime: '11:20',
        bellType: 'break',
        ringAtStart: true,
        ringAtEnd: true,
        hasWarningBell: true,
        warningMinutesBefore: 2,
        startSoundId: 'chime',
        ringCount: 2,
        enabled: true,
      },
      {
        id: 'fri_p3',
        periodNumber: 3,
        name: 'Period 3',
        startTime: '11:20',
        endTime: '12:00',
        bellType: 'school_bell',
        ringAtStart: true,
        ringAtEnd: true,
        hasWarningBell: false,
        warningMinutesBefore: 5,
        startSoundId: 'classic',
        ringCount: 2,
        enabled: true,
      },
      {
        id: 'fri_closing',
        periodNumber: 0,
        name: 'Friday School Dismissal',
        startTime: '12:00',
        endTime: '12:05',
        bellType: 'closing',
        ringAtStart: true,
        ringAtEnd: false,
        hasWarningBell: true,
        warningMinutesBefore: 5,
        startSoundId: 'chime',
        ringCount: 3,
        enabled: true,
      },
    ],
  },
  {
    id: 'sched_sat',
    dayOfWeek: 6,
    name: 'Saturday (Weekly Off / Holiday)',
    isHolidayOrOff: true,
    periods: [],
  },
];

export const DEFAULT_SETTINGS: SchoolSettings = {
  schoolName: 'TR Memorial English Boarding School',
  address: 'Sukhad, Kailali, Nepal',
  principalName: 'Principal Office',
  contactPhone: '+977-91-500000',
  contactEmail: 'info@trmemorial.edu.np',
  timezone: 'Asia/Kathmandu',
  timeFormat: '12h',
  masterVolume: 85,
  bellVolume: 90,
  notificationVolume: 80,
  defaultSoundId: 'temple',
  defaultRingDuration: 4.5,
  defaultRingCount: 1,
  defaultInterval: 1.2,
  autoStartSchedule: true,
  autoStartScheduler: true,
  enableNotifications: true,
  requireConfirmationForManualRing: false,
  adminPin: '1234',
  displayTheme: 'light',
};

export const DEFAULT_HOLIDAYS: Holiday[] = [
  {
    id: 'hol_1',
    name: 'National Teachers Day',
    date: '2026-09-10',
    type: 'school',
    notes: 'School closed for staff development and appreciation ceremonies',
  },
  {
    id: 'hol_2',
    name: 'Autumn Term Mid-Break',
    date: '2026-10-15',
    endDate: '2026-10-18',
    type: 'vacation',
    notes: 'Mid-term recess for students and faculty',
  },
  {
    id: 'hol_3',
    name: 'Sports Day Rehearsal Off',
    date: '2026-11-04',
    type: 'special',
    notes: 'No academic classes',
  },
];

export const DEFAULT_SPECIAL_SCHEDULES: SpecialSchedule[] = [
  {
    id: 'spec_exam',
    name: 'Semester Examination Schedule',
    startDate: '2026-12-01',
    endDate: '2026-12-07',
    isActive: false,
    reason: 'Reduced periods with quiet study sessions',
    periods: [
      {
        id: 'exam_p1',
        periodNumber: 1,
        name: 'Exam Session 1 (Morning)',
        startTime: '10:00',
        endTime: '12:00',
        bellType: 'special',
        ringAtStart: true,
        ringAtEnd: true,
        hasWarningBell: true,
        warningMinutesBefore: 10,
        startSoundId: 'chime',
        endSoundId: 'classic',
        ringCount: 2,
        enabled: true,
      },
      {
        id: 'exam_break',
        periodNumber: 0,
        name: 'Intermission Recess',
        startTime: '12:00',
        endTime: '13:00',
        bellType: 'break',
        ringAtStart: true,
        ringAtEnd: true,
        hasWarningBell: true,
        warningMinutesBefore: 5,
        startSoundId: 'chime',
        ringCount: 2,
        enabled: true,
      },
      {
        id: 'exam_p2',
        periodNumber: 2,
        name: 'Exam Session 2 (Afternoon)',
        startTime: '13:00',
        endTime: '15:00',
        bellType: 'special',
        ringAtStart: true,
        ringAtEnd: true,
        hasWarningBell: true,
        warningMinutesBefore: 10,
        startSoundId: 'chime',
        endSoundId: 'classic',
        ringCount: 2,
        enabled: true,
      },
    ],
  },
];

const STORAGE_KEYS = {
  SETTINGS: 'smart_bell_settings',
  PERIODS: 'smart_bell_periods',
  WEEKLY: 'smart_bell_weekly_schedules',
  CUSTOM_SOUNDS: 'smart_bell_custom_sounds',
  HOLIDAYS: 'smart_bell_holidays',
  SPECIAL_SCHEDULES: 'smart_bell_special_schedules',
  LOGS: 'smart_bell_logs',
  MANUAL_BELLS: 'smart_bell_manual_bells',
  SCHEDULER_STATE: 'smart_bell_scheduler_state',
};

export class StorageService {
  public static getSettings(): SchoolSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(data);
      // Migrate old default school name or sound if needed
      if (!parsed.schoolName || parsed.schoolName.includes('St. Jude') || parsed.schoolName.includes('Smart School')) {
        parsed.schoolName = 'TR Memorial English Boarding School';
      }
      if (!parsed.defaultSoundId || parsed.defaultSoundId === 'classic') {
        parsed.defaultSoundId = 'temple';
        parsed.defaultRingCount = 1;
      }
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  public static saveSettings(settings: SchoolSettings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }

  public static getPeriods(): Period[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PERIODS);
      return data ? JSON.parse(data) : DEFAULT_PERIODS;
    } catch {
      return DEFAULT_PERIODS;
    }
  }

  public static savePeriods(periods: Period[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.PERIODS, JSON.stringify(periods));
    } catch (e) {
      console.error('Failed to save periods:', e);
    }
  }

  public static getWeeklySchedules(): DaySchedule[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WEEKLY);
      return data ? JSON.parse(data) : DEFAULT_WEEKLY_SCHEDULES;
    } catch {
      return DEFAULT_WEEKLY_SCHEDULES;
    }
  }

  public static saveWeeklySchedules(schedules: DaySchedule[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.WEEKLY, JSON.stringify(schedules));
    } catch (e) {
      console.error('Failed to save weekly schedules:', e);
    }
  }

  public static getCustomSounds(): BellSound[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_SOUNDS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static getAllSounds(): BellSound[] {
    const custom = this.getCustomSounds();
    return [...BUILTIN_SOUNDS, ...custom];
  }

  public static saveCustomSounds(sounds: BellSound[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_SOUNDS, JSON.stringify(sounds));
    } catch (e) {
      console.error('Failed to save custom sounds:', e);
    }
  }

  public static getHolidays(): Holiday[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HOLIDAYS);
      return data ? JSON.parse(data) : DEFAULT_HOLIDAYS;
    } catch {
      return DEFAULT_HOLIDAYS;
    }
  }

  public static saveHolidays(holidays: Holiday[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.HOLIDAYS, JSON.stringify(holidays));
    } catch (e) {
      console.error('Failed to save holidays:', e);
    }
  }

  public static getSpecialSchedules(): SpecialSchedule[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SPECIAL_SCHEDULES);
      return data ? JSON.parse(data) : DEFAULT_SPECIAL_SCHEDULES;
    } catch {
      return DEFAULT_SPECIAL_SCHEDULES;
    }
  }

  public static saveSpecialSchedules(schedules: SpecialSchedule[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.SPECIAL_SCHEDULES, JSON.stringify(schedules));
    } catch (e) {
      console.error('Failed to save special schedules:', e);
    }
  }

  public static getLogs(): BellLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LOGS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static getHistory(): BellLog[] {
    return this.getLogs();
  }

  public static addLog(log: Omit<BellLog, 'id'>): BellLog {
    const logs = this.getLogs();
    const newLog: BellLog = {
      ...log,
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    };
    // Keep max 500 logs to preserve localStorage space
    const updated = [newLog, ...logs].slice(0, 500);
    try {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save log:', e);
    }
    return newLog;
  }

  public static addHistoryLog(log: Omit<BellLog, 'id'>): BellLog {
    return this.addLog(log);
  }

  public static clearLogs() {
    try {
      localStorage.removeItem(STORAGE_KEYS.LOGS);
    } catch (e) {
      console.error('Failed to clear logs:', e);
    }
  }

  public static clearHistory() {
    this.clearLogs();
  }

  public static getManualBells(): ManualScheduledBell[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MANUAL_BELLS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static saveManualBells(bells: ManualScheduledBell[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.MANUAL_BELLS, JSON.stringify(bells));
    } catch (e) {
      console.error('Failed to save manual bells:', e);
    }
  }

  public static resetToDefaults() {
    try {
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      localStorage.removeItem(STORAGE_KEYS.PERIODS);
      localStorage.removeItem(STORAGE_KEYS.WEEKLY);
      localStorage.removeItem(STORAGE_KEYS.CUSTOM_SOUNDS);
      localStorage.removeItem(STORAGE_KEYS.HOLIDAYS);
      localStorage.removeItem(STORAGE_KEYS.SPECIAL_SCHEDULES);
      localStorage.removeItem(STORAGE_KEYS.LOGS);
      localStorage.removeItem(STORAGE_KEYS.MANUAL_BELLS);
    } catch (e) {
      console.error('Failed to reset to defaults:', e);
    }
  }

  // Full configuration export
  public static exportFullConfig(): string {
    const bundle = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      settings: this.getSettings(),
      weeklySchedules: this.getWeeklySchedules(),
      holidays: this.getHolidays(),
      specialSchedules: this.getSpecialSchedules(),
      customSounds: this.getCustomSounds(),
    };
    return JSON.stringify(bundle, null, 2);
  }

  // Full configuration restore
  public static importFullConfig(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.settings) this.saveSettings(data.settings);
      if (data.weeklySchedules && Array.isArray(data.weeklySchedules)) {
        this.saveWeeklySchedules(data.weeklySchedules);
      }
      if (data.holidays && Array.isArray(data.holidays)) {
        this.saveHolidays(data.holidays);
      }
      if (data.specialSchedules && Array.isArray(data.specialSchedules)) {
        this.saveSpecialSchedules(data.specialSchedules);
      }
      if (data.customSounds && Array.isArray(data.customSounds)) {
        this.saveCustomSounds(data.customSounds);
      }
      return true;
    } catch (err) {
      console.error('Import config failed:', err);
      return false;
    }
  }

  // CSV Timetable Export
  public static exportTimetableCSV(periods: Period[]): string {
    const headers = ['Period Number', 'Period Name', 'Start Time', 'End Time', 'Bell Type', 'Ring Count', 'Enabled'];
    const rows = periods.map((p) => [
      p.periodNumber,
      `"${p.name.replace(/"/g, '""')}"`,
      p.startTime,
      p.endTime,
      p.bellType,
      p.ringCount,
      p.enabled ? 'Yes' : 'No',
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  // CSV Timetable Import with validation
  public static parseTimetableCSV(csvText: string): { success: boolean; periods?: Period[]; error?: string } {
    try {
      const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        return { success: false, error: 'CSV file must have a header row and at least one period row.' };
      }

      const periods: Period[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
        if (parts.length < 4) continue;

        const num = parseInt(parts[0], 10) || 0;
        const name = parts[1] || `Period ${num}`;
        const start = parts[2];
        const end = parts[3];

        if (!/^\d{1,2}:\d{2}$/.test(start) || !/^\d{1,2}:\d{2}$/.test(end)) {
          return { success: false, error: `Invalid time format on line ${i + 1}: "${line}". Format must be HH:MM.` };
        }

        periods.push({
          id: 'csv_p_' + Date.now() + '_' + i,
          periodNumber: num,
          name,
          startTime: start.length === 4 ? '0' + start : start,
          endTime: end.length === 4 ? '0' + end : end,
          bellType: (parts[4] as any) || 'school_bell',
          ringAtStart: true,
          ringAtEnd: true,
          hasWarningBell: false,
          warningMinutesBefore: 5,
          startSoundId: 'classic',
          endSoundId: 'classic',
          ringCount: parseInt(parts[5], 10) || 2,
          enabled: parts[6] ? parts[6].toLowerCase() === 'yes' || parts[6] === 'true' : true,
        });
      }

      return { success: true, periods };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to parse CSV file.' };
    }
  }
}
