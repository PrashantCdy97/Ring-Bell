import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Download,
  QrCode,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  Info,
  Shield,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidInstallModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isAndroid, isIOS, install } = usePWAInstall();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'pwa' | 'apk' | 'qr'>('pwa');

  if (!isOpen) return null;

  // Current app URL
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const pwabuilderUrl = `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(
    appUrl || 'https://ais-dev-gp5c35f73ny3fsmsivsbw2-892037270957.asia-east1.run.app'
  )}`;

  const handleCopyUrl = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleInstallPWA = async () => {
    if (isInstallable) {
      await install();
    } else {
      alert(
        'To install directly on Android:\n1. Open this page in Chrome on your Android phone\n2. Tap the ⋮ menu in the top-right\n3. Tap "Install app" or "Add to Home screen"'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center border border-amber-500/30">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Install on Android & APK</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Ready
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Install as a standalone Android app or generate an APK file for distribution.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/40 p-1.5 gap-1.5 text-xs font-bold">
          <button
            onClick={() => setActiveTab('pwa')}
            className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'pwa'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>1. Instant Install (Recommended)</span>
          </button>

          <button
            onClick={() => setActiveTab('apk')}
            className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'apk'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>2. Build .APK File</span>
          </button>

          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'qr'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>3. Scan QR Code</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 dark:text-slate-300">
          {/* TAB 1: INSTANT INSTALL (PWA) */}
          {activeTab === 'pwa' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                  <strong>Fastest & Native Experience:</strong> Installing via the browser gives you an
                  app icon on your home screen and app drawer, full-screen UI without browser bars, offline
                  chime playback, and instant updates without manual APK installs.
                </div>
              </div>

              {isInstalled ? (
                <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <div className="font-bold text-emerald-900 dark:text-emerald-200">
                    Application is Already Installed!
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    You are running Smart School Bell in standalone app mode.
                  </p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <button
                    onClick={handleInstallPWA}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-base shadow-lg shadow-amber-500/25 inline-flex items-center justify-center gap-3 transition-transform cursor-pointer"
                  >
                    <Smartphone className="w-5 h-5" />
                    <span>Install Smart School Bell on Device</span>
                  </button>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Compatible with Android (Chrome, Edge, Samsung Internet), Windows, macOS, and Linux.
                  </p>
                </div>
              )}

              {/* Instructions for Android Chrome */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 text-xs space-y-3">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-amber-500" />
                  <span>How to install on your Android Phone or Tablet:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600 dark:text-slate-300 ml-1">
                  <li>
                    Open this URL in <strong>Google Chrome</strong> on Android.
                  </li>
                  <li>
                    Tap the <strong>three dots (⋮)</strong> menu icon in the upper right.
                  </li>
                  <li>
                    Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                  </li>
                  <li>
                    Tap <strong>"Install"</strong> — the app icon will appear directly on your home screen
                    and launch full-screen!
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: BUILD APK (PWABUILDER / BUBBLEWRAP) */}
          {activeTab === 'apk' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Generate a standalone Android .APK file:</strong>
                  <p className="mt-1">
                    Because this is a secure cloud web container, you can generate a compiled, signed Android
                    APK or Google Play AAB package in 1 click using <strong>PWABuilder</strong> (backed by
                    Microsoft & Google) or <strong>Bubblewrap CLI</strong>.
                  </p>
                </div>
              </div>

              {/* PWABuilder 1-Click Card */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                    <Download className="w-4 h-4 text-amber-500" />
                    <span>Option A: 1-Click APK with PWABuilder</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    Free & Instant
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300">
                  PWABuilder inspects the manifest and assets already configured on this app and generates a
                  ready-to-install Android APK package.
                </p>

                <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">Quick 3-step guide:</div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center text-[11px]">
                      1
                    </span>
                    <span>Click the button below to open PWABuilder with this app's URL.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center text-[11px]">
                      2
                    </span>
                    <span>
                      Click <strong>"Package for Stores"</strong> &rarr; Select <strong>Android</strong>.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center text-[11px]">
                      3
                    </span>
                    <span>
                      Download the generated <strong>.apk</strong> file and install it on any Android device!
                    </span>
                  </div>
                </div>

                <a
                  href={pwabuilderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-transform active:scale-98"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open PWABuilder to Generate Android APK</span>
                </a>
              </div>

              {/* Option B: CLI Bubblewrap */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                  <Layers className="w-4 h-4 text-slate-500" />
                  <span>Option B: Local CLI via Bubblewrap / TWA</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  If you have Node.js and the Android SDK locally on your machine, you can run Google's
                  official CLI:
                </p>
                <div className="bg-slate-900 text-amber-400 font-mono text-[11px] p-3 rounded-xl space-y-1 overflow-x-auto">
                  <div># 1. Install Google Bubblewrap CLI</div>
                  <div>npm i -g @bubblewrap/cli</div>
                  <div className="pt-1"># 2. Initialize Android Project from live manifest</div>
                  <div>bubblewrap init --manifest={appUrl}/manifest.webmanifest</div>
                  <div className="pt-1"># 3. Build signed APK</div>
                  <div>bubblewrap build</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SCAN QR CODE */}
          {activeTab === 'qr' && (
            <div className="space-y-4 text-center">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Scan this QR code with your Android camera or QR scanner to open Smart School Bell immediately
                on your phone:
              </p>

              <div className="inline-block p-4 bg-white rounded-3xl shadow-md border border-slate-200 dark:border-slate-700">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                    appUrl
                  )}`}
                  alt="App QR Code"
                  className="w-52 h-52 mx-auto rounded-xl"
                  loading="lazy"
                />
              </div>

              <div className="max-w-md mx-auto flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                <input
                  type="text"
                  readOnly
                  value={appUrl}
                  className="flex-1 bg-transparent px-2 text-xs font-mono text-slate-700 dark:text-slate-300 outline-hidden truncate"
                />
                <button
                  onClick={handleCopyUrl}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400">
                Once opened on your Android device, tap <strong>"Install app"</strong> in Chrome for a full
                native Android experience!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>PWA & TWA compliant with offline audio cache</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
