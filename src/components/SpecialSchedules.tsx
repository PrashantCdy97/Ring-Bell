import React, { useState } from 'react';
import { Plus, Calendar, Clock, Trash2, Edit2, Check, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { BellSound, Period, SpecialSchedule } from '../types';
import { formatDisplayTime, timeToMinutes } from '../services/scheduler';

interface Props {
  specialSchedules: SpecialSchedule[];
  sounds: BellSound[];
  timeFormat: '12h' | '24h';
  isAdmin: boolean;
  onSaveSpecialSchedules: (schedules: SpecialSchedule[]) => void;
  onRequestAdmin: () => void;
  onEditPeriods: (scheduleId: string) => void;
}

export const SpecialSchedules: React.FC<Props> = ({
  specialSchedules,
  sounds,
  timeFormat,
  isAdmin,
  onSaveSpecialSchedules,
  onRequestAdmin,
  onEditPeriods,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEndDate, setNewEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [newReason, setNewReason] = useState('');

  const handleToggleActive = (id: string) => {
    if (!isAdmin) {
      onRequestAdmin();
      return;
    }
    const updated = specialSchedules.map((s) =>
      s.id === id ? { ...s, isActive: !s.isActive } : s
    );
    onSaveSpecialSchedules(updated);
  };

  const handleDelete = (id: string) => {
    if (!isAdmin) {
      onRequestAdmin();
      return;
    }
    onSaveSpecialSchedules(specialSchedules.filter((s) => s.id !== id));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      onRequestAdmin();
      return;
    }
    if (!newTitle.trim()) return;

    const newSched: SpecialSchedule = {
      id: 'spec_' + Date.now(),
      name: newTitle.trim(),
      startDate: newStartDate,
      endDate: newEndDate,
      reason: newReason.trim(),
      isActive: true,
      periods: [
        {
          id: 'spec_p1_' + Date.now(),
          periodNumber: 1,
          name: 'Session 1',
          startTime: '10:00',
          endTime: '12:00',
          bellType: 'special',
          ringAtStart: true,
          ringAtEnd: true,
          hasWarningBell: true,
          warningMinutesBefore: 5,
          startSoundId: 'chime',
          ringCount: 2,
          enabled: true,
        },
        {
          id: 'spec_p2_' + Date.now(),
          periodNumber: 2,
          name: 'Session 2',
          startTime: '13:00',
          endTime: '15:00',
          bellType: 'special',
          ringAtStart: true,
          ringAtEnd: true,
          hasWarningBell: true,
          warningMinutesBefore: 5,
          startSoundId: 'chime',
          ringCount: 2,
          enabled: true,
        },
      ],
    };

    onSaveSpecialSchedules([...specialSchedules, newSched]);
    setShowAddModal(false);
    setNewTitle('');
    setNewReason('');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              Special & Temporary Schedules
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Create date-bound timetable overrides for examinations, sports events, half-days, or seasonal hours.
            </p>
          </div>

          <div>
            <button
              onClick={() => {
                if (!isAdmin) {
                  onRequestAdmin();
                } else {
                  setShowAddModal(true);
                }
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Special Schedule
            </button>
          </div>
        </div>
      </div>

      {/* Special Schedules List */}
      <div className="space-y-4">
        {specialSchedules.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 border border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 shadow-xs">
            <Calendar className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <div className="font-semibold">No special schedules configured.</div>
            <p className="text-xs mt-1">Standard weekly timetables are actively used.</p>
          </div>
        ) : (
          specialSchedules.map((schedule) => (
            <div
              key={schedule.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl p-6 border transition-all shadow-xs ${
                schedule.isActive
                  ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">{schedule.name}</h3>
                    {schedule.isActive ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        ACTIVE OVERRIDE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        Inactive
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1 flex items-center gap-2">
                    <span>
                      Date Window: {schedule.startDate} to {schedule.endDate}
                    </span>
                    {schedule.reason && (
                      <>
                        <span>•</span>
                        <span className="font-sans italic">{schedule.reason}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(schedule.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                      schedule.isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {schedule.isActive ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4" />}
                    <span>{schedule.isActive ? 'Active on Dates' : 'Deactivated'}</span>
                  </button>

                  <button
                    onClick={() => onEditPeriods(schedule.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit Periods ({schedule.periods.length})
                  </button>

                  <button
                    onClick={() => handleDelete(schedule.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                    title="Delete Special Schedule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Sample of periods inside */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {schedule.periods.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-xs"
                  >
                    <div className="font-semibold text-slate-900 dark:text-white truncate">{p.name}</div>
                    <div className="text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      {formatDisplayTime(p.startTime, timeFormat)} – {formatDisplayTime(p.endTime, timeFormat)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal to add new special schedule */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
              Create Special Temporary Schedule
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Enter schedule title and effective date range.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Schedule Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Sports Gala Schedule, Final Exam Timetable"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Effective From
                  </label>
                  <input
                    type="date"
                    required
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Effective To
                  </label>
                  <input
                    type="date"
                    required
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason / Description
                </label>
                <input
                  type="text"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="e.g. Special timings during tournament week"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs"
                >
                  Create & Activate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
