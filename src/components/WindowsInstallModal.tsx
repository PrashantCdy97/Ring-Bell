import React, { useState, useEffect } from 'react';
import {
  X,
  Monitor,
  Download,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  Volume2,
  Clock,
  Play,
  Zap,
  Power,
  Sliders,
  Keyboard,
  ChevronRight,
  ExternalLink,
  Laptop,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  downloadWindowsBatchLauncher,
  downloadWindowsUrlShortcut,
  downloadWindowsAutoBootScript,
  getAppUrl,
} from '../services/windowsLauncher';
import { wakeLockService } from '../services/wakeLock';
import { audioEngine } from '../services/audioEngine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onQuickManualRing?: () => void;
}

export const WindowsInstallModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onQuickManualRing,
}) => {
  const { isInstallable, isInstalled, isWindows, isEdge, isChrome, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'pwa' | 'scripts' | 'audio' | 'shortcuts'>('pwa');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedStartup, setCopiedStartup] = useState(false);
  const [isWakeLockActive, setIsWakeLockActive] = useState(wakeLockService.isActive());
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.9);

  useEffect(() => {
    setIsWakeLockActive(wakeLockService.isActive());
  }, [isOpen]);

  if (!isOpen) return null;

  const appUrl = getAppUrl();

  const handleCopyUrl = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(appUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const handleCopyStartupCommand = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText('shell:startup');
      setCopiedStartup(true);
      setTimeout(() => setCopiedStartup(false), 2000);
    }
  };

  const handleInstallPWA = async () => {
    if (isInstallable) {
      await install();
    } else {
      alert(
        'To install directly in Windows:\n' +
          '• In Microsoft Edge: Click the "App available" icon in the address bar (or click ... > Apps > "Install this site as an app")\n' +
          '• In Google Chrome: Click the Install icon in the address bar (or click ⋮ > Save and Share > "Install TR School Bell...")'
      );
    }
  };

  const handleToggleWakeLock = async () => {
    if (wakeLockService.isActive()) {
      await wakeLockService.release();
      setIsWakeLockActive(false);
    } else {
      const ok = await wakeLockService.acquire();
      setIsWakeLockActive(ok);
    }
  };

  const handleTestSpeaker = async () => {
    setIsTestingAudio(true);
    try {
      await audioEngine.playBellSequence({
        soundType: 'temple',
        durationSeconds: 3,
        ringCount: 1,
        volume: audioVolume,
      });
    } finally {
      setIsTestingAudio(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-50/60 via-amber-50/30 to-transparent dark:from-blue-950/40 dark:via-amber-950/20">
          <div className="flex items-center gap-3.5">
            {/* Windows Logo Icon Badge */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-sky-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Windows PC & Laptop Setup
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 uppercase tracking-wider">
                  Windows 10 / 11
                </span>
                {isWindows && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>Windows Detected</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Run as a native desktop app, configure auto-start on computer boot, or download desktop shortcuts.
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/40 p-1.5 gap-1 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('pwa')}
            className={`py-2.5 px-3.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'pwa'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>1. Native Desktop App</span>
          </button>

          <button
            onClick={() => setActiveTab('scripts')}
            className={`py-2.5 px-3.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'scripts'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>2. Desktop Launcher & Auto-Boot</span>
          </button>

          <button
            onClick={() => setActiveTab('audio')}
            className={`py-2.5 px-3.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'audio'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>3. Windows Audio & Power</span>
          </button>

          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`py-2.5 px-3.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'shortcuts'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>4. Keyboard Shortcuts</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 dark:text-slate-300">
          {/* TAB 1: Native Windows PWA */}
          {activeTab === 'pwa' && (
            <div className="space-y-6">
              {/* Primary Call to Action */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-sky-500/5 to-transparent border border-blue-500/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 dark:text-white text-base">
                        Install as Dedicated Windows Application
                      </span>
                      {isInstalled && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          Installed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-lg leading-relaxed">
                      Installs with its own Windows taskbar icon, Start Menu entry, and borderless app window. Operates 100% offline without needing an active internet connection.
                    </p>
                  </div>

                  <button
                    onClick={handleInstallPWA}
                    className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all shrink-0 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isInstalled ? 'Already Installed' : 'Install on Windows Now'}</span>
                  </button>
                </div>
              </div>

              {/* Edge vs Chrome Instructions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Microsoft Edge (Default on Windows 10 & 11) */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white mb-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-500 text-white text-xs flex items-center justify-center font-bold">
                      E
                    </span>
                    <span>In Microsoft Edge (Recommended)</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    Microsoft Edge is pre-installed on every Windows 10 & 11 computer and gives the best desktop integration.
                  </p>
                  <ol className="text-xs space-y-2 text-slate-600 dark:text-slate-300 list-decimal list-inside font-medium">
                    <li>
                      Look at the right side of the address bar for the{' '}
                      <strong className="text-blue-600 dark:text-blue-400 font-bold">App Available</strong> icon.
                    </li>
                    <li>
                      Or click Menu (<span className="font-bold">...</span>) &gt;{' '}
                      <span className="font-bold">Apps</span> &gt;{' '}
                      <strong className="text-slate-900 dark:text-white font-bold">"Install this site as an app"</strong>.
                    </li>
                    <li>
                      Check <span className="font-bold">"Pin to Taskbar"</span>,{' '}
                      <span className="font-bold">"Pin to Start"</span>, and{' '}
                      <strong className="text-amber-600 dark:text-amber-400 font-bold">"Auto-start on device login"</strong>.
                    </li>
                  </ol>
                </div>

                {/* Google Chrome */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white mb-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 text-xs flex items-center justify-center font-bold">
                      C
                    </span>
                    <span>In Google Chrome</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    If you use Google Chrome on your Windows computer:
                  </p>
                  <ol className="text-xs space-y-2 text-slate-600 dark:text-slate-300 list-decimal list-inside font-medium">
                    <li>
                      Click the <strong className="text-slate-900 dark:text-white font-bold">Install</strong> icon in the address bar (computer monitor with down arrow).
                    </li>
                    <li>
                      Or click Menu (<span className="font-bold">⋮</span>) &gt;{' '}
                      <span className="font-bold">Save and share</span> &gt;{' '}
                      <strong className="text-slate-900 dark:text-white font-bold">"Install TR Memorial School Bell..."</strong>.
                    </li>
                    <li>
                      Click <span className="font-bold">Install</span> to launch in a standalone desktop window.
                    </li>
                  </ol>
                </div>
              </div>

              {/* Windows App Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      100% Offline Safe
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Rings on schedule even during internet outages or cable cuts.
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Taskbar & Start Menu
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Quick 1-click launch from the Windows Taskbar just like MS Word or Excel.
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Zero Distractions
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      No browser tabs, no search bar, and no accidental URL navigation.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Windows Desktop Launchers & Auto-Boot Scripts */}
          {activeTab === 'scripts' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
                <span className="font-black block mb-1">
                  Ready-to-Use Windows Desktop Scripts
                </span>
                Download these lightweight helper files to create instant desktop shortcuts and enable automatic startup whenever the school computer turns on.
              </div>

              {/* Download Cards */}
              <div className="space-y-3">
                {/* 1. Desktop Batch Launcher */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-mono font-bold text-xs shrink-0 border border-blue-500/20">
                      .BAT
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900 dark:text-white">
                        Windows App Launcher Script (.bat)
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Launches the bell directly into a clean standalone app window (no browser tabs).
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={downloadWindowsBatchLauncher}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-extrabold text-xs flex items-center justify-center gap-1.5 shrink-0 transition-transform active:scale-95 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .BAT</span>
                  </button>
                </div>

                {/* 2. Desktop Shortcut */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-mono font-bold text-xs shrink-0 border border-amber-500/20">
                      .URL
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900 dark:text-white">
                        Windows Desktop Internet Shortcut (.url)
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Double-click to open TR Memorial School Bell directly from your desktop.
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={downloadWindowsUrlShortcut}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-extrabold text-xs flex items-center justify-center gap-1.5 shrink-0 transition-transform active:scale-95 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .URL</span>
                  </button>
                </div>

                {/* 3. AutoStart on Windows Boot Setup */}
                <div className="p-4 rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-mono font-bold text-xs shrink-0 border border-emerald-500/30">
                      <Power className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Auto-Start on Windows PC Boot</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500 text-white uppercase">
                          Crucial for Schools
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        Whenever the computer is switched on in the morning or recovers from power loss, the bell system launches automatically!
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={downloadWindowsAutoBootScript}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shrink-0 transition-transform active:scale-95 cursor-pointer shadow-md shadow-emerald-600/20"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Auto-Boot Setup</span>
                  </button>
                </div>
              </div>

              {/* Manual Windows Startup Method */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">
                  Manual Windows Startup Configuration:
                </span>
                <p className="text-slate-500 dark:text-slate-400 mb-2">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[11px]">Win + R</kbd>, type <code className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 font-mono text-amber-800 dark:text-amber-300 font-bold">shell:startup</code>, and copy your shortcut into that folder.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyStartupCommand}
                    className="px-3 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedStartup ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedStartup ? 'Copied shell:startup' : 'Copy "shell:startup" command'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Windows Audio & Power */}
          {activeTab === 'audio' && (
            <div className="space-y-6">
              {/* PA Speaker Line Setup Guide */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white mb-1">
                  <Volume2 className="w-4 h-4 text-amber-500" />
                  <span>Connecting Windows PC to School PA Amplifier</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Connect the 3.5mm headphone jack or USB sound card of this Windows computer to the <strong className="text-slate-900 dark:text-white">AUX IN</strong> or <strong className="text-slate-900 dark:text-white">LINE IN</strong> port of your school amplifier / Ahuja public address unit.
                </p>

                {/* Speaker Output Test */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">
                      Test Temple Bell (1 Strike)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Plays acoustic bronze chime through Windows audio output.
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-500">Vol:</span>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={audioVolume}
                        onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                        className="w-20 accent-amber-500"
                        title="Volume"
                      />
                      <span className="text-[11px] font-mono font-bold w-8 text-right">
                        {Math.round(audioVolume * 100)}%
                      </span>
                    </div>

                    <button
                      onClick={handleTestSpeaker}
                      disabled={isTestingAudio}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5 fill-slate-950" />
                      <span>{isTestingAudio ? 'Ringing...' : 'Test Speaker'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Screen Wake Lock / Keep-Awake Toggle */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      isWakeLockActive
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Power className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        Keep Windows Screen Awake (Wake Lock)
                      </span>
                      {isWakeLockActive ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          Off
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-md">
                      Prevents Windows laptops and PCs from going into Sleep or Display Standby mode during school hours so scheduled bells ring without interruption.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleToggleWakeLock}
                  className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isWakeLockActive
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{isWakeLockActive ? 'Awake Active' : 'Enable Keep-Awake'}</span>
                </button>
              </div>

              {/* Windows Power Setting Tip */}
              <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-300">
                <span className="font-bold block mb-1">Recommended Windows Power Setting:</span>
                Open Windows <kbd className="px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900 font-mono text-[10px]">Settings &gt; System &gt; Power &amp; battery</kbd> and set <span className="font-bold">"When plugged in, put my device to sleep after"</span> to <span className="font-black">Never</span>.
              </div>
            </div>
          )}

          {/* TAB 4: Keyboard Shortcuts */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Control the school bell directly using your physical Windows PC keyboard:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">
                      Ring Temple Bell (1 Strike)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Sounds instant chime
                    </span>
                  </div>
                  <kbd className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-xs text-slate-800 dark:text-slate-200 shadow-xs">
                    Space
                  </kbd>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">
                      Fullscreen Display / Kiosk
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Toggles public hall clock
                    </span>
                  </div>
                  <kbd className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-xs text-slate-800 dark:text-slate-200 shadow-xs">
                    F11
                  </kbd>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">
                      Manual Timing Hub
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Delay, schedule, or ring presets
                    </span>
                  </div>
                  <kbd className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-xs text-slate-800 dark:text-slate-200 shadow-xs">
                    M
                  </kbd>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">
                      Close Window / Dialog
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Dismisses current modal
                    </span>
                  </div>
                  <kbd className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-xs text-slate-800 dark:text-slate-200 shadow-xs">
                    Esc
                  </kbd>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  <strong>Tip for Teachers:</strong> In the school administrative office, pressing <kbd className="font-mono font-bold">Space</kbd> triggers an instant 1-strike bell without having to look for the mouse!
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span className="font-mono text-[11px] truncate max-w-[280px]">
              {appUrl}
            </span>
            <button
              onClick={handleCopyUrl}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Copy URL"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleInstallPWA}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>{isInstalled ? 'App Ready' : 'Install on Windows'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
