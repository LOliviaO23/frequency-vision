import { useRef, useCallback, useState } from "react";

export function useFrequency() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{
    oscLeft: OscillatorNode;
    oscRight: OscillatorNode;
    gainLeft: GainNode;
    gainRight: GainNode;
    panLeft: StereoPannerNode;
    panRight: StereoPannerNode;
    binauralGain: GainNode;
    solfeggioOsc: OscillatorNode;
    solfeggioGain: GainNode;
    masterGain: GainNode;
    lfoOsc: OscillatorNode;
    lfoGain: GainNode;
  } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const THETA_BEAT_HZ = 6;
  const SOLFEGGIO_LEVEL = 0.05;
  const BINAURAL_LEVEL = 0.12;
  const LFO_RATE = 0.15;
  const LFO_DEPTH = 0.25;

  const start = useCallback((frequencyHz: number) => {
    if (nodesRef.current) return;

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const oscLeft = ctx.createOscillator();
    const oscRight = ctx.createOscillator();
    const gainLeft = ctx.createGain();
    const gainRight = ctx.createGain();
    const panLeft = ctx.createStereoPanner();
    const panRight = ctx.createStereoPanner();
    const binauralGain = ctx.createGain();
    const masterGain = ctx.createGain();

    oscLeft.type = "sine";
    oscRight.type = "sine";
    oscLeft.frequency.setValueAtTime(frequencyHz, ctx.currentTime);
    oscRight.frequency.setValueAtTime(frequencyHz + THETA_BEAT_HZ, ctx.currentTime);

    panLeft.pan.setValueAtTime(-1, ctx.currentTime);
    panRight.pan.setValueAtTime(1, ctx.currentTime);

    gainLeft.gain.setValueAtTime(0.0001, ctx.currentTime);
    gainLeft.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 3);
    gainRight.gain.setValueAtTime(0.0001, ctx.currentTime);
    gainRight.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 3);

    binauralGain.gain.setValueAtTime(BINAURAL_LEVEL, ctx.currentTime);

    const lfoOsc = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfoOsc.type = "sine";
    lfoOsc.frequency.setValueAtTime(LFO_RATE, ctx.currentTime);
    lfoGain.gain.setValueAtTime(BINAURAL_LEVEL * LFO_DEPTH, ctx.currentTime);

    lfoOsc.connect(lfoGain);
    lfoGain.connect(binauralGain.gain);

    oscLeft.connect(gainLeft);
    gainLeft.connect(panLeft);
    panLeft.connect(binauralGain);

    oscRight.connect(gainRight);
    gainRight.connect(panRight);
    panRight.connect(binauralGain);

    binauralGain.connect(masterGain);

    const solfeggioOsc = ctx.createOscillator();
    const solfeggioGain = ctx.createGain();
    solfeggioOsc.type = "sine";
    solfeggioOsc.frequency.setValueAtTime(frequencyHz, ctx.currentTime);
    solfeggioGain.gain.setValueAtTime(SOLFEGGIO_LEVEL, ctx.currentTime);

    solfeggioOsc.connect(solfeggioGain);
    solfeggioGain.connect(masterGain);

    masterGain.gain.setValueAtTime(1, ctx.currentTime);
    masterGain.connect(ctx.destination);

    oscLeft.start();
    oscRight.start();
    solfeggioOsc.start();
    lfoOsc.start();

    nodesRef.current = {
      oscLeft, oscRight, gainLeft, gainRight, panLeft, panRight,
      binauralGain, solfeggioOsc, solfeggioGain, masterGain, lfoOsc, lfoGain,
    };
    setIsPlaying(true);
  }, []);

  const stop = useCallback(() => {
    if (nodesRef.current && audioCtxRef.current) {
      const { masterGain, oscLeft, oscRight, solfeggioOsc, lfoOsc } = nodesRef.current;
      const ctx = audioCtxRef.current;

      masterGain.gain.setValueAtTime(Math.max(0.0001, masterGain.gain.value), ctx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.5);

      nodesRef.current = null;
      audioCtxRef.current = null;
      setIsPlaying(false);

      setTimeout(() => {
        try {
          oscLeft.stop();
          oscRight.stop();
          solfeggioOsc.stop();
          lfoOsc.stop();
        } catch {}
        try {
          ctx.close();
        } catch {}
      }, 1600);
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    if (nodesRef.current && audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      const { masterGain } = nodesRef.current;
      masterGain.gain.cancelScheduledValues(ctx.currentTime);
      masterGain.gain.setValueAtTime(Math.max(0.0001, masterGain.gain.value), ctx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(
        Math.max(0.0001, vol),
        ctx.currentTime + 0.1,
      );
    }
  }, []);

  return { start, stop, isPlaying, setVolume };
}
