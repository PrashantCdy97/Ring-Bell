import React, { useState } from 'react';
import { Calendar, Copy, Check, Clock, AlertCircle } from 'lucide-react';
import { BellSound, DaySchedule, Period } from '../types';
import { formatDisplayTime, timeToMinutes } from '../services/scheduler';

interface Props {
  weeklySchedules: DaySchedule[];
  sounds: BellSound[];
  timeFormat: '12h' | '24h';
  isAdmin: boolean;
  onSaveWeeklySchedules: (schedules: DaySchedule[]) => void;
  onRequestAdmin: () => void;
  onEditPeriodsForDay: (dayIndex: number) => void;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const WeeklyScheduleView: React.FC<Props> = ({
  weeklySchedules,
  sounds,
  timeFormat,
  isAdmin,
  onSaveWeeklySchedules,
  onRequestAdmin,
  onEditPeriodsForDay,
}) => {
  const [selectedDayIdx, setSelectedDayIdx] = useState(1); // Default to Monday
  const [copySourceIdx, setCopySourceIdx] = useState(1);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [selectedTargetDays, setSelectedTargetDays] = useState<number[]>([2, 3, 4]); // Tue, Wed, Thu
  const [copySuccessMsg, setCopySuccessMsg] = useState('');

  const activeDay = weeklySchedules.find((s) => s.dayOfWeek === selectedDayIdx) || weeklySchedules[0];

  const handleToggleHoliday = (dayIdx: number) => {
    if (!isAdmin) {
      onRequestAdmin();
      return;
    }
    const updated = weeklySchedules.map((s) =>
      s.dayOfWeek === dayIdx ? { ...s, isHolidayOrOff: !s.isHolidayOrOff } : s
    );
    onSaveWeeklySchedules(updated);
  };

  const handleUpdateDayName = (dayIdx: number, newName: string) => {
    if (!isAdmin) {
      onRequestAdmin();
      return;
    }
    const updated = weeklySchedules.map((s) =>
      s.dayOfWeek === dayIdx ? { ...s, name: newName } : s
    );
    onSaveWeeklySchedules(updated);
  };

  const handleExecuteCopy = () => {
    if (!isAdmin) {
      onRequestAdmin();
      return;
    }

    const source = weeklySchedules.find((s) => s.dayOfWeek === copySourceIdx);
    if (!source) return;

    const updated = weeklySchedules.map((s) => {
      if (selectedTargetDays.includes(s.dayOfWeek) && s.dayOfWeek !== copySourceIdx) {
        return {
          ...s,
          isHolidayOrOff: source.isHolidayOrOff,
          periods: JSON.parse(JSON.stringify(source.periods)),
        };
      }
      return s;
    });

    onSaveWeeklySchedules(updated);
    setShowCopyModal(false);
    setCopySuccessMsg(`Copied ${DAY_NAMES[copySourceIdx]}'s timetable to ${selectedTargetDays.map((d) => DAY_NAMES[d]).join(', ')}!`);
    setTimeout(() => setCopySuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              Weekly Schedule Architecture
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Customize daily school hours across Sunday through Saturday or replicate Monday to other weekdays.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!isAdmin) {
                  onRequestAdmin();
                } else {
                  setShowCopyModal(true);
                }
              }}
              className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              Copy Day Schedule to Other Days
            </button>
          </div>
        </div>

        {copySuccessMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{copySuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Day Selector Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
        {DAY_NAMES.map((name, idx) => {
          const sched = weeklySchedules.find((s) => s.dayOfWeek === idx);
          const isSelected = selectedDayIdx === idx;
          const isOff = sched?.isHolidayOrOff;
          const periodCount = sched?.periods.length || 0;

          return (
            <button
              key={idx}
              onClick={() => setSelectedDayIdx(idx)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-amber-500 bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="text-xs uppercase tracking-wider opacity-80">{name.slice(0, 3)}</div>
              <div className="text-sm font-extrabold truncate mt-0.5">{name}</div>
              <div className="text-[11px] opacity-90 mt-1 flex items-center gap-1">
                {isOff ? (
                  <span className="text-rose-600 dark:text-rose-400 font-semibold">Weekly Off</span>
                ) : (
                  <span>{periodCount} Periods</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Day Details Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {DAY_NAMES[selectedDayIdx]} Schedule Configuration
              </h3>
              {activeDay.isHolidayOrOff && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                  Off / Holiday
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Active schedule template applied every {DAY_NAMES[selectedDayIdx]}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleToggleHoliday(selectedDayIdx)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                activeDay.isHolidayOrOff
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
              }`}
            >
              {activeDay.isHolidayOrOff ? 'Set as School Day (Enable)' : 'Set as Off / Holiday (Disable)'}
            </button>

            <button
              onClick={() => onEditPeriodsForDay(selectedDayIdx)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              Open Timetable Editor
            </button>
          </div>
        </div>

        {/* Periods List for this day */}
        {activeDay.isHolidayOrOff ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400">
            <AlertCircle className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <div className="font-semibold">{DAY_NAMES[selectedDayIdx]} is marked as a Weekly Off day.</div>
            <p className="text-xs mt-1">Automatic bells are suppressed on this day.</p>
          </div>
        ) : activeDay.periods.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400">
            <Clock className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <div className="font-semibold">No periods scheduled for {DAY_NAMES[selectedDayIdx]}.</div>
            <p className="text-xs mt-1">Click "Open Timetable Editor" above or copy periods from Monday.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-2.5">
            {activeDay.periods.map((p, idx) => {
              const sound = sounds.find((s) => s.id === p.startSoundId);
              const duration = timeToMinutes(p.endTime) - timeToMinutes(p.startTime);

              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center font-mono text-xs text-slate-400 font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{p.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 capitalize">
                          {p.bellType.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                        <span>
                          {formatDisplayTime(p.startTime, timeFormat)} – {formatDisplayTime(p.endTime, timeFormat)}
                        </span>
                        <span>•</span>
                        <span>{duration}m</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-xs">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      {sound?.name || 'Standard Bell'}
                    </span>
                    <div className="text-[11px] text-slate-400">{p.ringCount} strikes</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Copy Timetable Modal */}
      {showCopyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
              Replicate Timetable to Other Days
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Select the source day to copy and mark the target weekdays you want to overwrite.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Source Timetable
                </label>
                <select
                  value={copySourceIdx}
                  onChange={(e) => setCopySourceIdx(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium"
                >
                  {DAY_NAMES.map((name, idx) => (
                    <option key={idx} value={idx}>
                      {name} Schedule ({weeklySchedules.find((s) => s.dayOfWeek === idx)?.periods.length || 0} periods)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Target Days to Overwrite:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {DAY_NAMES.map((name, idx) => {
                    if (idx === copySourceIdx) return null;
                    const isChecked = selectedTargetDays.includes(idx);
                    return (
                      <label
                        key={idx}
                        className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-medium cursor-pointer transition-colors ${
                          isChecked
                            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                            : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTargetDays([...selectedTargetDays, idx]);
                            } else {
                              setSelectedTargetDays(selectedTargetDays.filter((d) => d !== idx));
                            }
                          }}
                          className="rounded accent-indigo-600"
                        />
                        <span>{name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <button
                type="button"
                onClick={() => setShowCopyModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteCopy}
                disabled={selectedTargetDays.length === 0}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm"
              >
                Apply Copy ({selectedTargetDays.length} Days)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
