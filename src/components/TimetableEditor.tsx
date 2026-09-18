import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Edit2,
  Check,
  AlertTriangle,
  Download,
  Upload,
  Clock,
  Bell,
  CheckCircle2,
  Volume2,
} from 'lucide-react';
import { BellSound, BellType, Period } from '../types';
import {
  adjustTimeByMinutes,
  detectScheduleConflicts,
  formatDisplayTime,
  timeToMinutes,
} from '../services/scheduler';
import { StorageService } from '../services/storage';

interface Props {
  periods: Period[];
  sounds: BellSound[];
  timeFormat: '12h' | '24h';
  isAdmin: boolean;
  onSavePeriods: (periods: Period[]) => void;
  onRequestAdmin: () => void;
}

export const TimetableEditor: React.FC<Props> = ({
  periods,
  sounds,
  timeFormat,
  isAdmin,
  onSavePeriods,
  onRequestAdmin,
}) => {
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Period>>({});
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');

  // Check conflicts
  const conflicts = detectScheduleConflicts(periods);

  const handleStartEdit = (period: Period) => {
    if (!isAdmin) {
      onRequestAdmin();
      return;
    }
    setEditingPeriodId(period.id);
    setFormData({ ...period });
  };

  const handleAddNew = () => {
    if (!isAdmin) {
      onRequestAdmin();
      return;
    }

    // Default start time: end of last period or 09:00
    let start = '09:00';
    let end = '09:45';
    if (periods.length > 0) {
      const last = periods[periods.length - 1];
      start = last.endTime || '15:00';
      const startMins = timeToMinutes(start);
      const endMins = Math.min(1439, startMins + 45);
      const h = Math.floor(endMins / 60);
      const m = endMins % 60;
      end = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }

    const newPeriod: Period = {
      id: 'p_' + Date.now(),
      periodNumber: periods.length + 1,
      name: `Period ${periods.length + 1}`,
      startTime: start,
      endTime: end,
      bellType: 'school_bell',
      ringAtStart: true,
      ringAtEnd: true,
      hasWarningBell: false,
      warningMinutesBefore: 5,
      startSoundId: 'classic',
      endSoundId: 'classic',
      ringCount: 2,
      enabled: true,
      isSingleBell: false,
    };

    onSavePeriods([...periods, newPeriod]);
    setEditingPeriodId(newPeriod.id);
    setFormData(newPeriod);
  };

  const handleAddNewSingleBell = () => {
    if (!isAdmin) {
      onRequestAdmin();
      return;
    }

    const newSingleBell: Period = {
      id: 'single_' + Date.now(),
      periodNumber: 0,
      name: 'Assembly Bell',
      startTime: '08:30',
      endTime: '08:30',
      bellType: 'assembly',
      ringAtStart: true,
      ringAtEnd: false,
      hasWarningBell: false,
      warningMinutesBefore: 5,
      startSoundId: 'chime',
      ringCount: 2,
      enabled: true,
      isSingleBell: true,
    };

    onSavePeriods([...periods, newSingleBell]);
    setEditingPeriodId(newSingleBell.id);
    setFormData(newSingleBell);
  };

  const handleShiftPeriodTime = (id: string, deltaMinutes: number) => {
    if (!isAdmin) {
      onRequestAdmin();
      return;
    }
    const updated = periods.map((p) => {
      if (p.id === id) {
        const newStart = adjustTimeByMinutes(p.startTime, deltaMinutes);
        const newEnd = p.isSingleBell ? newStart : adjustTimeByMinutes(p.endTime, deltaMinutes);
        return {
          ...p,
          startTime: newStart,
          endTime: newEnd,
        };
      }
      return p;
    });
    onSavePeriods(updated);
  };

  const handleSaveEdit = () => {
    if (!formData.name || !formData.startTime) return;

    const isSingle = formData.isSingleBell ?? false;
    const finalEndTime = isSingle ? formData.startTime : (formData.endTime || formData.startTime);

    const updated = periods.map((p) => {
      if (p.id === editingPeriodId) {
        return {
          ...p,
          ...formData,
          endTime: finalEndTime,
          isSingleBell: isSingle,
          ringAtStart: true,
          ringAtEnd: isSingle ? false : (formData.ringAtEnd ?? true),
        } as Period;
      }
      return p;
    });

    onSavePeriods(updated);
    setEditingPeriodId(null);
    setFormData({});
  };

  const handleDelete = (id: string) => {
    if (!isAdmin) {
      onRequestAdmin();
      return;
    }
    const updated = periods.filter((p) => p.id !== id);
    onSavePeriods(updated);
    if (editingPeriodId === id) setEditingPeriodId(null);
  };

  const handleDuplicate = (period: Period) => {
    if (!isAdmin) {
      onRequestAdmin();
      return;
    }
    const cloned: Period = {
      ...period,
      id: 'p_' + Date.now(),
      name: `${period.name} (Copy)`,
      periodNumber: period.periodNumber + 1,
    };
    onSavePeriods([...periods, cloned]);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (!isAdmin) {
      onRequestAdmin();
      return;
    }
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= periods.length) return;

    const copy = [...periods];
    const temp = copy[index];
    copy[index] = copy[newIdx];
    copy[newIdx] = temp;
    onSavePeriods(copy);
  };

  const handleToggleEnabled = (id: string) => {
    if (!isAdmin) {
      onRequestAdmin();
      return;
    }
    const updated = periods.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p));
    onSavePeriods(updated);
  };

  // Export CSV
  const handleExportCSV = () => {
    const csv = StorageService.exportTimetableCSV(periods);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `smart_bell_timetable_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import CSV
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) {
      onRequestAdmin();
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const result = StorageService.parseTimetableCSV(text);
      if (result.success && result.periods) {
        onSavePeriods(result.periods);
        setImportSuccess(`Successfully loaded ${result.periods.length} periods from CSV!`);
        setImportError('');
      } else {
        setImportError(result.error || 'Failed to import timetable CSV.');
        setImportSuccess('');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Daily Timetable & Period Schedule
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Configure class periods, warning chimes, bell audio selections, and duration windows.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>

            <label className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              Import CSV
              <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
            </label>

            <button
              onClick={handleAddNewSingleBell}
              className="px-3.5 py-2 rounded-xl border border-amber-400 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Add a single standalone bell strike time (e.g. Assembly, Recess, Dismissal)"
            >
              <Bell className="w-4 h-4" />
              Add Single Bell
            </button>

            <button
              onClick={handleAddNew}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Period
            </button>
          </div>
        </div>

        {/* Conflict Detection Banner */}
        {conflicts.hasConflicts && (
          <div className="mt-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-sm">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              Schedule Conflict Detected! Multiple bells share identical scheduled times:
            </div>
            {conflicts.conflicts.map((c, i) => (
              <div key={i} className="pl-6 text-rose-700 dark:text-rose-300">
                • <strong className="font-mono">{formatDisplayTime(c.time, timeFormat)}</strong>: {c.events.join(', ')}
              </div>
            ))}
          </div>
        )}

        {importError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{importError}</span>
          </div>
        )}

        {importSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{importSuccess}</span>
          </div>
        )}
      </div>

      {/* Period Table / List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3.5 w-12 text-center">#</th>
                <th className="px-4 py-3.5">Period Name</th>
                <th className="px-4 py-3.5">Time Interval</th>
                <th className="px-4 py-3.5">Duration</th>
                <th className="px-4 py-3.5">Bell Type</th>
                <th className="px-4 py-3.5">Sound Profile</th>
                <th className="px-4 py-3.5 text-center">Active</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {periods.map((period, index) => {
                const isEditing = editingPeriodId === period.id;
                const startMins = timeToMinutes(period.startTime);
                const endMins = timeToMinutes(period.endTime);
                const duration = Math.max(0, endMins - startMins);

                if (isEditing) {
                  return (
                    <tr key={period.id} className="bg-amber-50/50 dark:bg-amber-950/30">
                      <td colSpan={8} className="p-4">
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-amber-300 dark:border-amber-800/80 shadow-md space-y-4">
                          <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 gap-2">
                            <div>
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                                Editing: {period.name}
                              </h4>
                              <span className="text-xs text-slate-400 font-mono">ID: {period.id}</span>
                            </div>

                            {/* Mode Toggle: Period vs Single Bell */}
                            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, isSingleBell: false })}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                  !formData.isSingleBell
                                    ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                Period (Start & End)
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData({
                                    ...formData,
                                    isSingleBell: true,
                                    endTime: formData.startTime || '08:30',
                                    ringAtStart: true,
                                    ringAtEnd: false,
                                  })
                                }
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                  formData.isSingleBell
                                    ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                Single Bell Strike Time
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                                {formData.isSingleBell ? 'Bell Event Name' : 'Period Name'}
                              </label>
                              <input
                                type="text"
                                value={formData.name || ''}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium"
                              />
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                  {formData.isSingleBell ? 'Bell Strike Time' : 'Start Time'}
                                </label>
                                <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                                  {formatDisplayTime(formData.startTime || '09:00', timeFormat)}
                                </span>
                              </div>
                              <input
                                type="time"
                                value={formData.startTime || '09:00'}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    startTime: e.target.value,
                                    endTime: formData.isSingleBell ? e.target.value : formData.endTime,
                                  })
                                }
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium font-mono"
                              />
                              {/* Quick Start Steppers */}
                              <div className="flex items-center gap-1 mt-1.5">
                                {[-15, -5, +5, +15].map((d) => (
                                  <button
                                    key={d}
                                    type="button"
                                    onClick={() => {
                                      const next = adjustTimeByMinutes(formData.startTime || '09:00', d);
                                      setFormData({
                                        ...formData,
                                        startTime: next,
                                        endTime: formData.isSingleBell ? next : formData.endTime,
                                      });
                                    }}
                                    className="flex-1 py-1 px-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-900 hover:bg-amber-100 dark:hover:bg-amber-950 text-slate-600 dark:text-slate-300 cursor-pointer text-center"
                                  >
                                    {d > 0 ? `+${d}m` : `${d}m`}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {!formData.isSingleBell ? (
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                    End Time
                                  </label>
                                  <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                                    {formatDisplayTime(formData.endTime || '09:45', timeFormat)}
                                  </span>
                                </div>
                                <input
                                  type="time"
                                  value={formData.endTime || '09:45'}
                                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium font-mono"
                                />
                                {/* Quick End Steppers */}
                                <div className="flex items-center gap-1 mt-1.5">
                                  {[-15, -5, +5, +15].map((d) => (
                                    <button
                                      key={d}
                                      type="button"
                                      onClick={() => {
                                        const next = adjustTimeByMinutes(formData.endTime || '09:45', d);
                                        setFormData({ ...formData, endTime: next });
                                      }}
                                      className="flex-1 py-1 px-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-900 hover:bg-amber-100 dark:hover:bg-amber-950 text-slate-600 dark:text-slate-300 cursor-pointer text-center"
                                    >
                                      {d > 0 ? `+${d}m` : `${d}m`}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col justify-center p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300">
                                <span className="font-bold flex items-center gap-1">
                                  <Bell className="w-3.5 h-3.5" /> Single Strike Event
                                </span>
                                <span className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                                  This bell will ring once exactly at {formatDisplayTime(formData.startTime || '08:30', timeFormat)}.
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Quick Preset Buttons for Bell Times */}
                          <div>
                            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                              Quick Time Presets:
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {['08:00', '08:30', '09:00', '09:45', '10:30', '11:15', '12:00', '12:30', '13:00', '14:00', '15:00', '15:30'].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => {
                                    const nextEnd = formData.isSingleBell
                                      ? preset
                                      : adjustTimeByMinutes(preset, 45);
                                    setFormData({
                                      ...formData,
                                      startTime: preset,
                                      endTime: nextEnd,
                                    });
                                  }}
                                  className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-100 dark:bg-slate-900 hover:bg-amber-100 dark:hover:bg-amber-950 text-slate-700 dark:text-slate-300 cursor-pointer"
                                >
                                  {preset}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                                Bell Classification
                              </label>
                              <select
                                value={formData.bellType || 'school_bell'}
                                onChange={(e) => setFormData({ ...formData, bellType: e.target.value as BellType })}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium"
                              >
                                <option value="school_bell">School Bell (Standard)</option>
                                <option value="opening">Opening Bell</option>
                                <option value="assembly">Assembly Bell</option>
                                <option value="period_start">Period Start</option>
                                <option value="period_end">Period End</option>
                                <option value="break">Break / Recess</option>
                                <option value="lunch">Lunch Bell</option>
                                <option value="warning">Warning Bell</option>
                                <option value="closing">School Closing</option>
                                <option value="special">Special Event</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                                Bell Sound
                              </label>
                              <select
                                value={formData.startSoundId || 'classic'}
                                onChange={(e) => setFormData({ ...formData, startSoundId: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium"
                              >
                                {sounds.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                                Ring Strike Count
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="5"
                                value={formData.ringCount || 2}
                                onChange={(e) =>
                                  setFormData({ ...formData, ringCount: parseInt(e.target.value, 10) || 1 })
                                }
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium"
                              />
                            </div>
                          </div>

                          {/* Trigger Options */}
                          <div className="pt-2 flex flex-wrap gap-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.ringAtStart ?? true}
                                onChange={(e) => setFormData({ ...formData, ringAtStart: e.target.checked })}
                                className="rounded accent-amber-500"
                              />
                              <span>Ring at Period Start</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.ringAtEnd ?? true}
                                onChange={(e) => setFormData({ ...formData, ringAtEnd: e.target.checked })}
                                className="rounded accent-amber-500"
                              />
                              <span>Ring at Period End</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.hasWarningBell ?? false}
                                onChange={(e) => setFormData({ ...formData, hasWarningBell: e.target.checked })}
                                className="rounded accent-amber-500"
                              />
                              <span>Warning Bell Before Period</span>
                            </label>

                            {formData.hasWarningBell && (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min="1"
                                  max="30"
                                  value={formData.warningMinutesBefore || 5}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      warningMinutesBefore: parseInt(e.target.value, 10) || 1,
                                    })
                                  }
                                  className="w-16 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                                />
                                <span>mins before</span>
                              </div>
                            )}
                          </div>

                          {/* Save / Cancel buttons */}
                          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPeriodId(null);
                                setFormData({});
                              }}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveEdit}
                              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-xs"
                            >
                              <Check className="w-4 h-4" />
                              Save Changes
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                }

                const soundObj = sounds.find((s) => s.id === period.startSoundId) || sounds[0];

                return (
                  <tr
                    key={period.id}
                    className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                      !period.enabled ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3.5 text-center font-mono text-xs text-slate-400">
                      {period.periodNumber || index + 1}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{period.name}</span>
                        {period.hasWarningBell && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                            {period.warningMinutesBefore}m warn
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-xs text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {period.isSingleBell ? (
                          <>
                            <span className="font-bold text-amber-700 dark:text-amber-400">
                              {formatDisplayTime(period.startTime, timeFormat)}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold">
                              Single Bell
                            </span>
                          </>
                        ) : (
                          <span>
                            {formatDisplayTime(period.startTime, timeFormat)} –{' '}
                            {formatDisplayTime(period.endTime, timeFormat)}
                          </span>
                        )}

                        <div className="inline-flex items-center gap-0.5 ml-1">
                          <button
                            type="button"
                            onClick={() => handleShiftPeriodTime(period.id, -5)}
                            className="px-1 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950 text-slate-600 dark:text-slate-300 cursor-pointer"
                            title="Shift time back 5 mins"
                          >
                            -5m
                          </button>
                          <button
                            type="button"
                            onClick={() => handleShiftPeriodTime(period.id, +5)}
                            className="px-1 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950 text-slate-600 dark:text-slate-300 cursor-pointer"
                            title="Shift time forward 5 mins"
                          >
                            +5m
                          </button>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                      {period.isSingleBell ? (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">Single Strike</span>
                      ) : (
                        `${duration} mins`
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                        {period.bellType.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1">
                        <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{soundObj?.name || 'Default Bell'}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleToggleEnabled(period.id)}
                        className={`w-8 h-5 rounded-full transition-colors relative cursor-pointer ${
                          period.enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                        title={period.enabled ? 'Click to Disable' : 'Click to Enable'}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                            period.enabled ? 'translate-x-3' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleMove(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-30 rounded"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMove(index, 'down')}
                          disabled={index === periods.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-30 rounded"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(period)}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                          title="Duplicate Period"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleStartEdit(period)}
                          className="p-1 text-slate-400 hover:text-amber-600 rounded"
                          title="Edit Period"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(period.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Delete Period"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
