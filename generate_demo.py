import numpy as np
from scipy.io import wavfile

SAMPLE_RATE = 44100
DURATION = 30
NUM_SAMPLES = SAMPLE_RATE * DURATION

CARRIER_LEFT = 200
CARRIER_RIGHT = 210
SOLFEGGIO_FREQ = 432
SOLFEGGIO_AMP = 0.05
VOICE_FREQ = 440
VOICE_AMP = 0.3
VOICE_INTERVAL = 5
VOICE_PULSE_DURATION = 1.5
DUCK_RATIO = 0.6

t = np.linspace(0, DURATION, NUM_SAMPLES, endpoint=False)

binaural_left = 0.15 * np.sin(2 * np.pi * CARRIER_LEFT * t)
binaural_right = 0.15 * np.sin(2 * np.pi * CARRIER_RIGHT * t)

solfeggio = SOLFEGGIO_AMP * np.sin(2 * np.pi * SOLFEGGIO_FREQ * t)

voice = np.zeros(NUM_SAMPLES)
duck_envelope = np.ones(NUM_SAMPLES)
ramp_samples = int(0.05 * SAMPLE_RATE)

for pulse_start_sec in range(0, DURATION, VOICE_INTERVAL):
    onset = pulse_start_sec + 1.5
    offset = onset + VOICE_PULSE_DURATION
    if offset > DURATION:
        break

    onset_sample = int(onset * SAMPLE_RATE)
    offset_sample = int(offset * SAMPLE_RATE)

    for i in range(onset_sample, min(offset_sample, NUM_SAMPLES)):
        local_t = (i - onset_sample) / SAMPLE_RATE
        fade_in = min(1.0, (i - onset_sample) / ramp_samples) if (i - onset_sample) < ramp_samples else 1.0
        fade_out = min(1.0, (offset_sample - i) / ramp_samples) if (offset_sample - i) < ramp_samples else 1.0
        envelope = fade_in * fade_out
        voice[i] = VOICE_AMP * envelope * np.sin(2 * np.pi * VOICE_FREQ * local_t)

    duck_start = max(0, onset_sample - ramp_samples)
    duck_end = min(NUM_SAMPLES, offset_sample + ramp_samples)

    for i in range(duck_start, onset_sample):
        progress = (i - duck_start) / ramp_samples
        duck_envelope[i] = 1.0 - progress * (1.0 - DUCK_RATIO)

    for i in range(onset_sample, min(offset_sample, NUM_SAMPLES)):
        duck_envelope[i] = DUCK_RATIO

    for i in range(min(offset_sample, NUM_SAMPLES), duck_end):
        progress = (i - offset_sample) / ramp_samples
        duck_envelope[i] = DUCK_RATIO + progress * (1.0 - DUCK_RATIO)

left = binaural_left * duck_envelope + solfeggio * duck_envelope + voice
right = binaural_right * duck_envelope + solfeggio * duck_envelope + voice

left = np.clip(left, -1.0, 1.0)
right = np.clip(right, -1.0, 1.0)

stereo = np.column_stack((left, right))
audio_16bit = np.int16(stereo * 32767)

wavfile.write("vision_movie_demo.wav", SAMPLE_RATE, audio_16bit)

print(f"Generated vision_movie_demo.wav")
print(f"  Duration: {DURATION}s | Sample rate: {SAMPLE_RATE} Hz | Channels: 2 (stereo)")
print(f"  Binaural: {CARRIER_LEFT}Hz L / {CARRIER_RIGHT}Hz R ({CARRIER_RIGHT - CARRIER_LEFT}Hz theta beat)")
print(f"  Solfeggio: {SOLFEGGIO_FREQ}Hz @ {SOLFEGGIO_AMP} amplitude")
print(f"  Voice placeholder: {VOICE_FREQ}Hz pulse every {VOICE_INTERVAL}s ({VOICE_PULSE_DURATION}s duration)")
print(f"  Duck ratio: {int((1 - DUCK_RATIO) * 100)}% reduction during voice pulses")
