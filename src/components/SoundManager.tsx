import React, { useState, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Square,
  Upload,
  Trash2,
  Edit2,
  Check,
  AlertTriangle,
  Radio,
  Music,
  CheckCircle,
  FileAudio,
} from 'lucide-react';
import { BellSound, SchoolSettings } from '../types';
import { audioEngine } from '../services/audioEngine';

interface Props {
  sounds: BellSound[];
  settings: SchoolSettings;
  isAdmin: boolean;
  onUpdateSettings: (newSettings: SchoolSettings) => void;
  onSaveCustomSounds: (sounds: BellSound[]) => void;
  onRequestAdmin: () => void;
}

export const SoundManager: React.FC<Props> = ({
  sounds,
  settings,
  isAdmin,
  onUpdateSettings,
  onSaveCustomSounds,
  onRequestAdmin,
}) => {
  const [playingSoundId, setPlayingSoundId] = useState<string | null>(null);
  const [editingSoundId, setEditingSoundId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [speakerTestStatus, setSpeakerTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [speakerTestMsg, setSpeakerTestMsg] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Play preview of a specific sound
  const handlePreviewSound = async (sound: BellSound) => {
    if (playingSoundId === sound.id) {
      audioEngine.stopBell();
      setPlayingSoundId(null);
      return;
    }

    setPlayingSoundId(sound.id);
    const success = await audioEngine.playBellSequence({
      soundType: sound.builtinType || 'classic',
      customDataUrl: sound.audioDataUrl,
      durationSeconds: sound.durationSeconds || settings.defaultRingDuration,
      ringCount: 1,
      volume: (settings.masterVolume / 100) * (settings.bellVolume / 100),
    });

    setPlayingSoundId(null);
  };

  // Test speaker device audio
  const handleTestSpeaker = async () => {
    setSpeakerTestStatus('testing');
    setSpeakerTestMsg('Testing device audio output...');

    try {
      const vol = (settings.masterVolume / 100) * (settings.bellVolume / 100);
      const played = await audioEngine.playBellSequence({
        soundType: 'classic',
        durationSeconds: 1.8,
        ringCount: 1,
        volume: Math.max(0.2, vol),
      });

      if (played) {
        setSpeakerTestStatus('success');
        setSpeakerTestMsg('Speaker Test Successful! Device audio output is active and clear.');
      } else {
        setSpeakerTestStatus('failed');
        setSpeakerTestMsg('Could not play speaker test. Check browser permissions or device mute.');
      }
    } catch (err: any) {
      setSpeakerTestStatus('failed');
      setSpeakerTestMsg(err?.message || 'Speaker test encountered an audio device error.');
    }
  };

  // Custom audio file upload (MP3, WAV, OGG)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) {
      onRequestAdmin();
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('audio') && !file.name.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
      setUploadError('Unsupported format. Please upload an MP3, WAV, or OGG file.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setUploadError('File exceeds 8MB limit. Please upload a smaller bell chime file.');
      return;
    }

    setUploadError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      const newSound: BellSound = {
        id: 'custom_' + Date.now(),
        name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
        type: 'custom',
        audioDataUrl: dataUrl,
        durationSeconds: 4,
        defaultRingCount: 2,
        intervalSeconds: 1,
      };

      const customSounds = sounds.filter((s) => s.type === 'custom');
      onSaveCustomSounds([...customSounds, newSound]);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  // Delete custom sound
  const handleDeleteCustomSound = (id: string) => {
    if (!isAdmin) {
      onRequestAdmin();
      return;
    }
    const customSounds = sounds.filter((s) => s.type === 'custom' && s.id !== id);
    onSaveCustomSounds(customSounds);
  };

  // Rename custom sound
  const handleStartRename = (sound: BellSound) => {
    if (!isAdmin) {
      onRequestAdmin();
      return;
    }
    setEditingSoundId(sound.id);
    setEditingName(sound.name);
  };

  const handleSaveRename = (id: string) => {
    if (!editingName.trim()) return;
    const customSounds = sounds
      .filter((s) => s.type === 'custom')
      .map((s) => (s.id === id ? { ...s, name: editingName.trim() } : s));
    onSaveCustomSounds(customSounds);
    setEditingSoundId(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Music className="w-5 h-5 text-amber-500" />
              Bell Sound System & Speaker Output
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Configure school acoustic chime profiles, master amplification, and test the public address speaker.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestSpeaker}
              disabled={speakerTestStatus === 'testing'}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
              {speakerTestStatus === 'testing' ? 'Testing Output...' : 'Test Speaker'}
            </button>
          </div>
        </div>

        {/* Speaker Test Status Alert */}
        {speakerTestStatus !== 'idle' && (
          <div
            className={`mt-4 p-3 rounded-xl text-sm flex items-center gap-2 border ${
              speakerTestStatus === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : speakerTestStatus === 'failed'
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
            }`}
          >
            {speakerTestStatus === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{speakerTestMsg}</span>
          </div>
        )}
      </div>

      {/* Volume Controls Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Master Volume */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Master Volume
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
              {settings.masterVolume}%
            </span>
          </div>
          <div className="flex items-center gap-3">
            {settings.masterVolume === 0 ? (
              <VolumeX className="w-5 h-5 text-rose-500 shrink-0" />
            ) : (
              <Volume2 className="w-5 h-5 text-amber-500 shrink-0" />
            )}
            <input
              type="range"
              min="0"
              max="100"
              value={settings.masterVolume}
              onChange={(e) => onUpdateSettings({ ...settings, masterVolume: parseInt(e.target.value, 10) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>
          {settings.masterVolume <= 10 && (
            <div className="mt-2 text-[11px] text-rose-500 flex items-center gap-1 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              Volume is muted or very low! Bells may be inaudible.
            </div>
          )}
        </div>

        {/* Bell Ringer Volume */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Bell Ringer Volume
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
              {settings.bellVolume}%
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Radio className="w-5 h-5 text-indigo-500 shrink-0" />
            <input
              type="range"
              min="0"
              max="100"
              value={settings.bellVolume}
              onChange={(e) => onUpdateSettings({ ...settings, bellVolume: parseInt(e.target.value, 10) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Dedicated amplifier gain for scheduled period bells.
          </p>
        </div>

        {/* Notification Sound Volume */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Notification Chime
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
              {settings.notificationVolume}%
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <input
              type="range"
              min="0"
              max="100"
              value={settings.notificationVolume}
              onChange={(e) => onUpdateSettings({ ...settings, notificationVolume: parseInt(e.target.value, 10) })}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Volume for warning chimes & alerts.
          </p>
        </div>
      </div>

      {/* Bell Sound Presets and Custom Sounds */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Available Bell Sounds</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select built-in mechanical simulations or upload school MP3/WAV audio.
            </p>
          </div>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept="audio/*,.mp3,.wav,.ogg,.m4a"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => {
                if (!isAdmin) {
                  onRequestAdmin();
                } else {
                  fileInputRef.current?.click();
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Upload Custom Audio (MP3 / WAV)
            </button>
          </div>
        </div>

        {uploadError && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs rounded-xl flex items-center gap-2 border border-rose-200 dark:border-rose-900">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sounds.map((sound) => {
            const isPlaying = playingSoundId === sound.id;
            const isDefault = settings.defaultSoundId === sound.id;

            return (
              <div
                key={sound.id}
                className={`p-4 rounded-xl border transition-all ${
                  isDefault
                    ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => handlePreviewSound(sound)}
                      className={`p-3 rounded-xl shrink-0 transition-transform active:scale-90 cursor-pointer ${
                        isPlaying
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                      }`}
                      title={isPlaying ? 'Stop Preview' : 'Preview Bell Sound'}
                    >
                      {isPlaying ? <Square className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      {editingSoundId === sound.id ? (
                        <div className="flex items-center gap-1.5 my-1">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          />
                          <button
                            onClick={() => handleSaveRename(sound.id)}
                            className="p-1 text-emerald-600 hover:text-emerald-700"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                            {sound.name}
                          </h4>
                          {isDefault && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                              DEFAULT
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span className="capitalize">{sound.type === 'custom' ? 'Custom Upload' : 'Built-in Synth'}</span>
                        <span>•</span>
                        <span>{sound.durationSeconds}s duration</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for custom sound */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!isDefault && (
                      <button
                        onClick={() => {
                          if (!isAdmin) {
                            onRequestAdmin();
                          } else {
                            onUpdateSettings({ ...settings, defaultSoundId: sound.id });
                          }
                        }}
                        className="px-2 py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded cursor-pointer"
                        title="Set as Default Sound"
                      >
                        Set Default
                      </button>
                    )}

                    {sound.type === 'custom' && (
                      <>
                        <button
                          onClick={() => handleStartRename(sound)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
                          title="Rename Sound"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomSound(sound.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          title="Delete Custom Sound"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Default Timing Rules */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
          Default Ring Cadence & Timing
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
          Define standard strike length and pause intervals across all periods.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Rings per Event (Strikes)
            </label>
            <input
              type="number"
              min="1"
              max="6"
              value={settings.defaultRingCount}
              onChange={(e) =>
                onUpdateSettings({ ...settings, defaultRingCount: parseInt(e.target.value, 10) || 1 })
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Duration per Ring (Seconds)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={settings.defaultRingDuration}
              onChange={(e) =>
                onUpdateSettings({ ...settings, defaultRingDuration: parseInt(e.target.value, 10) || 2 })
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Delay between Rings (Seconds)
            </label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              max="5"
              value={settings.defaultInterval}
              onChange={(e) =>
                onUpdateSettings({ ...settings, defaultInterval: parseFloat(e.target.value) || 1 })
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
