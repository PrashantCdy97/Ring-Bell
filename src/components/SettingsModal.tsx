import React, { useState, useEffect } from 'react';
import {
  Settings,
  School,
  Globe,
  Lock,
  Download,
  Upload,
  RotateCcw,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  LogIn,
  Key,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { AppBackupData, SchoolSettings } from '../types';
import { driveService, DriveFileMeta } from '../services/driveService';
import { StorageService } from '../services/storage';

interface Props {
  settings: SchoolSettings;
  isAdmin: boolean;
  onUpdateSettings: (newSettings: SchoolSettings) => void;
  onRequestAdmin: () => void;
  getFullBackupData: () => AppBackupData;
  onRestoreBackup: (backup: AppBackupData) => void;
  onResetToDefaults: () => void;
  onOpenAndroidModal?: () => void;
}

const COMMON_TIMEZONES = [
  { value: 'Asia/Kathmandu', label: 'Kathmandu (Nepal Time, UTC+5:45)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST, UTC+5:30)' },
  { value: 'Asia/Dhaka', label: 'Bangladesh Time (BST, UTC+6:00)' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST, UTC+4:00)' },
  { value: 'Asia/Singapore', label: 'Singapore Standard Time (SST, UTC+8:00)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST, UTC+9:00)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT/BST, UTC+0/+1)' },
  { value: 'America/New_York', label: 'Eastern Time (US/Canada, UTC-5/-4)' },
  { value: 'America/Chicago', label: 'Central Time (US/Canada, UTC-6/-5)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US/Canada, UTC-8/-7)' },
  { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
];

export const SettingsModal: React.FC<Props> = ({
  settings,
  isAdmin,
  onUpdateSettings,
  onRequestAdmin,
  getFullBackupData,
  onRestoreBackup,
  onResetToDefaults,
  onOpenAndroidModal,
}) => {
  const [formData, setFormData] = useState<SchoolSettings>({ ...settings });
  const [newPin, setNewPin] = useState(settings.adminPin);
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);

  // Drive state
  const [driveUser, setDriveUser] = useState<any>(null);
  const [isDriveLoading, setIsDriveLoading] = useState(false);
  const [driveBackups, setDriveBackups] = useState<DriveFileMeta[]>([]);
  const [driveMsg, setDriveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setFormData({ ...settings });
    setNewPin(settings.adminPin);
  }, [settings]);

  useEffect(() => {
    // Check initial drive user
    const user = driveService.getCurrentUser();
    setDriveUser(user);
    if (user) {
      loadDriveBackups();
    }
  }, []);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      onRequestAdmin();
      return;
    }
    onUpdateSettings({
      ...formData,
      adminPin: newPin.trim() || '1234',
    });
    setPinChangeSuccess(true);
    setTimeout(() => setPinChangeSuccess(false), 3000);
  };

  // Local JSON Backup
  const handleDownloadLocalBackup = () => {
    const backupData = getFullBackupData();
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `smart_bell_backup_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Local JSON Restore
  const handleUploadLocalRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) {
      onRequestAdmin();
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.periods || !parsed.settings) {
          alert('Invalid Smart School Bell backup file.');
          return;
        }
        if (window.confirm('Restore this backup? Current configuration will be replaced.')) {
          onRestoreBackup(parsed);
          alert('Backup successfully restored!');
        }
      } catch (err) {
        alert('Could not parse JSON backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Google Drive Handlers
  const handleDriveSignIn = async () => {
    setIsDriveLoading(true);
    setDriveMsg(null);
    try {
      const user = await driveService.signIn();
      setDriveUser(user);
      setDriveMsg({ type: 'success', text: `Connected as ${user.displayName || user.email}` });
      await loadDriveBackups();
    } catch (err: any) {
      setDriveMsg({ type: 'error', text: err?.message || 'Google Drive authentication failed.' });
    } finally {
      setIsDriveLoading(false);
    }
  };

  const handleDriveSignOut = async () => {
    await driveService.signOut();
    setDriveUser(null);
    setDriveBackups([]);
    setDriveMsg({ type: 'success', text: 'Signed out from Google Drive.' });
  };

  const loadDriveBackups = async () => {
    try {
      const list = await driveService.listBackups();
      setDriveBackups(list);
    } catch (err: any) {
      console.error('Failed to list backups:', err);
    }
  };

  const handleBackupToDrive = async () => {
    if (!isAdmin) {
      onRequestAdmin();
      return;
    }
    setIsDriveLoading(true);
    setDriveMsg(null);
    try {
      const backupData = getFullBackupData();
      const filename = `smart_school_bell_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      await driveService.backupToDrive(backupData, filename);
      setDriveMsg({ type: 'success', text: 'Backup uploaded successfully to your Google Drive!' });
      await loadDriveBackups();
    } catch (err: any) {
      setDriveMsg({ type: 'error', text: err?.message || 'Failed to upload backup to Google Drive.' });
    } finally {
      setIsDriveLoading(false);
    }
  };

  const handleRestoreFromDrive = async (fileId: string) => {
    if (!isAdmin) {
      onRequestAdmin();
      return;
    }
    if (!window.confirm('Restore this backup from Google Drive? Current settings will be replaced.')) {
      return;
    }

    setIsDriveLoading(true);
    setDriveMsg(null);
    try {
      const backupData = await driveService.restoreFromDrive(fileId);
      onRestoreBackup(backupData);
      setDriveMsg({ type: 'success', text: 'Backup restored successfully from Google Drive!' });
    } catch (err: any) {
      setDriveMsg({ type: 'error', text: err?.message || 'Failed to restore backup from Drive.' });
    } finally {
      setIsDriveLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* School Information & Timing Form */}
      <form onSubmit={handleSaveGeneral} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <School className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Institution Profile</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                School / Institution Name
              </label>
              <input
                type="text"
                required
                value={formData.schoolName}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Principal / Headmaster Name
              </label>
              <input
                type="text"
                value={formData.principalName || ''}
                onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Campus Address
              </label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Timezone, Clock Format, and Startup */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Clock Synchronization & Automation
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Regional Timezone
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Time Format Display
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, timeFormat: '12h' })}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    formData.timeFormat === '12h'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  12-Hour (e.g. 01:30 PM)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, timeFormat: '24h' })}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    formData.timeFormat === '24h'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  24-Hour (e.g. 13:30)
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.autoStartSchedule}
                onChange={(e) => setFormData({ ...formData, autoStartSchedule: e.target.checked })}
                className="w-4 h-4 rounded accent-amber-500"
              />
              <div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Automatically Start Bell Schedule on App Open
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Activates automatic ringing immediately without requiring manual start click.
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requireConfirmationForManualRing}
                onChange={(e) =>
                  setFormData({ ...formData, requireConfirmationForManualRing: e.target.checked })
                }
                className="w-4 h-4 rounded accent-amber-500"
              />
              <div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Require Confirmation for Manual Bell Rings
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Prevents accidental broadcast presses by showing an extra confirmation step.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Security & Admin PIN */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Administrator Security</h3>
          </div>

          <div className="max-w-xs">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Administrator Access PIN
            </label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="Default: 1234"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono font-bold"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Protects timetable editing, sound modifications, and school configurations.
            </p>
          </div>

          {pinChangeSuccess && (
            <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-4 h-4" />
              <span>Settings and Administrator PIN saved successfully!</span>
            </div>
          )}

          <div className="mt-5">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </form>

      {/* Cloud Sync: Google Drive */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Google Drive Cloud Sync</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Securely back up timetable schedules, custom audio profiles, and settings directly into Google Drive.
              </p>
            </div>
          </div>

          <div>
            {driveUser ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {driveUser.email}
                </span>
                <button
                  onClick={handleDriveSignOut}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={handleDriveSignIn}
                disabled={isDriveLoading}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-blue-500" />
                {isDriveLoading ? 'Connecting...' : 'Connect Google Drive'}
              </button>
            )}
          </div>
        </div>

        {driveMsg && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 border ${
              driveMsg.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
            }`}
          >
            {driveMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{driveMsg.text}</span>
          </div>
        )}

        {driveUser && (
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBackupToDrive}
                disabled={isDriveLoading}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                {isDriveLoading ? 'Uploading...' : 'Upload New Cloud Backup'}
              </button>

              <button
                onClick={loadDriveBackups}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                title="Refresh Backup List"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Backups List */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              {driveBackups.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No cloud backups found on Google Drive. Click "Upload New Cloud Backup" above.
                </div>
              ) : (
                driveBackups.map((b) => (
                  <div key={b.id} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white font-mono">{b.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(b.createdTime).toLocaleString()}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRestoreFromDrive(b.id)}
                      disabled={isDriveLoading}
                      className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold border border-slate-200 dark:border-slate-700"
                    >
                      Restore This
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Android App & APK Installation */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Android App & APK Distribution
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            PWA / APK
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Install Smart School Bell directly on Android phones, tablets, or PA amplifiers, or package a standalone .APK binary file.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onOpenAndroidModal}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black flex items-center gap-2 shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <Smartphone className="w-4 h-4" />
            <span>Install on Android / Generate APK</span>
          </button>

          <a
            href={`https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(
              typeof window !== 'undefined' ? window.location.origin : ''
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-blue-500" />
            <span>Open PWABuilder (1-Click APK)</span>
          </a>
        </div>
      </div>

      {/* Local File Backup, Restore, and Reset */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
          Local Storage Backup & Maintenance
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
          Download a standalone offline snapshot file (.json) or reset the application to school default templates.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadLocalBackup}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download Local Backup File (.json)
          </button>

          <label className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            Restore from File (.json)
            <input type="file" accept=".json" onChange={handleUploadLocalRestore} className="hidden" />
          </label>

          <button
            onClick={() => {
              if (!isAdmin) {
                onRequestAdmin();
                return;
              }
              if (window.confirm('Reset all timetables, sounds, and settings to factory default templates?')) {
                onResetToDefaults();
              }
            }}
            className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ml-auto"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
};
