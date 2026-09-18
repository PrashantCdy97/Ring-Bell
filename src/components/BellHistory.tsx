import React, { useState } from 'react';
import { History, Search, Download, Trash2, CheckCircle2, AlertCircle, Filter } from 'lucide-react';
import { BellHistoryEntry } from '../types';
import { formatDisplayTime } from '../services/scheduler';

interface Props {
  logs: BellHistoryEntry[];
  timeFormat: '12h' | '24h';
  isAdmin: boolean;
  onClearLogs: () => void;
  onRequestAdmin: () => void;
}

export const BellHistory: React.FC<Props> = ({
  logs,
  timeFormat,
  isAdmin,
  onClearLogs,
  onRequestAdmin,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTrigger, setFilterTrigger] = useState<'all' | 'automatic' | 'manual'>('all');
  const [filterDate, setFilterDate] = useState('');

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.periodName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.soundName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.bellType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTrigger = filterTrigger === 'all' || log.trigger === filterTrigger;
    const matchesDate = !filterDate || log.date === filterDate;

    return matchesSearch && matchesTrigger && matchesDate;
  });

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Date', 'Time', 'Period Name', 'Event Type', 'Sound Name', 'Trigger', 'Status'];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.date,
      l.time,
      `"${l.periodName.replace(/"/g, '""')}"`,
      l.bellType,
      `"${l.soundName.replace(/"/g, '""')}"`,
      l.trigger,
      l.status,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `smart_bell_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClear = () => {
    if (!isAdmin) {
      onRequestAdmin();
      return;
    }
    if (window.confirm('Are you sure you want to clear all bell history audit logs?')) {
      onClearLogs();
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-amber-500" />
              Bell Ringing Audit & Event History
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Complete chronological audit trail of all automatic and manual bell events broadcast to the public address system.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={filteredLogs.length === 0}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export CSV Logs
            </button>

            <button
              onClick={handleClear}
              disabled={logs.length === 0}
              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 disabled:opacity-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Clear All Logs
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search period, sound, type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={filterTrigger}
              onChange={(e) => setFilterTrigger(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            >
              <option value="all">All Triggers (Auto & Manual)</option>
              <option value="automatic">Automatic Only</option>
              <option value="manual">Manual Rings Only</option>
            </select>
          </div>

          <div>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400">
            <History className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <div className="font-semibold">No bell history records found.</div>
            <p className="text-xs mt-1">Logs will appear automatically when bells ring or test strikes are triggered.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Event / Period</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Sound Used</th>
                  <th className="px-4 py-3">Trigger Method</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {log.date} <span className="text-slate-400">•</span> {log.time}
                    </td>

                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {log.periodName}
                    </td>

                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
                        {log.bellType.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {log.soundName}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.trigger === 'automatic'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {log.trigger === 'automatic' ? 'Automatic' : 'Manual Ring'}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                          log.status === 'success'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {log.status === 'success' ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Success
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5" />
                            Failed
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
