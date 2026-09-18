import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Volume2, Square } from 'lucide-react';
import { ActiveRingingState } from '../types';

interface Props {
  activeRinging: ActiveRingingState | null;
  onStopBell: () => void;
}

export const BellRingingOverlay: React.FC<Props> = ({ activeRinging, onStopBell }) => {
  if (!activeRinging || !activeRinging.isRinging) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="relative max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 text-center border-2 border-amber-500/50 overflow-hidden"
        >
          {/* Animated sound wave background rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              animate={{
                scale: [1, 1.8, 2.5],
                opacity: [0.6, 0.3, 0],
              }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                ease: 'easeOut',
              }}
              className="w-36 h-36 rounded-full border-4 border-amber-400 dark:border-amber-500"
            />
            <motion.div
              animate={{
                scale: [1, 2.2, 3.2],
                opacity: [0.5, 0.2, 0],
              }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                delay: 0.4,
                ease: 'easeOut',
              }}
              className="w-36 h-36 rounded-full border-2 border-amber-300 dark:border-amber-600"
            />
          </div>

          {/* Swinging Bell Graphic */}
          <div className="relative z-10 flex justify-center mb-6">
            <motion.div
              animate={{
                rotate: [-24, 24, -20, 20, -12, 12, 0],
              }}
              transition={{
                duration: 0.9,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/40"
            >
              <Bell className="w-12 h-12 fill-white" />
            </motion.div>
          </div>

          {/* Text Information */}
          <div className="relative z-10 space-y-2 mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 text-xs font-semibold uppercase tracking-wider">
              <Volume2 className="w-3.5 h-3.5 animate-pulse" />
              Bell Ringing Now
            </div>

            <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {activeRinging.eventName}
            </h3>

            <p className="text-sm text-slate-600 dark:text-slate-300">
              {activeRinging.ringCount > 1
                ? `Ring strike ${activeRinging.currentRingIndex} of ${activeRinging.ringCount}`
                : 'Broadcasting bell audio to school speaker system...'}
            </p>
          </div>

          {/* Stop Button */}
          <div className="relative z-10">
            <button
              onClick={onStopBell}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Square className="w-4 h-4 fill-white" />
              Stop Bell Immediately
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
