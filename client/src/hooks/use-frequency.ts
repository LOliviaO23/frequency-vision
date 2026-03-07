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
    masterGain: GainNode;
  } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const THETA_BEAT_HZ = 6;

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
    const masterGain = ctx.createGain();

    oscLeft.type = "sine";
    oscRight.type = "sine";
    oscLeft.frequency.setValueAtTime(frequencyHz, ctx.currentTime);
    oscRight.frequency.setValueAtTime(frequencyHz + THETA_BEAT_HZ, ctx.currentTime);

    panLeft.pan.setValueAtTime(-1, ctx.currentTime);
    panRight.pan.setValueAtTime(1, ctx.currentTime);

    gainLeft.gain.setValueAtTime(0, ctx.currentTime);
    gainLeft.gain.linearRampToValueAtTime(1, ctx.currentTime + 3);
    gainRight.gain.setValueAtTime(0, ctx.currentTime);
    gainRight.gain.linearRampToValueAtTime(1, ctx.currentTime + 3);

    masterGain.gain.setValueAtTime(0.12, ctx.currentTime);

    oscLeft.connect(gainLeft);
    gainLeft.connect(panLeft);
    panLeft.connect(masterGain);

    oscRight.connect(gainRight);
    gainRight.connect(panRight);
    panRight.connect(masterGain);

    masterGain.connect(ctx.destination);

    oscLeft.start();
    oscRight.start();

    nodesRef.current = { oscLeft, oscRight, gainLeft, gainRight, panLeft, panRight, masterGain };
    setIsPlaying(true);
  }, []);

  const stop = useCallback(() => {
    if (nodesRef.current && audioCtxRef.current) {
      const { masterGain, oscLeft, oscRight } = nodesRef.current;
      const ctx = audioCtxRef.current;

      masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);

      nodesRef.current = null;
      audioCtxRef.current = null;
      setIsPlaying(false);

      setTimeout(() => {
        try {
          oscLeft.stop();
          oscRight.stop();
        } catch {}
        try {
          ctx.close();
        } catch {}
      }, 1600);
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    if (nodesRef.current && audioCtxRef.current) {
      nodesRef.current.masterGain.gain.linearRampToValueAtTime(
        vol,
        audioCtxRef.current.currentTime + 0.1
      );
    }
  }, []);

  return { start, stop, isPlaying, setVolume };
}
