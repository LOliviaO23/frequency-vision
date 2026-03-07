import { useCallback, useRef } from "react";

const PITCH_SHIFT_FACTOR = 0.88;
const REVERB_DECAY = 1.5;
const REVERB_MIX = 0.15;
const WARMTH_GAIN = 1.15;
const LOW_SHELF_FREQ = 300;
const LOW_SHELF_GAIN = 4;
const HIGH_SHELF_FREQ = 3000;
const HIGH_SHELF_GAIN = -2;

function createReverbImpulse(ctx: OfflineAudioContext, duration: number, decay: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const impulse = ctx.createBuffer(2, length, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const channelData = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
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
      const outputDuration = originalDuration / PITCH_SHIFT_FACTOR + REVERB_DECAY;
      const outputLength = Math.ceil(outputDuration * originalSampleRate);

      const offlineCtx = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        outputLength,
        originalSampleRate
      );

      const source = offlineCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = PITCH_SHIFT_FACTOR;

      const warmthGain = offlineCtx.createGain();
      warmthGain.gain.value = WARMTH_GAIN;

      const lowShelf = offlineCtx.createBiquadFilter();
      lowShelf.type = "lowshelf";
      lowShelf.frequency.value = LOW_SHELF_FREQ;
      lowShelf.gain.value = LOW_SHELF_GAIN;

      const highShelf = offlineCtx.createBiquadFilter();
      highShelf.type = "highshelf";
      highShelf.frequency.value = HIGH_SHELF_FREQ;
      highShelf.gain.value = HIGH_SHELF_GAIN;

      const dryGain = offlineCtx.createGain();
      dryGain.gain.value = 1 - REVERB_MIX;

      const wetGain = offlineCtx.createGain();
      wetGain.gain.value = REVERB_MIX;

      const convolver = offlineCtx.createConvolver();
      convolver.buffer = createReverbImpulse(offlineCtx, REVERB_DECAY, 3);

      const compressor = offlineCtx.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 12;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.15;

      source.connect(warmthGain);
      warmthGain.connect(lowShelf);
      lowShelf.connect(highShelf);

      highShelf.connect(dryGain);
      highShelf.connect(convolver);
      convolver.connect(wetGain);

      dryGain.connect(compressor);
      wetGain.connect(compressor);
      compressor.connect(offlineCtx.destination);

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
