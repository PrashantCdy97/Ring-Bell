/**
 * High-fidelity Web Audio Engine for Smart School Bell
 * Supports synthesized mechanical and acoustic bells + custom uploaded audio.
 * Works 100% offline without external network dependencies.
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private isCurrentlyRinging = false;
  private activeNodes: { stop: () => void }[] = [];
  private activeAudioElement: HTMLAudioElement | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public isRinging(): boolean {
    return this.isCurrentlyRinging;
  }

  public stopBell() {
    this.isCurrentlyRinging = false;
    for (const node of this.activeNodes) {
      try {
        node.stop();
      } catch {
        // already stopped
      }
    }
    this.activeNodes = [];

    if (this.activeAudioElement) {
      try {
        this.activeAudioElement.pause();
        this.activeAudioElement.currentTime = 0;
      } catch {
        // ignore
      }
      this.activeAudioElement = null;
    }
  }

  /**
   * Rings a specified bell sound with ring count, duration, and delay intervals
   */
  public async playBellSequence({
    soundType = 'classic',
    customDataUrl,
    durationSeconds = 3,
    ringCount = 1,
    intervalSeconds = 1,
    volume = 0.8,
    onRingStart,
  }: {
    soundType?: string;
    customDataUrl?: string;
    durationSeconds?: number;
    ringCount?: number;
    intervalSeconds?: number;
    volume?: number;
    onRingStart?: (currentRing: number, totalRings: number) => void;
  }): Promise<boolean> {
    this.stopBell();
    this.isCurrentlyRinging = true;

    try {
      for (let ringIndex = 1; ringIndex <= ringCount; ringIndex++) {
        if (!this.isCurrentlyRinging) break;

        if (onRingStart) {
          onRingStart(ringIndex, ringCount);
        }

        if (customDataUrl) {
          await this.playCustomAudio(customDataUrl, volume, durationSeconds);
        } else {
          await this.playSynthesizedSound(soundType, volume, durationSeconds);
        }

        // Wait interval if there are more rings left
        if (ringIndex < ringCount && this.isCurrentlyRinging) {
          await new Promise((resolve) => setTimeout(resolve, intervalSeconds * 1000));
        }
      }
      return true;
    } catch (err) {
      console.error('Error playing bell:', err);
      return false;
    } finally {
      this.isCurrentlyRinging = false;
    }
  }

  /**
   * Play custom uploaded audio file (base64 or data URL)
   */
  private playCustomAudio(dataUrl: string, volume: number, maxDuration: number): Promise<void> {
    return new Promise((resolve) => {
      if (!this.isCurrentlyRinging) {
        resolve();
        return;
      }

      const audio = new Audio(dataUrl);
      audio.volume = Math.max(0, Math.min(1, volume));
      this.activeAudioElement = audio;

      let timer: number | null = null;
      if (maxDuration > 0) {
        timer = window.setTimeout(() => {
          try {
            audio.pause();
          } catch {
            // ignore
          }
          resolve();
        }, maxDuration * 1000);
      }

      audio.onended = () => {
        if (timer) clearTimeout(timer);
        resolve();
      };

      audio.onerror = () => {
        if (timer) clearTimeout(timer);
        resolve();
      };

      audio.play().catch((e) => {
        console.warn('Audio play failed:', e);
        if (timer) clearTimeout(timer);
        resolve();
      });
    });
  }

  /**
   * Synthesize bell sound using Web Audio API
   */
  private async playSynthesizedSound(type: string, volume: number, duration: number): Promise<void> {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const safeVol = Math.max(0.01, Math.min(1, volume));

    switch (type) {
      case 'temple':
      case 'temple_bell':
        await this.synthTempleBell(ctx, safeVol, duration);
        break;

      case 'chime':
      case 'westminster':
        await this.synthWestminsterChimes(ctx, safeVol, duration);
        break;

      case 'brass_hand':
        await this.synthBrassHandBell(ctx, safeVol, duration);
        break;

      case 'digital_buzzer':
        await this.synthDigitalBuzzer(ctx, safeVol, duration);
        break;

      case 'gentle_gong':
        await this.synthGentleGong(ctx, safeVol, duration);
        break;

      case 'emergency_siren':
        await this.synthEmergencySiren(ctx, safeVol, duration);
        break;

      case 'classic':
      default:
        await this.synthClassicElectricBell(ctx, safeVol, duration);
        break;
    }
  }

  /**
   * Classic Electric School Bell:
   * Rapid clapper striking metallic bell (approx 16-20 strikes per second)
   * with sustained metallic resonance.
   */
  private synthClassicElectricBell(ctx: AudioContext, masterVol: number, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const now = ctx.currentTime;
      const strikeRate = 18; // 18 strikes per second
      const totalStrikes = Math.floor(duration * strikeRate);

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(masterVol * 0.7, now);
      masterGain.gain.setValueAtTime(masterVol * 0.7, now + duration - 0.1);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration + 0.6);
      masterGain.connect(ctx.destination);

      // Core resonant partials of a heavy metal bell
      const bellPartials = [1120, 1980, 2840, 4150];

      // Bell body resonance (stays ringing throughout)
      const resonanceGains: GainNode[] = [];
      const oscillators: OscillatorNode[] = [];

      bellPartials.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        // Clapper strike modulation
        const strikeMod = ctx.createGain();
        gain.gain.setValueAtTime(0.15 / (idx + 1), now);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + duration + 0.6);

        oscillators.push(osc);
        resonanceGains.push(gain);
      });

      // Rapid mechanical clapper impacts
      for (let i = 0; i < totalStrikes; i++) {
        const strikeTime = now + i / strikeRate;
        const clickOsc = ctx.createOscillator();
        const clickGain = ctx.createGain();
        clickOsc.type = 'square';
        clickOsc.frequency.setValueAtTime(800 + Math.random() * 300, strikeTime);

        clickGain.gain.setValueAtTime(0.25, strikeTime);
        clickGain.gain.exponentialRampToValueAtTime(0.001, strikeTime + 0.04);

        clickOsc.connect(clickGain);
        clickGain.connect(masterGain);

        clickOsc.start(strikeTime);
        clickOsc.stop(strikeTime + 0.04);
      }

      this.activeNodes.push({
        stop: () => {
          oscillators.forEach((o) => {
            try {
              o.stop();
            } catch {
              // ignore
            }
          });
          masterGain.disconnect();
        },
      });

      setTimeout(() => {
        resolve();
      }, (duration + 0.5) * 1000);
    });
  }

  /**
   * Westminster 4-note melodic chime
   */
  private synthWestminsterChimes(ctx: AudioContext, masterVol: number, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const notes = [
        { freq: 329.63, time: 0.0 }, // E4
        { freq: 261.63, time: 0.6 }, // C4
        { freq: 293.66, time: 1.2 }, // D4
        { freq: 196.0, time: 1.8 }, // G3
      ];

      const noteDuration = Math.min(duration / notes.length, 0.9);
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(masterVol * 0.8, ctx.currentTime);
      masterGain.connect(ctx.destination);

      const oscillators: OscillatorNode[] = [];

      notes.forEach((note, i) => {
        const startTime = ctx.currentTime + i * noteDuration;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, startTime);

        // Rich harmonics
        const harm = ctx.createOscillator();
        const harmGain = ctx.createGain();
        harm.type = 'sine';
        harm.frequency.setValueAtTime(note.freq * 2.76, startTime);

        gain.gain.setValueAtTime(0.6, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration * 1.8);

        harmGain.gain.setValueAtTime(0.2, startTime);
        harmGain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration * 1.2);

        osc.connect(gain);
        gain.connect(masterGain);
        harm.connect(harmGain);
        harmGain.connect(masterGain);

        osc.start(startTime);
        osc.stop(startTime + noteDuration * 1.9);
        harm.start(startTime);
        harm.stop(startTime + noteDuration * 1.3);

        oscillators.push(osc, harm);
      });

      this.activeNodes.push({
        stop: () => {
          oscillators.forEach((o) => {
            try {
              o.stop();
            } catch {
              // ignore
            }
          });
          masterGain.disconnect();
        },
      });

      const totalTime = Math.max(duration, notes.length * noteDuration + 1.2);
      setTimeout(() => {
        resolve();
      }, totalTime * 1000);
    });
  }

  /**
   * Traditional brass hand bell with pure ringing tone and long decay
   */
  private synthBrassHandBell(ctx: AudioContext, masterVol: number, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(masterVol, now);
      masterGain.connect(ctx.destination);

      const partials = [
        { freq: 880, gain: 0.5, decay: duration },
        { freq: 1760, gain: 0.3, decay: duration * 0.7 },
        { freq: 2640, gain: 0.2, decay: duration * 0.5 },
        { freq: 3520, gain: 0.1, decay: duration * 0.3 },
      ];

      const oscs: OscillatorNode[] = [];

      partials.forEach((p) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(p.freq, now);

        gain.gain.setValueAtTime(p.gain, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + p.decay);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + p.decay);
        oscs.push(osc);
      });

      this.activeNodes.push({
        stop: () => {
          oscs.forEach((o) => {
            try {
              o.stop();
            } catch {
              // ignore
            }
          });
          masterGain.disconnect();
        },
      });

      setTimeout(() => {
        resolve();
      }, duration * 1000);
    });
  }

  /**
   * Digital Electronic Buzzer
   */
  private synthDigitalBuzzer(ctx: AudioContext, masterVol: number, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(masterVol * 0.6, now);
      masterGain.connect(ctx.destination);

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();

      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(960, now);
      osc2.frequency.setValueAtTime(1200, now);

      // Modulate pulses
      const pulses = Math.max(2, Math.floor(duration * 2));
      const pulseLen = duration / pulses;
      const gainMod = ctx.createGain();

      for (let i = 0; i < pulses; i++) {
        const t = now + i * pulseLen;
        gainMod.gain.setValueAtTime(1, t);
        gainMod.gain.setValueAtTime(0.05, t + pulseLen * 0.7);
      }

      osc1.connect(gainMod);
      osc2.connect(gainMod);
      gainMod.connect(masterGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration);
      osc2.stop(now + duration);

      this.activeNodes.push({
        stop: () => {
          try {
            osc1.stop();
            osc2.stop();
          } catch {
            // ignore
          }
          masterGain.disconnect();
        },
      });

      setTimeout(() => {
        resolve();
      }, duration * 1000);
    });
  }

  /**
   * Deep Acoustic Gentle Gong
   */
  private synthGentleGong(ctx: AudioContext, masterVol: number, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(masterVol * 0.7, now);
      masterGain.connect(ctx.destination);

      const freqs = [210, 315, 480, 720];
      const oscs: OscillatorNode[] = [];

      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);

        gain.gain.setValueAtTime(0.4 / (i + 1), now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + duration);
        oscs.push(osc);
      });

      this.activeNodes.push({
        stop: () => {
          oscs.forEach((o) => {
            try {
              o.stop();
            } catch {
              // ignore
            }
          });
          masterGain.disconnect();
        },
      });

      setTimeout(() => {
        resolve();
      }, duration * 1000);
    });
  }

  /**
   * Emergency / Siren Chime
   */
  private synthEmergencySiren(ctx: AudioContext, masterVol: number, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(masterVol * 0.8, now);
      masterGain.connect(ctx.destination);

      const osc = ctx.createOscillator();
      osc.type = 'triangle';

      const cycles = Math.max(1, Math.floor(duration * 2));
      const cycleLen = duration / cycles;

      for (let i = 0; i < cycles; i++) {
        const t = now + i * cycleLen;
        osc.frequency.setValueAtTime(650, t);
        osc.frequency.linearRampToValueAtTime(1150, t + cycleLen * 0.5);
        osc.frequency.linearRampToValueAtTime(650, t + cycleLen);
      }

      osc.connect(masterGain);
      osc.start(now);
      osc.stop(now + duration);

      this.activeNodes.push({
        stop: () => {
          try {
            osc.stop();
          } catch {
            // ignore
          }
          masterGain.disconnect();
        },
      });

      setTimeout(() => {
        resolve();
      }, duration * 1000);
    });
  }

  /**
   * Sacred Bronze Temple Bell (Mandir Ghanta)
   * Authentic 1-strike resonant temple bell with metallic clapper strike,
   * natural acoustic beating (flutter) between detuned bronze partials,
   * and long serene harmonic sustain.
   */
  private synthTempleBell(ctx: AudioContext, masterVol: number, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const now = ctx.currentTime;
      const actualDuration = Math.max(duration, 4.5);

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(masterVol * 0.9, now);
      masterGain.connect(ctx.destination);

      const oscillators: OscillatorNode[] = [];

      // 1. Strike transient (crisp clapper impact against bronze rim)
      const strikeOsc = ctx.createOscillator();
      const strikeGain = ctx.createGain();
      strikeOsc.type = 'triangle';
      strikeOsc.frequency.setValueAtTime(1480, now);
      strikeOsc.frequency.exponentialRampToValueAtTime(320, now + 0.08);

      strikeGain.gain.setValueAtTime(0.45, now);
      strikeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      strikeOsc.connect(strikeGain);
      strikeGain.connect(masterGain);
      strikeOsc.start(now);
      strikeOsc.stop(now + 0.1);
      oscillators.push(strikeOsc);

      // High metallic clapper ping
      const pingOsc = ctx.createOscillator();
      const pingGain = ctx.createGain();
      pingOsc.type = 'sine';
      pingOsc.frequency.setValueAtTime(3420, now);
      pingGain.gain.setValueAtTime(0.25, now);
      pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      pingOsc.connect(pingGain);
      pingGain.connect(masterGain);
      pingOsc.start(now);
      pingOsc.stop(now + 0.2);
      oscillators.push(pingOsc);

      // 2. Pure Bronze Partials with natural acoustic beating (sacred 432Hz tuning)
      const partials = [
        { freq: 216, gain: 0.35, decay: actualDuration * 0.95, type: 'sine' as const }, // Deep bell hum
        { freq: 432, gain: 0.70, decay: actualDuration, type: 'sine' as const },       // Sacred fundamental
        { freq: 434.4, gain: 0.60, decay: actualDuration * 0.98, type: 'sine' as const }, // Beating flutter pair
        { freq: 864, gain: 0.45, decay: actualDuration * 0.75, type: 'sine' as const },  // Octave harmonic
        { freq: 1296, gain: 0.28, decay: actualDuration * 0.55, type: 'sine' as const }, // 3rd harmonic
        { freq: 1728, gain: 0.18, decay: actualDuration * 0.40, type: 'sine' as const }, // Shimmer
        { freq: 2592, gain: 0.10, decay: actualDuration * 0.25, type: 'triangle' as const }, // Top resonance
      ];

      partials.forEach((p) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = p.type;
        osc.frequency.setValueAtTime(p.freq, now);

        // Immediate responsive strike attack, then long natural exponential decay
        gain.gain.setValueAtTime(p.gain, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + p.decay);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + p.decay);
        oscillators.push(osc);
      });

      this.activeNodes.push({
        stop: () => {
          oscillators.forEach((o) => {
            try {
              o.stop();
            } catch {
              // ignore
            }
          });
          masterGain.disconnect();
        },
      });

      setTimeout(() => {
        resolve();
      }, actualDuration * 1000);
    });
  }
}

export const audioEngine = new AudioEngine();
