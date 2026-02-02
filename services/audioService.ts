class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentSpeechSource: AudioBufferSourceNode | null = null;

  constructor() {
    // Do not initialize in constructor to avoid "AudioContext was not allowed to start" warning.
  }

  private initCtx() {
    if (!this.ctx) {
        try {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.5;
            this.masterGain.connect(this.ctx.destination);
        } catch (e) {
            console.warn('Web Audio API not supported', e);
        }
    }
    
    // Attempt to resume if suspended (standard browser policy requirement)
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(e => console.warn("Could not resume audio context", e));
    }
    
    return this.ctx && this.masterGain;
  }

  /**
   * Explicitly resumes the audio context. 
   * Call this on a user interaction event (click/touch).
   */
  public async resume() {
      if (!this.initCtx()) return;
      if (this.ctx?.state === 'suspended') {
          await this.ctx.resume();
      }
  }

  public playChime() {
    if (!this.initCtx()) return;
    if (!this.ctx || !this.masterGain) return;

    // Pentatonic scale frequencies (C6, D6, E6, G6, A6)
    const frequencies = [1046.50, 1174.66, 1318.51, 1567.98, 1760.00];
    const freq = frequencies[Math.floor(Math.random() * frequencies.length)];
    const detune = (Math.random() - 0.5) * 10;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq + detune;
    
    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 3);

    setTimeout(() => {
      osc.disconnect();
      gain.disconnect();
    }, 3000);
  }

  public playSingingBowl() {
    if (!this.initCtx()) return;
    if (!this.ctx || !this.masterGain) return;

    const fundamental = 220; // A3
    const duration = 8;
    const now = this.ctx.currentTime;

    const harmonics = [1, 1.5, 2.02, 2.98];
    const amplitudes = [0.5, 0.2, 0.1, 0.05];

    harmonics.forEach((h, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.value = fundamental * h;
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(amplitudes[i], now + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + duration);
    });
  }

  /**
   * Stops currently playing speech immediately.
   */
  public stopSpeech() {
      if (this.currentSpeechSource) {
          try {
              this.currentSpeechSource.stop();
          } catch (e) {
              // Ignore if already stopped
          }
          this.currentSpeechSource.disconnect();
          this.currentSpeechSource = null;
      }
  }

  /**
   * Decodes and plays raw PCM data (base64) returned from Gemini TTS.
   * Returns a promise that resolves when the audio finishes playing.
   */
  public async playSpeech(base64PCM: string): Promise<void> {
    if (!this.initCtx()) return;
    if (!this.ctx || !this.masterGain) return;

    // Stop previous speech
    this.stopSpeech();

    try {
        const pcmBytes = this.base64ToUint8Array(base64PCM);
        const audioBuffer = await this.pcmToAudioBuffer(pcmBytes, 24000);

        const source = this.ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.masterGain);
        
        // Return promise that resolves on end
        return new Promise((resolve) => {
            source.onended = () => {
                if (this.currentSpeechSource === source) {
                    this.currentSpeechSource = null;
                }
                resolve();
            };
            source.start();
            this.currentSpeechSource = source;
        });

    } catch (e) {
        console.error("Error playing speech:", e);
        return Promise.resolve(); // Resolve anyway on error to reset state
    }
  }

  private base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private async pcmToAudioBuffer(data: Uint8Array, sampleRate: number): Promise<AudioBuffer> {
    if (!this.ctx) throw new Error("No AudioContext");
    const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
    const frameCount = dataInt16.length;
    const buffer = this.ctx.createBuffer(1, frameCount, sampleRate);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  }
}

export const audioService = new AudioService();