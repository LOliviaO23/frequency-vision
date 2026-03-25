import { createContext, useContext, useRef, useState, useCallback, useEffect } from "react";

const THETA_BEAT_HZ = 6;
const SOLFEGGIO_LEVEL = 0.05;
const BINAURAL_LEVEL = 0.12;
const LFO_RATE = 0.15;
const LFO_DEPTH = 0.25;
const DUCK_LEVEL = 0.3;
const DUCK_IN_RAMP_S = 0.6;
const DUCK_OUT_RAMP_S = 1.2;
const REPEAT_PAUSE_MS = 800;
const REPEAT_LIMIT = 3;
const VOICE_FADE_MS = 300;

interface AudioState {
  isMusicPlaying: boolean;
  isFrequencyPlaying: boolean;
}

interface AudioContextType {
  state: AudioState;
  initContext: () => AudioContext;
  playAffirmation: (url: string) => Promise<void>;
  playAffirmationWithRepeats: (
    source: string | AudioBuffer,
    repeats?: number,
    onRepeat?: (n: number) => void,
  ) => Promise<void>;
  stopVoice: () => void;
  updateBackgroundMusic: (url: string | null) => void;
  startFrequency: (hz: number) => void;
  stopFrequency: () => void;
  setVolume: (type: "music" | "frequency", val: number) => void;
  setMuted: (type: "music" | "frequency", muted: boolean) => void;
  stopAll: () => void;
}

const AudioCtx = createContext<AudioContextType | null>(null);

