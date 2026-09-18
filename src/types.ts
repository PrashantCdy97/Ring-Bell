export type BellType =
  | 'school_bell'
  | 'opening'
  | 'assembly'
  | 'period_start'
  | 'period_end'
  | 'break'
  | 'lunch'
  | 'warning'
  | 'closing'
  | 'special';

export interface Period {
  id: string;
  periodNumber: number;
  name: string;
  startTime: string; // "HH:MM" 24h format
  endTime: string; // "HH:MM" 24h format
  bellType: BellType;
  ringAtStart: boolean;
  ringAtEnd: boolean;
  hasWarningBell: boolean;
  warningMinutesBefore: number;
  startSoundId: string;
  endSoundId?: string;
  warningSoundId?: string;
  ringCount: number;
  enabled: boolean;
  isSingleBell?: boolean; // When true, only rings at startTime as a single manual/standalone bell event
}

export interface DaySchedule {
  id: string;
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  name: string;
  isHolidayOrOff: boolean;
  periods: Period[];
}

export interface Holiday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD for multi-day
  type: 'public' | 'school' | 'exam' | 'vacation' | 'closure' | 'special';
  notes?: string;
}

export interface SpecialSchedule {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  periods: Period[];
  isActive: boolean;
  reason?: string;
}

export interface BellSound {
  id: string;
  name: string;
  type: 'builtin' | 'custom';
  builtinType?: 'classic' | 'chime' | 'brass_hand' | 'digital_buzzer' | 'gentle_gong' | 'emergency_siren' | 'temple';
  audioDataUrl?: string; // base64 / blob data url for custom uploaded audio
  durationSeconds: number;
  defaultRingCount: number;
  intervalSeconds: number;
}

export interface BellLog {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM or HH:MM:SS
  periodName: string;
  bellType: BellType | string;
  soundName: string;
  trigger: 'automatic' | 'manual';
  status: 'success' | 'failed' | 'skipped';
  timestamp?: string; // ISO string
  notes?: string;
}

export type BellHistoryEntry = BellLog;

export interface SchoolSettings {
  schoolName: string;
  address?: string;
  principalName?: string;
  contactPhone?: string;
  contactEmail?: string;
  phone?: string;
  email?: string;
  timezone: string; // Default: 'Asia/Kathmandu'
  timeFormat: '12h' | '24h';
  masterVolume: number; // 0 - 100
  bellVolume: number; // 0 - 100
  notificationVolume: number; // 0 - 100
  defaultSoundId: string;
  defaultRingDuration: number;
  defaultRingCount: number;
  defaultInterval: number;
  autoStartSchedule: boolean;
  autoStartScheduler?: boolean;
  enableNotifications?: boolean;
  requireConfirmationForManualRing: boolean;
  adminPin: string;
  displayTheme?: 'light' | 'dark' | 'system';
}

export interface ScheduledBellEvent {
  id: string;
  periodId: string;
  timeString: string; // "HH:MM"
  timeValue: number; // minutes from midnight (0..1439)
  eventName: string;
  periodName: string;
  periodNumber?: number;
  bellType: BellType;
  soundId: string;
  ringCount: number;
  isWarning: boolean;
  signature: string; // unique event signature for duplicate prevention
  isManual?: boolean; // Set if this bell was set manually
  manualBellId?: string;
}

export interface ManualScheduledBell {
  id: string;
  timeString: string; // "HH:MM" 24h format
  eventName: string;
  soundId: string;
  ringCount: number;
  bellType?: BellType;
  dateStr: string; // "YYYY-MM-DD"
  enabled: boolean;
  notes?: string;
  createdAt: string;
}

export interface ActiveRingingState {
  isRinging: boolean;
  eventName: string;
  bellType?: BellType;
  soundId?: string;
  ringCount: number;
  currentRingIndex: number;
  onStop?: () => void;
}

export interface AppBackupData {
  version: string;
  exportDate: string;
  settings: SchoolSettings;
  periods: Period[];
  weeklySchedules: DaySchedule[];
  holidays: Holiday[];
  specialSchedules: SpecialSchedule[];
  customSounds: BellSound[];
  historyLogs: BellLog[];
  manualBells?: ManualScheduledBell[];
}
