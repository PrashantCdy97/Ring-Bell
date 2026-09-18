import React, { useState } from 'react';
import { Smartphone, Download, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface Props {
  onOpenModal?: () => void;
  className?: string;
}

export const PWAInstallButton: React.FC<Props> = ({ onOpenModal, className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, show a subtle active badge or button to open details
  if (isInstalled) {
    return (
      <button
        onClick={onOpenModal}
        className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors cursor-pointer ${className}`}
        title="App is installed on this device"
      >
        <Check className="w-3.5 h-3.5" />
        <span>Installed</span>
      </button>
    );
  }

  // If beforeinstallprompt is ready (Android Chrome / Edge / Desktop Chrome)
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-slate-950 font-bold text-xs shadow-xs transition-all cursor-pointer ${className}`}
        title="Install Smart School Bell as an Android / Desktop app"
      >
        <Smartphone className="w-4 h-4" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold transition-colors cursor-pointer ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
              <h3 className="text-base font-bold mb-2">Install on iPhone / iPad</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                1. Tap the <strong>Share</strong> button in Safari's bottom toolbar.
                <br />
                2. Scroll down and tap <strong>"Add to Home Screen"</strong>.
                <br />
                3. Tap <strong>"Add"</strong> in the top-right corner.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-slate-100 dark:bg-slate-800 py-2.5 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Default fallback: opens the Android / APK modal
  return (
    <button
      onClick={onOpenModal}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold transition-colors cursor-pointer ${className}`}
      title="Get Android APK or Install"
    >
      <Smartphone className="w-3.5 h-3.5 text-amber-500" />
      <span>Android APK</span>
    </button>
  );
};
