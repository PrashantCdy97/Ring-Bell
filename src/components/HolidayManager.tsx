import React, { useState } from 'react';
import { Plus, Calendar, Trash2, Edit2, Check, AlertCircle, ShieldAlert } from 'lucide-react';
import { Holiday } from '../types';
import { checkIsHoliday } from '../services/scheduler';

interface Props {
  holidays: Holiday[];
  isAdmin: boolean;
  onSaveHolidays: (holidays: Holiday[]) => void;
  onRequestAdmin: () => void;
}

export const HolidayManager: React.FC<Props> = ({
  holidays,
  isAdmin,
  onSaveHolidays,
  onRequestAdmin,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Holiday>>({
    type: 'school',
    date: new Date().toISOString().split('T')[0],
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const todayStatus = checkIsHoliday(todayStr, holidays);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      onRequestAdmin();
      return;
    }
    if (!formData.name || !formData.date) return;

    if (editingId) {
      const updated = holidays.map((h) =>
        h.id === editingId ? ({ ...h, ...formData } as Holiday) : h
      );
      onSaveHolidays(updated);
      setEditingId(null);
    } else {
      const newHol: Holiday = {
        id: 'hol_' + Date.now(),
        name: formData.name,
        date: formData.date,
        endDate: formData.endDate || undefined,
        type: (formData.type as any) || 'school',
        notes: formData.notes || '',
      };
      onSaveHolidays([...holidays, newHol]);
      setShowAddForm(false);
    }

    setFormData({ type: 'school', date: todayStr });
  };

  const handleStartEdit = (hol: Holiday) => {
    if (!isAdmin) {
      onRequestAdmin();
      return;
    }
    setEditingId(hol.id);
    setFormData({ ...hol });
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    if (!isAdmin) {
      onRequestAdmin();
      return;
    }
    onSaveHolidays(holidays.filter((h) => h.id !== id));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              School Holiday Calendar & Closures
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Configure vacation periods, public holidays, and emergency closures. Automatic bells are disabled on these dates.
            </p>
          </div>

          <div>
            <button
              onClick={() => {
                if (!isAdmin) {
                  onRequestAdmin();
                } else {
                  setEditingId(null);
                  setFormData({ type: 'school', date: todayStr });
                  setShowAddForm(true);
                }
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Holiday / Closure
            </button>
          </div>
        </div>

        {/* Current Day Status Banner */}
        {todayStatus.isHoliday && (
          <div className="mt-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-sm flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <span className="font-bold">Today: Holiday ({todayStatus.holiday?.name})</span> — Automatic Bell Schedule Disabled.
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Form Modal or Card */}
      {showAddForm && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-amber-300 dark:border-amber-800/60 shadow-md">
          <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4">
            {editingId ? 'Edit Holiday Entry' : 'Add New Holiday / Closure'}
          </h3>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Holiday / Occasion Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. National Day, Winter Vacation, Staff Training"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Classification
                </label>
                <select
                  value={formData.type || 'school'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium"
                >
                  <option value="public">Public Holiday</option>
                  <option value="school">School Holiday</option>
                  <option value="exam">Exam Holiday</option>
                  <option value="vacation">Term Vacation</option>
                  <option value="closure">Special Closure / Emergency</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.date || ''}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  End Date (Optional for multi-day)
                </label>
                <input
                  type="date"
                  value={formData.endDate || ''}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Notes / Official Reason
              </label>
              <input
                type="text"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional explanation notes for teachers & administrators"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingId(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs"
              >
                {editingId ? 'Save Changes' : 'Add Holiday'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Holidays List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {holidays.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400">
            <Calendar className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <div className="font-semibold">No holidays recorded.</div>
            <p className="text-xs mt-1">Automatic bells will ring according to the daily timetable.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {holidays.map((hol) => (
              <div
                key={hol.id}
                className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{hol.name}</h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {hol.type}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    {hol.date}
                    {hol.endDate && ` – ${hol.endDate}`}
                  </div>

                  {hol.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{hol.notes}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleStartEdit(hol)}
                    className="p-1.5 text-slate-400 hover:text-amber-600 rounded"
                    title="Edit Holiday"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(hol.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                    title="Delete Holiday"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
