import React, { useState } from 'react';
import { Lock, Unlock, X, ShieldAlert } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  correctPin: string;
}

export const AdminPinModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, correctPin }) => {
  const [enteredPin, setEnteredPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin === correctPin) {
      setErrorMsg('');
      setEnteredPin('');
      onSuccess();
      onClose();
    } else {
      setErrorMsg('Incorrect Administrator PIN. Default is 1234.');
      setEnteredPin('');
    }
  };

  const handleDigit = (digit: string) => {
    if (enteredPin.length < 6) {
      setEnteredPin((prev) => prev + digit);
      setErrorMsg('');
    }
  };

  const handleBackspace = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Admin Authentication</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Enter the administrator PIN to modify timetables, bell audio, or school configuration.
          (Default: <code className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">1234</code>)
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* PIN Display Dots */}
          <div className="flex justify-center gap-3 my-4">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border-2 transition-all ${
                  enteredPin.length > idx
                    ? 'bg-indigo-600 border-indigo-600 scale-110'
                    : 'border-slate-300 dark:border-slate-700 bg-transparent'
                }`}
              />
            ))}
          </div>

          {errorMsg && (
            <div className="flex items-center gap-1.5 p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs rounded-lg">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2 text-base font-semibold">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
              <button
                type="button"
                key={d}
                onClick={() => handleDigit(d)}
                className="py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 active:scale-95 text-slate-800 dark:text-slate-100 transition-colors"
              >
                {d}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setEnteredPin('')}
              className="py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleDigit('0')}
              className="py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 active:scale-95 text-slate-800 dark:text-slate-100"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              ⌫
            </button>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={enteredPin.length === 0}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              <Unlock className="w-4 h-4" />
              Unlock Admin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
