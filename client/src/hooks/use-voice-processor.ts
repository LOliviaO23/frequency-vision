import { useCallback, useRef } from "react";

const PITCH_SHIFT_FACTOR = 0.88;

const WARMTH_FREQ = 150;
const WARMTH_GAIN_DB = 4;

const CLARITY_FREQ = 3000;
const CLARITY_GAIN_DB = -2;
const CLARITY_Q = 1.4;

const HALL_REVERB_DECAY = 2.5;
const HALL_REVERB_MIX = 0.10;
const HALL_PRE_DELAY_MS = 20;
const HALL_EARLY_REFLECTIONS = [
  { delay: 0.012, gain: 0.7 },
  { delay: 0.019, gain: 0.6 },
  { delay: 0.028, gain: 0.5 },
  { delay: 0.037, gain: 0.45 },
  { delay: 0.048, gain: 0.35 },
  { delay: 0.063, gain: 0.3 },
];

const COMP_THRESHOLD = -24;
const COMP_RATIO = 4;
const COMP_KNEE = 12;
const COMP_ATTACK = 0.003;
const COMP_RELEASE = 0.15;

function createLargeHallImpulse(ctx: OfflineAudioContext, duration: number, decay: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.ceil(sampleRate * duration);
  const impulse = ctx.createBuffer(2, length, sampleRate);
  const preDelaySamples = Math.floor((HALL_PRE_DELAY_MS / 1000) * sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const channelData = impulse.getChannelData(channel);

    for (const ref of HALL_EARLY_REFLECTIONS) {
      const refSample = Math.floor(ref.delay * sampleRate) + preDelaySamples;
      if (refSample < length) {
        const stereoOffset = channel === 0 ? 0 : Math.floor(0.003 * sampleRate);
        const idx = Math.min(refSample + stereoOffset, length - 1);
        channelData[idx] += ref.gain * (0.8 + Math.random() * 0.4);
      }
    }

    const diffusionStart = Math.floor(0.08 * sampleRate) + preDelaySamples;
    for (let i = diffusionStart; i < length; i++) {
      const t = i / length;
      const envelope = Math.pow(1 - t, decay) * Math.exp(-3 * t);
      const noise = Math.random() * 2 - 1;
      const modulation = 1 + 0.02 * Math.sin(2 * Math.PI * 0.5 * (i / sampleRate));
      channelData[i] += noise * envelope * modulation * 0.5;
    }

    if (channel === 1) {
      const decorrelationSamples = Math.floor(0.007 * sampleRate);
      const temp = new Float32Array(length);
      for (let i = 0; i < length; i++) {
        const srcIdx = i - decorrelationSamples;
        temp[i] = srcIdx >= 0 ? channelData[srcIdx] : 0;
      }
      for (let i = 0; i < length; i++) {
        channelData[i] = temp[i];
      }
    }
  }

  return impulse;
}

export function useVoiceProcessor() {
  const processingRef = useRef(false);

  const processVoice = useCallback(async (blob: Blob): Promise<{ blob: Blob; url: string }> => {
    if (processingRef.current) {
      throw new Error("Already processing");
    }
    processingRef.current = true;

    try {
      const arrayBuffer = await blob.arrayBuffer();
      const tempCtx = new AudioContext();
      const audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);
      await tempCtx.close();

      const originalDuration = audioBuffer.duration;
      const originalSampleRate = audioBuffer.sampleRate;
      const outputDuration = originalDuration / PITCH_SHIFT_FACTOR + HALL_REVERB_DECAY;
      const outputLength = Math.ceil(outputDuration * originalSampleRate);

      const offlineCtx = new OfflineAudioContext(
        2,
        outputLength,
        originalSampleRate
      );

      const source = offlineCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = PITCH_SHIFT_FACTOR;

      const subRumbleFilter = offlineCtx.createBiquadFilter();
      subRumbleFilter.type = "highpass";
      subRumbleFilter.frequency.value = 60;
      subRumbleFilter.Q.value = 0.7;

      const warmthFilter = offlineCtx.createBiquadFilter();
      warmthFilter.type = "lowshelf";
      warmthFilter.frequency.value = WARMTH_FREQ;
      warmthFilter.gain.value = WARMTH_GAIN_DB;

      const clarityFilter = offlineCtx.createBiquadFilter();
      clarityFilter.type = "peaking";
      clarityFilter.frequency.value = CLARITY_FREQ;
      clarityFilter.gain.value = CLARITY_GAIN_DB;
      clarityFilter.Q.value = CLARITY_Q;

      const dryGain = offlineCtx.createGain();
      dryGain.gain.value = 1 - HALL_REVERB_MIX;

      const wetGain = offlineCtx.createGain();
      wetGain.gain.value = HALL_REVERB_MIX;

      const convolver = offlineCtx.createConvolver();
      convolver.buffer = createLargeHallImpulse(offlineCtx, HALL_REVERB_DECAY, 2.8);

      const reverbDamping = offlineCtx.createBiquadFilter();
      reverbDamping.type = "lowpass";
      reverbDamping.frequency.value = 8000;
      reverbDamping.Q.value = 0.5;

      const compressor = offlineCtx.createDynamicsCompressor();
      compressor.threshold.value = COMP_THRESHOLD;
      compressor.knee.value = COMP_KNEE;
      compressor.ratio.value = COMP_RATIO;
      compressor.attack.value = COMP_ATTACK;
      compressor.release.value = COMP_RELEASE;

      const outputLimiter = offlineCtx.createDynamicsCompressor();
      outputLimiter.threshold.value = -1;
      outputLimiter.knee.value = 0;
      outputLimiter.ratio.value = 20;
      outputLimiter.attack.value = 0.001;
      outputLimiter.release.value = 0.05;

      source.connect(subRumbleFilter);
      subRumbleFilter.connect(warmthFilter);
      warmthFilter.connect(clarityFilter);

      clarityFilter.connect(dryGain);
      clarityFilter.connect(convolver);
      convolver.connect(reverbDamping);
      reverbDamping.connect(wetGain);

      dryGain.connect(compressor);
      wetGain.connect(compressor);
      compressor.connect(outputLimiter);
      outputLimiter.connect(offlineCtx.destination);

      source.start(0);

      const renderedBuffer = await offlineCtx.startRendering();

      const wavBlob = audioBufferToWav(renderedBuffer);
      const url = URL.createObjectURL(wavBlob);

      return { blob: wavBlob, url };
    } finally {
      processingRef.current = false;
    }
  }, []);

  return { processVoice, isProcessing: processingRef.current };
}

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1;
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataLength = buffer.length * blockAlign;
  const headerLength = 44;
  const totalLength = headerLength + dataLength;

  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, totalLength - 8, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataLength, true);

  const channels: Float32Array[] = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