export function useAudio() {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error("useAudio must be used within AudioProvider");
  return ctx;
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const ctxRef = useRef<AudioContext | null>(null);
  const limiterRef = useRef<DynamicsCompressorNode | null>(null);

  const musicElRef = useRef<HTMLAudioElement | null>(null);
  const musicSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);

  const voiceRef = useRef<HTMLAudioElement | null>(null);
  const voiceSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const voiceGainRef = useRef<GainNode | null>(null);
  const prevVoiceRef = useRef<HTMLAudioElement | null>(null);
  const prevVoiceSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const prevVoiceGainRef = useRef<GainNode | null>(null);
  const voiceBufferSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const freqGainRef = useRef<GainNode | null>(null);
  const leftOscRef = useRef<OscillatorNode | null>(null);
  const rightOscRef = useRef<OscillatorNode | null>(null);
  const solfeggioOscRef = useRef<OscillatorNode | null>(null);
  const solfeggioGainRef = useRef<GainNode | null>(null);
  const lfoOscRef = useRef<OscillatorNode | null>(null);
  const lfoGainRef = useRef<GainNode | null>(null);
  const freqMasterGainRef = useRef<GainNode | null>(null);

  const musicVolumeRef = useRef(1);
  const musicMutedRef = useRef(false);
  const freqVolumeRef = useRef(1);
  const freqMutedRef = useRef(false);

  const [state, setState] = useState<AudioState>({
    isMusicPlaying: false,
    isFrequencyPlaying: false,
  });

  const initContext = useCallback(() => {
    if (!ctxRef.current) {
      const Ctor = window.AudioContext || (window as any).webkitAudioContext;
      ctxRef.current = new Ctor();

      const limiter = ctxRef.current.createDynamicsCompressor();
      limiter.threshold.setValueAtTime(-3, ctxRef.current.currentTime);
      limiter.knee.setValueAtTime(40, ctxRef.current.currentTime);
      limiter.ratio.setValueAtTime(20, ctxRef.current.currentTime);
      limiter.attack.setValueAtTime(0.003, ctxRef.current.currentTime);
      limiter.release.setValueAtTime(0.15, ctxRef.current.currentTime);
      limiter.connect(ctxRef.current.destination);
      limiterRef.current = limiter;
    }
    if (ctxRef.current.state === "suspended") ctxRef.current.resume().catch(() => {});
    return ctxRef.current;
  }, []);

  const playSessionRef = useRef(0);

  const duckBackgrounds = useCallback((isDucking: boolean) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    const ramp = isDucking ? DUCK_IN_RAMP_S : DUCK_OUT_RAMP_S;

    if (musicGainRef.current) {
      const gain = musicGainRef.current;
      const vol = musicMutedRef.current ? 0.0001 : musicVolumeRef.current;
      const target = isDucking ? vol * DUCK_LEVEL : vol;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, target), now + ramp);
    }

    if (freqMasterGainRef.current) {
      const gain = freqMasterGainRef.current;
      const vol = freqMutedRef.current ? 0.0001 : freqVolumeRef.current;
      const target = isDucking ? vol * DUCK_LEVEL : vol;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, target), now + ramp);
    }
  }, []);

  const cleanupVoiceNodes = useCallback((
    el: HTMLAudioElement | null,
    source: MediaElementAudioSourceNode | null,
    gain: GainNode | null,
  ) => {
    if (el) {
      el.pause();
      el.removeAttribute("src");
    }
    try { source?.disconnect(); } catch {}
    try { gain?.disconnect(); } catch {}
  }, []);

  const playAffirmation = useCallback((url: string): Promise<void> => {
    const ctx = initContext();
    const dest = limiterRef.current || ctx.destination;

    return new Promise((resolve) => {
      if (voiceRef.current) {
        const outgoingEl = voiceRef.current;
        const outgoingSource = voiceSourceRef.current;
        const outgoingGain = voiceGainRef.current;
        prevVoiceRef.current = outgoingEl;
        prevVoiceSourceRef.current = outgoingSource;
        prevVoiceGainRef.current = outgoingGain;

        if (outgoingGain && ctx) {
          const now = ctx.currentTime;
          outgoingGain.gain.cancelScheduledValues(now);
          outgoingGain.gain.setValueAtTime(outgoingGain.gain.value, now);
          outgoingGain.gain.linearRampToValueAtTime(0, now + VOICE_FADE_MS / 1000);

          setTimeout(() => {
            cleanupVoiceNodes(outgoingEl, outgoingSource, outgoingGain);
            prevVoiceRef.current = null;
            prevVoiceSourceRef.current = null;
            prevVoiceGainRef.current = null;
          }, VOICE_FADE_MS);
        } else {
          cleanupVoiceNodes(outgoingEl, outgoingSource, outgoingGain);
        }
      }

      duckBackgrounds(true);

      const el = new Audio(url);
      voiceRef.current = el;

      const source = ctx.createMediaElementSource(el);
      const voiceGain = ctx.createGain();
      voiceGain.gain.setValueAtTime(0, ctx.currentTime);
      voiceGain.gain.linearRampToValueAtTime(1, ctx.currentTime + VOICE_FADE_MS / 1000);
      source.connect(voiceGain).connect(dest);
      voiceSourceRef.current = source;
      voiceGainRef.current = voiceGain;

      el.onended = () => {
        duckBackgrounds(false);
        resolve();
      };

      el.play().catch(() => {
        duckBackgrounds(false);
        resolve();
      });
    });
  }, [initContext, duckBackgrounds, cleanupVoiceNodes]);

  /**
   * Fades any GainNode smoothly to avoid pops and clicks.
   */
  const fadeAudio = useCallback(
    (gainNode: GainNode, targetValue: number, durationSeconds: number) => {
      const ctx = ctxRef.current;
      if (!ctx || !gainNode) return;
      gainNode.gain.exponentialRampToValueAtTime(
        Math.max(targetValue, 0.0001),
        ctx.currentTime + durationSeconds,
      );
    },
    [],
  );

  /**
   * Promise-based player using Web Audio BufferSource.
   * Zero decoding latency; supports precise playbackRate control.
   */
  const playAudioBuffer = useCallback(
    (
      ctx: AudioContext,
      buffer: AudioBuffer,
      playbackRate: number,
      dest: AudioNode,
    ): Promise<void> => {
      return new Promise((resolve) => {
        const vGain = ctx.createGain();
        vGain.gain.setValueAtTime(0.0001, ctx.currentTime);
        vGain.gain.exponentialRampToValueAtTime(1, ctx.currentTime + VOICE_FADE_MS / 1000);

        const bufSrc = ctx.createBufferSource();
        bufSrc.buffer = buffer;
        bufSrc.playbackRate.value = playbackRate;
        bufSrc.connect(vGain).connect(dest);
        voiceBufferSourceRef.current = bufSrc;

        const done = () => {
          if (voiceBufferSourceRef.current === bufSrc) {
            voiceBufferSourceRef.current = null;
          }
          try { bufSrc.disconnect(); } catch {}
          try { vGain.disconnect(); } catch {}
          resolve();
        };

        bufSrc.onended = done;
        bufSrc.start(0);
      });
    },
    [],
  );

  const playAffirmationWithRepeats = useCallback(
    (
      source: string | AudioBuffer,
      totalRepeats: number = REPEAT_LIMIT,
      onRepeat?: (n: number) => void,
    ): Promise<void> => {
      const ctx = initContext();
      const dest = limiterRef.current || ctx.destination;
      const sessionId = ++playSessionRef.current;

      return new Promise(async (resolve) => {
        // Stop any in-flight voice from previous affirmation slot
        if (voiceBufferSourceRef.current) {
          try { voiceBufferSourceRef.current.stop(); } catch {}
          voiceBufferSourceRef.current = null;
        }
        if (voiceRef.current) {
          voiceRef.current.pause();
          voiceRef.current.onended = null;
          voiceRef.current.onerror = null;
          (voiceRef.current as any).onpause = null;
          cleanupVoiceNodes(voiceRef.current, voiceSourceRef.current, voiceGainRef.current);
          voiceRef.current = null;
          voiceSourceRef.current = null;
          voiceGainRef.current = null;
        }

        // Duck backgrounds once at the start (600ms exponential ramp to 30%)
        duckBackgrounds(true);

        for (let i = 0; i < totalRepeats; i++) {
          if (playSessionRef.current !== sessionId) break;

          onRepeat?.(i + 1);

          // 3rd repeat: slight pitch shift (internalization effect)
          const playbackRate = i === totalRepeats - 1 ? 1.08 : 1.0;

          if (source instanceof AudioBuffer) {
            // ── BufferSource path: pre-decoded, zero latency, precise rate ──
            if (playSessionRef.current !== sessionId) break;
            await playAudioBuffer(ctx, source, playbackRate, dest);
          } else {
            // ── HTMLAudioElement fallback for URL-only recordings ──
            await new Promise<void>((innerResolve) => {
              if (playSessionRef.current !== sessionId) {
                innerResolve();
                return;
              }

              const el = new Audio(source);
              el.playbackRate = playbackRate;
              voiceRef.current = el;

              const elSource = ctx.createMediaElementSource(el);
              const vGain = ctx.createGain();
              vGain.gain.setValueAtTime(0, ctx.currentTime);
              vGain.gain.linearRampToValueAtTime(1, ctx.currentTime + VOICE_FADE_MS / 1000);
              elSource.connect(vGain).connect(dest);
              voiceSourceRef.current = elSource;
              voiceGainRef.current = vGain;

              const done = () => {
                if (voiceRef.current === el) {
                  voiceRef.current = null;
                  voiceSourceRef.current = null;
                  voiceGainRef.current = null;
                }
                cleanupVoiceNodes(el, elSource, vGain);
                innerResolve();
              };

              el.onended = done;
              el.onerror = done;
              (el as any).onpause = () => {
                if (el.ended) return;
                done();
              };

              el.play().catch(done);
            });
          }

          // 800ms breath pause between repeats (not after last one)
          if (i < totalRepeats - 1 && playSessionRef.current === sessionId) {
            await new Promise((r) => setTimeout(r, REPEAT_PAUSE_MS));
          }
        }

        // Restore backgrounds with 1.2s ramp — only if this session is still active
        if (playSessionRef.current === sessionId) {
          duckBackgrounds(false);
        }

        resolve();
      });
    },
    [initContext, duckBackgrounds, cleanupVoiceNodes, playAudioBuffer],
  );

  const stopVoice = useCallback(() => {
    // Stop BufferSource path (pre-decoded AudioBuffer playback)
    if (voiceBufferSourceRef.current) {
      try { voiceBufferSourceRef.current.stop(); } catch {}
      try { voiceBufferSourceRef.current.disconnect(); } catch {}
      voiceBufferSourceRef.current = null;
    }

    cleanupVoiceNodes(voiceRef.current, voiceSourceRef.current, voiceGainRef.current);
    voiceRef.current = null;
    voiceSourceRef.current = null;
    voiceGainRef.current = null;

    cleanupVoiceNodes(prevVoiceRef.current, prevVoiceSourceRef.current, prevVoiceGainRef.current);
    prevVoiceRef.current = null;
    prevVoiceSourceRef.current = null;
    prevVoiceGainRef.current = null;

    duckBackgrounds(false);
  }, [cleanupVoiceNodes, duckBackgrounds]);

  const updateBackgroundMusic = useCallback((url: string | null) => {
    if (musicElRef.current) {
      musicElRef.current.pause();
      musicElRef.current = null;
    }
    if (musicSourceRef.current) {
      try { musicSourceRef.current.disconnect(); } catch {}
      musicSourceRef.current = null;
    }
    if (musicGainRef.current) {
      try { musicGainRef.current.disconnect(); } catch {}
      musicGainRef.current = null;
    }

    if (!url) {
      setState(s => ({ ...s, isMusicPlaying: false }));
      return;
    }

    const ctx = initContext();
    const el = new Audio(url);
    el.loop = true;
    el.crossOrigin = "anonymous";
    musicElRef.current = el;

    const source = ctx.createMediaElementSource(el);
    const gainNode = ctx.createGain();
    gainNode.gain.value = musicMutedRef.current ? 0 : musicVolumeRef.current;
    source.connect(gainNode);
    gainNode.connect(limiterRef.current || ctx.destination);
    musicSourceRef.current = source;
    musicGainRef.current = gainNode;

    el.play().catch(() => {});
    setState(s => ({ ...s, isMusicPlaying: true }));
  }, [initContext]);

  const stopBinauralBeat = useCallback(() => {
    try { leftOscRef.current?.stop(); } catch {}
    try { rightOscRef.current?.stop(); } catch {}
    leftOscRef.current?.disconnect();
    rightOscRef.current?.disconnect();
    freqGainRef.current?.disconnect();
    leftOscRef.current = null;
    rightOscRef.current = null;
    freqGainRef.current = null;
  }, []);

  const stopSolfeggio = useCallback(() => {
    try { solfeggioOscRef.current?.stop(); } catch {}
    solfeggioOscRef.current?.disconnect();
    solfeggioGainRef.current?.disconnect();
    solfeggioOscRef.current = null;
    solfeggioGainRef.current = null;
  }, []);

  const stopLfo = useCallback(() => {
    try { lfoOscRef.current?.stop(); } catch {}
    lfoOscRef.current?.disconnect();
    lfoGainRef.current?.disconnect();
    lfoOscRef.current = null;
    lfoGainRef.current = null;
  }, []);

  const startFrequency = useCallback((hz: number) => {
    const ctx = initContext();
    const dest = limiterRef.current || ctx.destination;

    if (freqStopTimerRef.current) {
      clearTimeout(freqStopTimerRef.current);
      freqStopTimerRef.current = null;
    }

    if (freqMasterGainRef.current) return;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    masterGain.gain.exponentialRampToValueAtTime(
      freqMutedRef.current ? 0.0001 : Math.max(0.0001, freqVolumeRef.current),
      ctx.currentTime + 3,
    );
    masterGain.connect(dest);
    freqMasterGainRef.current = masterGain;

    const fGain = ctx.createGain();
    fGain.gain.setValueAtTime(BINAURAL_LEVEL, ctx.currentTime);

    const leftOsc = ctx.createOscillator();
    const leftPanner = ctx.createStereoPanner();
    leftOsc.type = "sine";
    leftOsc.frequency.setValueAtTime(hz, ctx.currentTime);
    leftPanner.pan.setValueAtTime(-1, ctx.currentTime);

    const rightOsc = ctx.createOscillator();
    const rightPanner = ctx.createStereoPanner();
    rightOsc.type = "sine";
    rightOsc.frequency.setValueAtTime(hz + THETA_BEAT_HZ, ctx.currentTime);
    rightPanner.pan.setValueAtTime(1, ctx.currentTime);

    leftOsc.connect(leftPanner);
    rightOsc.connect(rightPanner);
    leftPanner.connect(fGain);
    rightPanner.connect(fGain);
    fGain.connect(masterGain);
    leftOsc.start();
    rightOsc.start();

    leftOscRef.current = leftOsc;
    rightOscRef.current = rightOsc;
    freqGainRef.current = fGain;

    const sOsc = ctx.createOscillator();
    const sGain = ctx.createGain();
    sOsc.type = "sine";
    sOsc.frequency.setValueAtTime(hz, ctx.currentTime);
    sGain.gain.setValueAtTime(SOLFEGGIO_LEVEL, ctx.currentTime);
    sOsc.connect(sGain);
    sGain.connect(masterGain);
    sOsc.start();
    solfeggioOscRef.current = sOsc;
    solfeggioGainRef.current = sGain;

    const lOsc = ctx.createOscillator();
    const lGain = ctx.createGain();
    lOsc.type = "sine";
    lOsc.frequency.setValueAtTime(LFO_RATE, ctx.currentTime);
    lGain.gain.setValueAtTime(BINAURAL_LEVEL * LFO_DEPTH, ctx.currentTime);
    lOsc.connect(lGain);
    lGain.connect(fGain.gain);
    lOsc.start();
    lfoOscRef.current = lOsc;
    lfoGainRef.current = lGain;

    setState(s => ({ ...s, isFrequencyPlaying: true }));
  }, [initContext]);

  const freqStopTimerRef = useRef<NodeJS.Timeout | null>(null);

  const stopFrequency = useCallback(() => {
    const ctx = ctxRef.current;
    const masterGain = freqMasterGainRef.current;
    if (!ctx || !masterGain) return;

    masterGain.gain.setValueAtTime(Math.max(0.0001, masterGain.gain.value), ctx.currentTime);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.5);

    const capturedLeft = leftOscRef.current;
    const capturedRight = rightOscRef.current;
    const capturedFreqGain = freqGainRef.current;
    const capturedSolOsc = solfeggioOscRef.current;
    const capturedSolGain = solfeggioGainRef.current;
    const capturedLfoOsc = lfoOscRef.current;
    const capturedLfoGain = lfoGainRef.current;
    const capturedMasterGain = masterGain;

    leftOscRef.current = null;
    rightOscRef.current = null;
    freqGainRef.current = null;
    solfeggioOscRef.current = null;
    solfeggioGainRef.current = null;
    lfoOscRef.current = null;
    lfoGainRef.current = null;
    freqMasterGainRef.current = null;
    setState(s => ({ ...s, isFrequencyPlaying: false }));

    if (freqStopTimerRef.current) clearTimeout(freqStopTimerRef.current);
    freqStopTimerRef.current = setTimeout(() => {
      try { capturedLeft?.stop(); } catch {}
      try { capturedRight?.stop(); } catch {}
      capturedLeft?.disconnect();
      capturedRight?.disconnect();
      capturedFreqGain?.disconnect();
      try { capturedSolOsc?.stop(); } catch {}
      capturedSolOsc?.disconnect();
      capturedSolGain?.disconnect();
      try { capturedLfoOsc?.stop(); } catch {}
      capturedLfoOsc?.disconnect();
      capturedLfoGain?.disconnect();
      capturedMasterGain.disconnect();
      freqStopTimerRef.current = null;
    }, 1600);
  }, []);

  const setVolume = useCallback((type: "music" | "frequency", val: number) => {
    const ctx = ctxRef.current;
    if (type === "music") {
      musicVolumeRef.current = val;
      if (musicGainRef.current && ctx) {
        musicGainRef.current.gain.cancelScheduledValues(ctx.currentTime);
        musicGainRef.current.gain.setValueAtTime(
          Math.max(0.0001, musicGainRef.current.gain.value),
          ctx.currentTime,
        );
        musicGainRef.current.gain.exponentialRampToValueAtTime(
          musicMutedRef.current ? 0.0001 : Math.max(0.0001, val),
          ctx.currentTime + 0.1,
        );
      } else if (musicElRef.current) {
        musicElRef.current.volume = musicMutedRef.current ? 0 : val;
      }
    } else if (type === "frequency") {
      freqVolumeRef.current = val;
      if (freqMasterGainRef.current && ctx) {
        freqMasterGainRef.current.gain.cancelScheduledValues(ctx.currentTime);
        freqMasterGainRef.current.gain.setValueAtTime(
          Math.max(0.0001, freqMasterGainRef.current.gain.value),
          ctx.currentTime,
        );
        freqMasterGainRef.current.gain.exponentialRampToValueAtTime(
          freqMutedRef.current ? 0.0001 : Math.max(0.0001, val),
          ctx.currentTime + 0.1,
        );
      }
    }
  }, []);

  const setMuted = useCallback((type: "music" | "frequency", muted: boolean) => {
    if (type === "music") {
      musicMutedRef.current = muted;
      setVolume("music", musicVolumeRef.current);
    } else {
      freqMutedRef.current = muted;
      setVolume("frequency", freqVolumeRef.current);
    }
  }, [setVolume]);

  const stopAll = useCallback(() => {
    stopVoice();

    if (musicElRef.current) {
      musicElRef.current.pause();
      musicElRef.current = null;
    }
    if (musicSourceRef.current) {
      try { musicSourceRef.current.disconnect(); } catch {}
      musicSourceRef.current = null;
    }
    if (musicGainRef.current) {
      try { musicGainRef.current.disconnect(); } catch {}
      musicGainRef.current = null;
    }

    stopFrequency();

    setState({ isMusicPlaying: false, isFrequencyPlaying: false });
  }, [stopVoice, stopFrequency]);

  useEffect(() => {
    return () => {
      if (freqStopTimerRef.current) clearTimeout(freqStopTimerRef.current);
      try { voiceBufferSourceRef.current?.stop(); } catch {}
      try { voiceBufferSourceRef.current?.disconnect(); } catch {}
      voiceRef.current?.pause();
      try { voiceSourceRef.current?.disconnect(); } catch {}
      try { voiceGainRef.current?.disconnect(); } catch {}
      prevVoiceRef.current?.pause();
      try { prevVoiceSourceRef.current?.disconnect(); } catch {}
      try { prevVoiceGainRef.current?.disconnect(); } catch {}
      musicElRef.current?.pause();
      try { musicSourceRef.current?.disconnect(); } catch {}
      try { musicGainRef.current?.disconnect(); } catch {}
      try { leftOscRef.current?.stop(); } catch {}
      try { rightOscRef.current?.stop(); } catch {}
      try { solfeggioOscRef.current?.stop(); } catch {}
      try { lfoOscRef.current?.stop(); } catch {}
      try { freqMasterGainRef.current?.disconnect(); } catch {}
      if (ctxRef.current) {
        try { ctxRef.current.close(); } catch {}
      }
    };
  }, []);

  return (
    <AudioCtx.Provider
      value={{
        state,
        initContext,
        playAffirmation,
        playAffirmationWithRepeats,
        stopVoice,
        updateBackgroundMusic,
        startFrequency,
        stopFrequency,
        setVolume,
        setMuted,
        stopAll,
      }}
    >
      {children}
    </AudioCtx.Provider>
  );
}
