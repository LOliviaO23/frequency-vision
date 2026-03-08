import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { type Kit, type Affirmation, type KitVisual } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Mic,
  MicOff,
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Circle,
  Waves,
  RotateCcw,
  Sparkles,
  Music,
  Upload,
  X,
  Headphones,
  Check,
  Image,
  Loader2,
  Film,
  Sun,
  Moon,
  RefreshCw,
  Wind,
  Heart,
  ChevronRight,
  SkipForward,
  Lock,
  Crown,
  Save,
  CreditCard,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useFrequency } from "@/hooks/use-frequency";
import {
  useVoiceRecorder,
  type RecordingData,
} from "@/hooks/use-voice-recorder";
import { useVoiceProcessor } from "@/hooks/use-voice-processor";
import { useToast } from "@/hooks/use-toast";

type PlayerMode =
  | "build"
  | "record"
  | "assembling"
  | "preparation"
  | "playback"
  | "complete";

interface ProcessedRecording extends RecordingData {
  processedUrl: string;
  processedBlob: Blob;
}

export default function Player() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const { data: kit, isLoading: kitLoading } = useQuery<Kit>({
    queryKey: ["/api/kits", id],
  });

  const { data: affirmations, isLoading: affLoading } = useQuery<Affirmation[]>(
    {
      queryKey: ["/api/kits", id, "affirmations"],
    },
  );

  const { data: visuals } = useQuery<KitVisual[]>({
    queryKey: ["/api/visuals", kit?.category],
    enabled: !!kit?.category,
  });

  const [mode, setMode] = useState<PlayerMode>("build");
  const [recordings, setRecordings] = useState<Map<string, ProcessedRecording>>(
    new Map(),
  );
  const [isPlayingBack, setIsPlayingBack] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [frequencyVolume, setFrequencyVolume] = useState(0.15);
  const [frequencyMuted, setFrequencyMuted] = useState(false);
  const [playbackElapsed, setPlaybackElapsed] = useState(0);
  const [uploadedSong, setUploadedSong] = useState<{
    file: File;
    url: string;
    name: string;
  } | null>(null);
  const [songVolume, setSongVolume] = useState(0.35);
  const [songMuted, setSongMuted] = useState(false);
  const [currentPlaybackIndex, setCurrentPlaybackIndex] = useState(0);

  const [selectedAffirmationIds, setSelectedAffirmationIds] = useState<
    Set<string>
  >(new Set());
  const [selectedVisualIds, setSelectedVisualIds] = useState<Set<string>>(
    new Set(),
  );
  const [currentVisualIndex, setCurrentVisualIndex] = useState(0);

  const [recordingAffId, setRecordingAffId] = useState<string | null>(null);
  const [processingAffId, setProcessingAffId] = useState<string | null>(null);
  const [playingAffId, setPlayingAffId] = useState<string | null>(null);
  const [assemblyProgress, setAssemblyProgress] = useState(0);
  const [assemblyStep, setAssemblyStep] = useState("");
  const [prepStep, setPrepStep] = useState(0);
  const [breathPhase, setBreathPhase] = useState<"inhale" | "hold" | "exhale">(
    "inhale",
  );
  const [breathTimer, setBreathTimer] = useState(7);
  const [breathCycle, setBreathCycle] = useState(1);
  const [relaxationIndex, setRelaxationIndex] = useState(0);
  const [countdownNumber, setCountdownNumber] = useState(10);
  const [countdownText, setCountdownText] = useState("");

  const [hasUnlockedReplay, setHasUnlockedReplay] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const frequency = useFrequency();
  const recorder = useVoiceRecorder();
  const voiceProcessor = useVoiceProcessor();
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevAudioRef = useRef<HTMLAudioElement | null>(null);
  const songAudioRef = useRef<HTMLAudioElement | null>(null);
  const songGainNodeRef = useRef<GainNode | null>(null);
  const songSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const songFileInputRef = useRef<HTMLInputElement | null>(null);
  const playbackIndexRef = useRef(0);
  const visualIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const assemblyTimersRef = useRef<NodeJS.Timeout[]>([]);
  const assemblyCancelledRef = useRef(false);
  const prepTimersRef = useRef<NodeJS.Timeout[]>([]);
  const playbackIntervalsRef = useRef<NodeJS.Timeout[]>([]);
  const fadeIntervalsRef = useRef<NodeJS.Timeout[]>([]);
  const createdUrlsRef = useRef<Set<string>>(new Set());

  const selectedAffirmations = useMemo(
    () => affirmations?.filter((a) => selectedAffirmationIds.has(a.id)) || [],
    [affirmations, selectedAffirmationIds],
  );

  const selectedVisuals = useMemo(
    () => visuals?.filter((v) => selectedVisualIds.has(v.id)) || [],
    [visuals, selectedVisualIds],
  );

  const currentAffirmation = selectedAffirmations[currentPlaybackIndex];
  const totalAffirmations = selectedAffirmations.length;
  const recordedCount = selectedAffirmations.filter((a) =>
    recordings.has(a.id),
  ).length;
  const allRecorded =
    totalAffirmations > 0 && recordedCount === totalAffirmations;

  const toggleAffirmation = useCallback((affId: string) => {
    setSelectedAffirmationIds((prev) => {
      const next = new Set(prev);
      if (next.has(affId)) {
        next.delete(affId);
        setRecordings((prevRecs) => {
          const nextRecs = new Map(prevRecs);
          const rec = nextRecs.get(affId);
          if (rec) {
            URL.revokeObjectURL(rec.url);
            URL.revokeObjectURL(rec.processedUrl);
          }
          nextRecs.delete(affId);
          return nextRecs;
        });
      } else {
        next.add(affId);
      }
      return next;
    });
  }, []);

  const toggleVisual = useCallback((visId: string) => {
    setSelectedVisualIds((prev) => {
      const next = new Set(prev);
      if (next.has(visId)) {
        next.delete(visId);
      } else {
        next.add(visId);
      }
      return next;
    });
  }, []);

  const handleSongUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("audio/")) {
        toast({
          title: "Invalid File",
          description: "Please upload an audio file (MP3, WAV, AAC, etc.)",
          variant: "destructive",
        });
        return;
      }
      if (uploadedSong) {
        URL.revokeObjectURL(uploadedSong.url);
      }
      const url = URL.createObjectURL(file);
      createdUrlsRef.current.add(url);
      setUploadedSong({ file, url, name: file.name });
      toast({
        title: "Song Added",
        description: `"${file.name}" will play in the background of your vision movie.`,
      });
      if (songFileInputRef.current) songFileInputRef.current.value = "";
    },
    [uploadedSong, toast],
  );

  const handleRemoveSong = useCallback(() => {
    if (uploadedSong) {
      URL.revokeObjectURL(uploadedSong.url);
      setUploadedSong(null);
      toast({ title: "Song Removed" });
    }
  }, [uploadedSong, toast]);

  const handleStartRecordingFor = useCallback(
    async (affId: string) => {
      if (recordingAffId) return;
      try {
        await recorder.startRecording();
        setRecordingAffId(affId);
      } catch {
        toast({
          title: "Microphone Access Required",
          description:
            "Please allow microphone access to record your affirmations.",
          variant: "destructive",
        });
      }
    },
    [recorder, toast, recordingAffId],
  );

  const handleStopRecordingFor = useCallback(
    async (affId: string) => {
      try {
        const data = await recorder.stopRecording();
        setRecordingAffId(null);
        setProcessingAffId(affId);

        toast({
          title: "Processing Voice",
          description: "Optimizing your voice to the ideal hypnotic pitch...",
        });

        try {
          const processed = await voiceProcessor.processVoice(data.blob);

          createdUrlsRef.current.add(data.url);
          createdUrlsRef.current.add(processed.url);

          const processedRecording: ProcessedRecording = {
            ...data,
            processedUrl: processed.url,
            processedBlob: processed.blob,
          };

          setRecordings((prev) => {
            const next = new Map(prev);
            next.set(affId, processedRecording);
            return next;
          });

          toast({
            title: "Recording Saved",
            description:
              "Your voice has been auto-tuned to the perfect trance pitch.",
          });
        } catch {
          createdUrlsRef.current.add(data.url);

          const processedRecording: ProcessedRecording = {
            ...data,
            processedUrl: data.url,
            processedBlob: data.blob,
          };

          setRecordings((prev) => {
            const next = new Map(prev);
            next.set(affId, processedRecording);
            return next;
          });

          toast({
            title: "Recording Saved",
            description: "Voice saved (pitch processing unavailable).",
          });
        }
      } catch {
        toast({
          title: "Recording Error",
          description: "Failed to save recording. Please try again.",
          variant: "destructive",
        });
      } finally {
        setProcessingAffId(null);
      }
    },
    [recorder, voiceProcessor, toast],
  );

  const handlePlayRecording = useCallback(
    (affId: string, useProcessed = true) => {
      const rec = recordings.get(affId);
      if (!rec) return;

      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }

      if (playingAffId === affId) {
        setPlayingAffId(null);
        return;
      }

      const audio = new Audio(useProcessed ? rec.processedUrl : rec.url);
      previewAudioRef.current = audio;
      setPlayingAffId(affId);
      audio.onended = () => {
        setPlayingAffId(null);
        previewAudioRef.current = null;
      };
      audio.play();
    },
    [recordings, playingAffId],
  );

  const handleDeleteRecording = useCallback(
    (affId: string) => {
      setRecordings((prev) => {
        const next = new Map(prev);
        const rec = next.get(affId);
        if (rec) {
          URL.revokeObjectURL(rec.url);
          URL.revokeObjectURL(rec.processedUrl);
        }
        next.delete(affId);
        return next;
      });
      if (playingAffId === affId) {
        previewAudioRef.current?.pause();
        previewAudioRef.current = null;
        setPlayingAffId(null);
      }
    },
    [playingAffId],
  );

  const startPlaybackRef = useRef<() => void>(() => {});

  const handleUnlockReplay = useCallback(async () => {
    if (!kit) return;
    setIsCheckingOut(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kitId: kit.id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({
          title: "Checkout Error",
          description: "Unable to start checkout. Please try again.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Connection Error",
        description: "Could not connect to payment server.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingOut(false);
    }
  }, [kit, toast]);

  const clearAssemblyTimers = useCallback(() => {
    assemblyTimersRef.current.forEach(clearTimeout);
    assemblyTimersRef.current = [];
    assemblyCancelledRef.current = true;
  }, []);

  const startAssembly = useCallback(() => {
    if (!selectedAffirmations.length || !kit || mode === "assembling") return;

    clearAssemblyTimers();
    assemblyCancelledRef.current = false;

    setMode("assembling");
    setAssemblyProgress(0);
    setAssemblyStep("Weaving your visuals together...");

    const steps = [
      { progress: 15, label: "Weaving your visuals together...", delay: 800 },
      {
        progress: 30,
        label: "Layering your recorded affirmations...",
        delay: 1200,
      },
      {
        progress: 50,
        label: `Tuning ${kit.frequencyHz} Hz Solfeggio frequency...`,
        delay: 1000,
      },
      {
        progress: 65,
        label: "Synchronizing theta binaural beats...",
        delay: 900,
      },
      {
        progress: 80,
        label: uploadedSong
          ? `Mixing "${uploadedSong.name}"...`
          : "Balancing audio layers...",
        delay: 1100,
      },
      { progress: 92, label: "Finalizing your vision movie...", delay: 800 },
      { progress: 100, label: "Your movie is ready", delay: 600 },
    ];

    let i = 0;
    const runStep = () => {
      if (assemblyCancelledRef.current) return;
      if (i >= steps.length) {
        const t = setTimeout(() => {
          if (!assemblyCancelledRef.current) {
            setMode("preparation");
            setPrepStep(0);
          }
        }, 500);
        assemblyTimersRef.current.push(t);
        return;
      }
      const step = steps[i];
      setAssemblyProgress(step.progress);
      setAssemblyStep(step.label);
      i++;
      const t = setTimeout(runStep, step.delay);
      assemblyTimersRef.current.push(t);
    };
    runStep();
  }, [selectedAffirmations, kit, uploadedSong, mode, clearAssemblyTimers]);

  const duckSong = useCallback((duck: boolean) => {
    if (!songGainNodeRef.current || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const gain = songGainNodeRef.current;
    const target = duck ? songVolume * 0.4 : songVolume;
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(
      songMuted ? 0 : target,
      ctx.currentTime + 0.3,
    );
  }, [songVolume, songMuted]);

  const clearFadeIntervals = useCallback(() => {
    fadeIntervalsRef.current.forEach(clearInterval);
    fadeIntervalsRef.current = [];
  }, []);

  const crossfadeToAffirmation = useCallback((processedUrl: string) => {
    const FADE_MS = 300;

    if (audioRef.current) {
      const outgoing = audioRef.current;
      prevAudioRef.current = outgoing;
      const startVol = outgoing.volume;
      const fadeSteps = 15;
      const stepTime = FADE_MS / fadeSteps;
      let step = 0;
      const fadeOut = setInterval(() => {
        step++;
        outgoing.volume = Math.max(0, startVol * (1 - step / fadeSteps));
        if (step >= fadeSteps) {
          clearInterval(fadeOut);
          outgoing.pause();
          outgoing.removeAttribute("src");
          prevAudioRef.current = null;
        }
      }, stepTime);
      fadeIntervalsRef.current.push(fadeOut);
    }

    duckSong(true);

    const audio = new Audio(processedUrl);
    audio.volume = 0;
    audioRef.current = audio;

    audio.onended = () => {
      duckSong(false);
    };

    audio.play().then(() => {
      const fadeSteps = 15;
      const stepTime = FADE_MS / fadeSteps;
      let step = 0;
      const fadeIn = setInterval(() => {
        step++;
        audio.volume = Math.min(1, step / fadeSteps);
        if (step >= fadeSteps) {
          clearInterval(fadeIn);
        }
      }, stepTime);
      fadeIntervalsRef.current.push(fadeIn);
    }).catch(() => {});
  }, [duckSong]);

  const startPlayback = useCallback(() => {
    if (!selectedAffirmations.length || !kit) return;

    setMode("playback");
    setIsPlayingBack(true);
    setPlaybackProgress(0);
    setPlaybackElapsed(0);
    playbackIndexRef.current = 0;
    setCurrentPlaybackIndex(0);
    setCurrentVisualIndex(0);

    playbackIntervalsRef.current.forEach(clearInterval);
    playbackIntervalsRef.current = [];
    clearFadeIntervals();

    if (!frequency.isPlaying) {
      frequency.start(kit.frequencyHz);
      frequency.setVolume(frequencyMuted ? 0 : frequencyVolume);
    }

    if (uploadedSong) {
      const ctx = audioCtxRef.current || new AudioContext();
      audioCtxRef.current = ctx;
      if (ctx.state === "suspended") ctx.resume().catch(() => {});

      const songEl = new Audio(uploadedSong.url);
      songEl.loop = true;
      songEl.crossOrigin = "anonymous";
      songAudioRef.current = songEl;

      if (!songSourceRef.current) {
        const source = ctx.createMediaElementSource(songEl);
        const gainNode = ctx.createGain();
        gainNode.gain.value = songMuted ? 0 : songVolume;
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        songSourceRef.current = source;
        songGainNodeRef.current = gainNode;
      }

      songEl.play().catch(() => {});
    }

    if (selectedVisuals.length > 1) {
      visualIntervalRef.current = setInterval(() => {
        setCurrentVisualIndex((prev) => (prev + 1) % selectedVisuals.length);
      }, 20000);
    }

    const totalDuration = kit.duration * 60;
    const perAffirmation = totalDuration / selectedAffirmations.length;
    let elapsed = 0;

    const playNext = () => {
      const idx = playbackIndexRef.current;
      if (idx >= selectedAffirmations.length) {
        setIsPlayingBack(false);
        frequency.stop();
        if (songAudioRef.current) {
          songAudioRef.current.pause();
          songAudioRef.current = null;
        }
        songSourceRef.current = null;
        songGainNodeRef.current = null;
        if (audioCtxRef.current) {
          audioCtxRef.current.close().catch(() => {});
          audioCtxRef.current = null;
        }
        if (visualIntervalRef.current) {
          clearInterval(visualIntervalRef.current);
          visualIntervalRef.current = null;
        }
        setMode("complete");
        return;
      }

      setCurrentPlaybackIndex(idx);
      const aff = selectedAffirmations[idx];
      const rec = recordings.get(aff.id);

      if (rec) {
        crossfadeToAffirmation(rec.processedUrl);
      }

      const stepInterval = setInterval(() => {
        elapsed += 0.1;
        setPlaybackElapsed(elapsed);
        setPlaybackProgress((elapsed / totalDuration) * 100);
      }, 100);
      playbackIntervalsRef.current.push(stepInterval);

      playbackTimerRef.current = setTimeout(() => {
        clearInterval(stepInterval);
        playbackIndexRef.current = idx + 1;
        playNext();
      }, perAffirmation * 1000);
    };

    playNext();
  }, [
    selectedAffirmations,
    selectedVisuals,
    kit,
    frequency,
    recordings,
    frequencyMuted,
    frequencyVolume,
    uploadedSong,
    songVolume,
    songMuted,
    crossfadeToAffirmation,
    clearFadeIntervals,
  ]);

  startPlaybackRef.current = startPlayback;

  useEffect(() => {
    return () => {
      assemblyTimersRef.current.forEach(clearTimeout);
      assemblyTimersRef.current = [];
      prepTimersRef.current.forEach(clearTimeout);
      prepTimersRef.current = [];
    };
  }, []);

  const stopPlayback = useCallback(() => {
    if (playbackTimerRef.current) {
      clearTimeout(playbackTimerRef.current);
    }
    playbackIntervalsRef.current.forEach(clearInterval);
    playbackIntervalsRef.current = [];
    clearFadeIntervals();
    audioRef.current?.pause();
    prevAudioRef.current?.pause();
    prevAudioRef.current = null;
    if (songAudioRef.current) {
      songAudioRef.current.pause();
      songAudioRef.current = null;
    }
    if (songSourceRef.current) {
      try { songSourceRef.current.disconnect(); } catch {}
      songSourceRef.current = null;
    }
    if (songGainNodeRef.current) {
      try { songGainNodeRef.current.disconnect(); } catch {}
      songGainNodeRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (visualIntervalRef.current) {
      clearInterval(visualIntervalRef.current);
      visualIntervalRef.current = null;
    }
    frequency.stop();
    setIsPlayingBack(false);
  }, [frequency, clearFadeIntervals]);

  const clearPrepTimers = useCallback(() => {
    prepTimersRef.current.forEach(clearTimeout);
    prepTimersRef.current = [];
  }, []);

  const skipPreparation = useCallback(() => {
    clearPrepTimers();
    if (frequency.isPlaying) {
      frequency.setVolume(frequencyMuted ? 0 : frequencyVolume);
    }
    startPlaybackRef.current();
  }, [clearPrepTimers, frequency, frequencyMuted, frequencyVolume]);

  const vagusNerveExercises = [
    {
      title: "Slow Diaphragmatic Breathing",
      instruction:
        "Place one hand on your chest, one on your belly. Breathe deeply so only your belly hand rises. Take 3 slow, deep breaths through your nose now.",
    },
    {
      title: "Extended Exhale",
      instruction:
        "Inhale through your nose for 4 seconds, then exhale slowly through pursed lips for 8 seconds. The long exhale activates your vagus nerve and triggers deep calm. Do this 3 times.",
    },
    {
      title: "Gentle Humming",
      instruction:
        "Take a deep breath in, then hum gently as you exhale — feel the vibration in your throat and chest. The vibration stimulates your vagus nerve directly. Hum through 3 exhales.",
    },
  ];

  const relaxationBodyParts = [
    "Bring your awareness to the top of your head... feel your scalp relaxing, softening, releasing all tension...",
    "Let that wave of relaxation flow down to your forehead... smoothing every line... releasing every worry...",
    "Your eyes relax now... the muscles around them softening... your eyelids growing heavy and comfortable...",
    "Feel your jaw unclenching... your teeth slightly apart... your tongue resting softly in your mouth...",
    "That warm wave flows down your neck... releasing each muscle... your head feeling perfectly supported...",
    "Your shoulders drop now... all the weight of the world melting off them... feel them sinking into deep comfort...",
    "Relaxation flows down both arms... through your elbows... your forearms... into your hands... all the way to your fingertips...",
    "Your chest opens and softens with each breath... your heart beating slowly, steadily, peacefully...",
    "Your abdomen relaxes... your core softening... each breath carrying you deeper into stillness...",
    "That warm relaxation spreads through your hips... down your thighs... your muscles releasing completely...",
    "Your knees relax... your calves... your shins... all tension dissolving away...",
    "Finally, your feet relax completely... the soles of your feet warm and heavy... your entire body now in a state of deep, receptive calm...",
  ];

  const countdownSteps = [
    {
      num: 10,
      text: "You are at the top of a beautiful staircase bathed in warm, golden light...",
    },
    {
      num: 9,
      text: "With each step down, you feel yourself drifting deeper into peaceful awareness...",
    },
    {
      num: 8,
      text: "Deeper and deeper... every step takes you closer to the core of your subconscious mind...",
    },
    {
      num: 7,
      text: "The light grows warmer... softer... you feel completely safe and held...",
    },
    {
      num: 6,
      text: "Your conscious mind rests now... your inner mind opens like a flower to the sun...",
    },
    {
      num: 5,
      text: "Halfway down... you are entering the theta state... the doorway to transformation...",
    },
    {
      num: 4,
      text: "Deeper still... your subconscious is fully open, ready to receive your new truth...",
    },
    {
      num: 3,
      text: "Almost there... every cell in your body is listening, absorbing, accepting...",
    },
    {
      num: 2,
      text: "One more step... you are in the deepest state of receptivity...",
    },
    {
      num: 1,
      text: "You are here. Your subconscious mind is wide open. Your vision movie begins now...",
    },
  ];

  const startBreathingExercise = useCallback(() => {
    if (prepStep === 1) return;
    clearPrepTimers();
    setPrepStep(1);
    setBreathCycle(1);
    setBreathPhase("inhale");
    setBreathTimer(7);

    let cycle = 1;
    let phase: "inhale" | "hold" | "exhale" = "inhale";
    let timer = 7;
    const maxCycles = 3;

    const tick = () => {
      timer--;
      setBreathTimer(timer);

      if (timer <= 0) {
        if (phase === "inhale") {
          phase = "hold";
          timer = 4;
          setBreathPhase("hold");
          setBreathTimer(4);
        } else if (phase === "hold") {
          phase = "exhale";
          timer = 7;
          setBreathPhase("exhale");
          setBreathTimer(7);
        } else {
          cycle++;
          if (cycle > maxCycles) {
            setPrepStep(2);
            startRelaxation();
            return;
          }
          setBreathCycle(cycle);
          phase = "inhale";
          timer = 7;
          setBreathPhase("inhale");
          setBreathTimer(7);
        }
      }

      const t = setTimeout(tick, 1000);
      prepTimersRef.current.push(t);
    };

    const t = setTimeout(tick, 1000);
    prepTimersRef.current.push(t);
  }, [prepStep, clearPrepTimers]);

  const startRelaxation = useCallback(() => {
    setPrepStep(2);
    setRelaxationIndex(0);

    if (!frequency.isPlaying && kit) {
      frequency.start(kit.frequencyHz);
      frequency.setVolume(frequencyMuted ? 0 : frequencyVolume * 0.5);
    }

    let idx = 0;
    const advanceRelaxation = () => {
      idx++;
      if (idx >= relaxationBodyParts.length) {
        setPrepStep(3);
        startCountdown();
        return;
      }
      setRelaxationIndex(idx);
      const t = setTimeout(advanceRelaxation, 5000);
      prepTimersRef.current.push(t);
    };

    const t = setTimeout(advanceRelaxation, 5000);
    prepTimersRef.current.push(t);
  }, [frequency, kit, frequencyMuted, frequencyVolume]);

  const startCountdown = useCallback(() => {
    setPrepStep(3);
    setCountdownNumber(10);
    setCountdownText(countdownSteps[0].text);

    if (!frequency.isPlaying && kit) {
      frequency.start(kit.frequencyHz);
      frequency.setVolume(frequencyMuted ? 0 : frequencyVolume);
    } else {
      frequency.setVolume(frequencyMuted ? 0 : frequencyVolume);
    }

    let idx = 0;
    const advanceCountdown = () => {
      idx++;
      if (idx >= countdownSteps.length) {
        const t = setTimeout(() => {
          startPlaybackRef.current();
        }, 2000);
        prepTimersRef.current.push(t);
        return;
      }
      setCountdownNumber(countdownSteps[idx].num);
      setCountdownText(countdownSteps[idx].text);
      const t = setTimeout(advanceCountdown, 4000);
      prepTimersRef.current.push(t);
    };

    const t = setTimeout(advanceCountdown, 4000);
    prepTimersRef.current.push(t);
  }, [frequency, kit, frequencyMuted, frequencyVolume]);

  const toggleFrequencyPreview = useCallback(() => {
    if (!kit) return;
    if (frequency.isPlaying) {
      frequency.stop();
    } else {
      frequency.start(kit.frequencyHz);
      frequency.setVolume(frequencyMuted ? 0 : frequencyVolume);
    }
  }, [kit, frequency, frequencyMuted, frequencyVolume]);

  useEffect(() => {
    frequency.setVolume(frequencyMuted ? 0 : frequencyVolume);
  }, [frequencyVolume, frequencyMuted, frequency]);

  useEffect(() => {
    if (songGainNodeRef.current && audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      songGainNodeRef.current.gain.cancelScheduledValues(ctx.currentTime);
      songGainNodeRef.current.gain.setValueAtTime(
        songGainNodeRef.current.gain.value,
        ctx.currentTime,
      );
      songGainNodeRef.current.gain.linearRampToValueAtTime(
        songMuted ? 0 : songVolume,
        ctx.currentTime + 0.1,
      );
    } else if (songAudioRef.current) {
      songAudioRef.current.volume = songMuted ? 0 : songVolume;
    }
  }, [songVolume, songMuted]);

  useEffect(() => {
    return () => {
      if (playbackTimerRef.current) clearTimeout(playbackTimerRef.current);
      if (visualIntervalRef.current) clearInterval(visualIntervalRef.current);
      playbackIntervalsRef.current.forEach(clearInterval);
      playbackIntervalsRef.current = [];
      fadeIntervalsRef.current.forEach(clearInterval);
      fadeIntervalsRef.current = [];

      audioRef.current?.pause();
      audioRef.current = null;
      prevAudioRef.current?.pause();
      prevAudioRef.current = null;

      if (songAudioRef.current) {
        songAudioRef.current.pause();
        songAudioRef.current = null;
      }
      if (songSourceRef.current) {
        try { songSourceRef.current.disconnect(); } catch {}
        songSourceRef.current = null;
      }
      if (songGainNodeRef.current) {
        try { songGainNodeRef.current.disconnect(); } catch {}
        songGainNodeRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      frequency.stop();
    };
  }, []);

  useEffect(() => {
    return () => {
      createdUrlsRef.current.forEach((url) => {
        try { URL.revokeObjectURL(url); } catch {}
      });
      createdUrlsRef.current.clear();
    };
  }, []);

  if (kitLoading || affLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full rounded-md" />
      </div>
    );
  }

  if (!kit || !affirmations) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center">
        <Sparkles className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
        <h2 className="font-semibold text-xl mb-2">Kit Not Found</h2>
        <Link href="/kits">
          <Button data-testid="button-back-to-kits">Back to Kits</Button>
        </Link>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const canContinueToRecord =
    selectedAffirmationIds.size >= 5 && selectedVisualIds.size >= 3;

  const previousVisualIndex =
    selectedVisuals.length > 0
      ? (currentVisualIndex - 1 + selectedVisuals.length) %
        selectedVisuals.length
      : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            {mode === "record" ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setMode("build");
                }}
                data-testid="button-back-to-build"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            ) : mode === "complete" ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  clearAssemblyTimers();
                  setMode("record");
                }}
                data-testid="button-back-to-record"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            ) : mode === "assembling" ? null : (
              <Link href={`/kits/${kit.id}`}>
                <Button
                  variant="ghost"
                  size="icon"
                  data-testid="button-player-back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <div>
              <h1
                className="font-semibold text-sm"
                data-testid="text-player-title"
              >
                {kit.title}
              </h1>
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="text-xs no-default-hover-elevate no-default-active-elevate"
                >
                  <Waves className="mr-1 h-2.5 w-2.5" />
                  {kit.frequencyHz} Hz
                </Badge>
                {mode === "build" && (
                  <span
                    className="text-xs text-muted-foreground"
                    data-testid="text-selected-count"
                  >
                    {selectedAffirmationIds.size} affirmations,{" "}
                    {selectedVisualIds.size} visuals selected
                  </span>
                )}
                {mode === "record" && (
                  <span className="text-xs text-muted-foreground">
                    {recordedCount}/{totalAffirmations} recorded
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {mode === "record" && (
              <Button
                variant={frequency.isPlaying ? "default" : "outline"}
                size="sm"
                onClick={toggleFrequencyPreview}
                data-testid="button-toggle-frequency"
              >
                <Waves className="mr-1.5 h-3.5 w-3.5" />
                {frequency.isPlaying ? "Theta Active" : "Theta Off"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {mode === "build" && (
        <div className="flex-1 mx-auto max-w-6xl w-full px-4 py-8">
          <div className="mb-8 space-y-3">
            <h2
              className="font-serif text-2xl font-bold"
              data-testid="text-build-title"
            >
              Build Your Vision Movie
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              Select the affirmations and visuals that resonate most deeply with
              you. You'll choose at least 5 affirmations and 3 visuals to create
              your personalized experience.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3 space-y-6">
              <div>
                <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
                  <h3 className="font-semibold text-lg">Your Affirmations</h3>
                  <Badge
                    variant="secondary"
                    className="no-default-hover-elevate no-default-active-elevate"
                  >
                    {selectedAffirmationIds.size} of {affirmations.length}{" "}
                    selected
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose at least 5 affirmations that speak to your goals.
                  You'll record each one in your own voice in the next step.
                </p>
                <div className="space-y-1.5 max-h-[55vh] overflow-y-auto pr-1">
                  {affirmations.map((aff, index) => {
                    const isSelected = selectedAffirmationIds.has(aff.id);
                    return (
                      <button
                        key={aff.id}
                        onClick={() => toggleAffirmation(aff.id)}
                        className={`w-full text-left flex items-start gap-3 rounded-md border p-3 transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                            : "hover-elevate"
                        }`}
                        data-testid={`button-select-affirmation-${aff.id}`}
                      >
                        <span className="mt-0.5 shrink-0">
                          {isSelected ? (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs text-muted-foreground font-mono mr-2">
                            {(index + 1).toString().padStart(2, "0")}
                          </span>
                          <span className="text-sm leading-relaxed">
                            {aff.text}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div>
                <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Your Visuals
                  </h3>
                  <Badge
                    variant="secondary"
                    className="no-default-hover-elevate no-default-active-elevate"
                  >
                    {selectedVisualIds.size} selected
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Pick at least 3 images for your vision movie background.
                </p>
                {visuals && visuals.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                    {visuals.map((visual) => {
                      const isSelected = selectedVisualIds.has(visual.id);
                      return (
                        <button
                          key={visual.id}
                          onClick={() => toggleVisual(visual.id)}
                          className={`relative rounded-md overflow-visible aspect-[4/3] group ${
                            isSelected
                              ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                              : ""
                          }`}
                          data-testid={`button-select-visual-${visual.id}`}
                        >
                          <img
                            src={visual.imageUrl}
                            alt={visual.label}
                            className="w-full h-full object-cover rounded-md"
                          />
                          <div
                            className={`absolute inset-0 rounded-md flex items-center justify-center transition-colors ${
                              isSelected
                                ? "bg-primary/20"
                                : "bg-black/0 group-hover:bg-black/20"
                            }`}
                          >
                            {isSelected && (
                              <div className="bg-primary rounded-full p-1">
                                <Check className="h-4 w-4 text-primary-foreground" />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Loading visuals...
                  </div>
                )}
              </div>

              <Card className="p-0 overflow-hidden border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-purple-500/5 to-pink-500/5">
                <div className="h-1.5 bg-gradient-to-r from-amber-500/40 via-purple-500/30 to-pink-500/40" />
                <div className="p-5 space-y-4">
                  <input
                    ref={songFileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleSongUpload}
                    className="hidden"
                    data-testid="input-song-upload-build"
                  />
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-500/20">
                      <Music className="h-5 w-5 text-amber-400" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-serif font-bold text-base">
                        Add Your Favorite Song
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Upload a song that uplifts or relaxes you — it will play
                        in the forefront of your vision movie while the{" "}
                        {kit.frequencyHz} Hz Solfeggio frequency and theta
                        binaural beats work subliminally in the background.
                        Music you love deepens the emotional connection and
                        makes each session even more powerful.
                      </p>
                    </div>
                  </div>

                  {!uploadedSong ? (
                    <Button
                      variant="outline"
                      className="w-full border-amber-500/20 hover:bg-amber-500/10 hover:border-amber-500/30"
                      onClick={() => songFileInputRef.current?.click()}
                      data-testid="button-upload-song-build"
                    >
                      <Upload className="mr-2 h-4 w-4 text-amber-400" />
                      Choose a Song (MP3, WAV, AAC)
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 bg-amber-500/10 rounded-lg p-3">
                        <Headphones className="h-4 w-4 text-amber-400 shrink-0" />
                        <span className="text-sm truncate flex-1">
                          {uploadedSong.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={handleRemoveSong}
                          data-testid="button-remove-song-build"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setSongMuted(!songMuted)}
                          data-testid="button-mute-song-build"
                        >
                          {songMuted ? (
                            <VolumeX className="h-3.5 w-3.5" />
                          ) : (
                            <Volume2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Slider
                          value={[songVolume * 100]}
                          onValueChange={([v]) => setSongVolume(v / 100)}
                          max={100}
                          step={1}
                          className="flex-1"
                          data-testid="slider-song-volume-build"
                        />
                      </div>
                      <p className="text-xs text-amber-400/70">
                        Your song will automatically lower when affirmations
                        play, then return to full volume between them.
                      </p>
                    </div>
                  )}

                  <div className="bg-background/50 rounded-lg p-3 space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      During your vision movie:
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Music className="h-3 w-3 text-amber-400 shrink-0" />
                      <span>
                        Your song plays at the forefront — the soundtrack to
                        your new reality
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mic className="h-3 w-3 text-pink-400 shrink-0" />
                      <span>
                        Your recorded affirmations play intermittently over the
                        music
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Waves className="h-3 w-3 text-purple-400 shrink-0" />
                      <span>
                        {kit.frequencyHz} Hz Solfeggio + theta beats play
                        subliminally underneath
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              <Button
                className="w-full"
                disabled={!canContinueToRecord}
                onClick={() => {
                  setMode("record");
                }}
                data-testid="button-continue-recording"
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Continue to Recording
                {!canContinueToRecord && (
                  <span className="ml-2 text-xs opacity-70">
                    (need {Math.max(0, 5 - selectedAffirmationIds.size)} more
                    affirmations, {Math.max(0, 3 - selectedVisualIds.size)} more
                    visuals)
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {mode === "record" && !isPlayingBack && (
        <div className="flex-1 mx-auto max-w-6xl w-full px-4 py-8">
          <div className="mb-6 space-y-3">
            <h2
              className="font-serif text-2xl font-bold"
              data-testid="text-record-title"
            >
              Record Your Affirmations
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              Tap the microphone button next to each affirmation, speak it
              clearly, then tap stop. Your voice is automatically tuned to the
              ideal hypnotic pitch for maximum subconscious receptivity. Each
              recording saves automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <Mic className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Your Affirmations</h3>
                </div>
                <div className="flex items-center gap-3">
                  <Progress
                    value={(recordedCount / totalAffirmations) * 100}
                    className="h-2 w-32"
                  />
                  <span className="text-sm text-muted-foreground font-mono">
                    {recordedCount}/{totalAffirmations}
                  </span>
                </div>
              </div>

              <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
                {selectedAffirmations.map((aff, i) => {
                  const hasRecording = recordings.has(aff.id);
                  const isRecordingThis = recordingAffId === aff.id;
                  const isProcessingThis = processingAffId === aff.id;
                  const isPlayingThis = playingAffId === aff.id;
                  const rec = recordings.get(aff.id);

                  return (
                    <Card
                      key={aff.id}
                      className={`p-4 transition-all ${
                        isRecordingThis
                          ? "border-red-500/50 bg-red-500/5 ring-1 ring-red-500/30"
                          : hasRecording
                            ? "border-green-500/30 bg-green-500/5"
                            : ""
                      }`}
                      data-testid={`card-affirmation-${i}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 mt-1">
                          {hasRecording ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : isProcessingThis ? (
                            <Loader2 className="h-5 w-5 text-purple-400 animate-spin" />
                          ) : (
                            <span className="font-mono text-xs text-muted-foreground w-5 h-5 flex items-center justify-center">
                              {(i + 1).toString().padStart(2, "0")}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-2">
                          <p
                            className={`text-sm leading-relaxed ${isRecordingThis ? "font-semibold text-foreground" : ""}`}
                          >
                            {aff.text}
                          </p>

                          {isRecordingThis && (
                            <div className="flex items-center gap-2">
                              <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                              </span>
                              <span className="text-xs text-red-500 font-medium">
                                Recording... speak the affirmation above
                              </span>
                            </div>
                          )}

                          {isProcessingThis && (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-3 w-3 text-purple-400 animate-spin" />
                              <span className="text-xs text-purple-400 font-medium">
                                Tuning your voice to hypnotic pitch...
                              </span>
                            </div>
                          )}

                          {hasRecording && !isRecordingThis && rec && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge
                                variant="secondary"
                                className="text-xs gap-1 no-default-hover-elevate no-default-active-elevate"
                              >
                                <CheckCircle className="h-3 w-3" />
                                {rec.duration.toFixed(1)}s
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => handlePlayRecording(aff.id)}
                                data-testid={`button-play-recording-${i}`}
                              >
                                {isPlayingThis ? (
                                  <>
                                    <Square className="mr-1 h-3 w-3" />
                                    Stop
                                  </>
                                ) : (
                                  <>
                                    <Play className="mr-1 h-3 w-3" />
                                    Play
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() =>
                                  handlePlayRecording(aff.id, false)
                                }
                                data-testid={`button-play-original-${i}`}
                              >
                                <Volume2 className="mr-1 h-3 w-3" />
                                Original
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-muted-foreground"
                                onClick={() => handleDeleteRecording(aff.id)}
                                data-testid={`button-rerecord-${i}`}
                              >
                                <RotateCcw className="mr-1 h-3 w-3" />
                                Re-record
                              </Button>
                            </div>
                          )}
                        </div>

                        <div className="shrink-0">
                          {isRecordingThis ? (
                            <Button
                              size="icon"
                              variant="destructive"
                              className="h-10 w-10 rounded-full"
                              onClick={() => handleStopRecordingFor(aff.id)}
                              data-testid={`button-stop-recording-${i}`}
                            >
                              <Square className="h-4 w-4" />
                            </Button>
                          ) : isProcessingThis ? (
                            <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                              <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
                            </div>
                          ) : hasRecording ? (
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-10 w-10 rounded-full border-green-500/30 text-green-500"
                              onClick={() => handleDeleteRecording(aff.id)}
                              disabled={!!recordingAffId}
                              data-testid={`button-recorded-${i}`}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="icon"
                              className="h-10 w-10 rounded-full"
                              onClick={() => handleStartRecordingFor(aff.id)}
                              disabled={!!recordingAffId || !!processingAffId}
                              data-testid={`button-record-${i}`}
                            >
                              <Mic className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <Card className="p-5 space-y-4 sticky top-20">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    Voice Processing
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your recordings are automatically processed to the ideal
                    hypnotic pitch and tonality. This deepens and warms your
                    voice, adding subtle resonance that helps bypass the
                    conscious mind's resistance — making your subconscious more
                    receptive to the affirmation message.
                  </p>
                  <div className="bg-purple-500/5 border border-purple-500/10 rounded-lg p-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="h-3 w-3 text-purple-400 shrink-0" />
                      <span>Pitch lowered to trance-inducing frequency</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="h-3 w-3 text-purple-400 shrink-0" />
                      <span>Warm bass enhancement for depth</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="h-3 w-3 text-purple-400 shrink-0" />
                      <span>Subtle reverb for hypnotic quality</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="h-3 w-3 text-purple-400 shrink-0" />
                      <span>Dynamic compression for smooth delivery</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Waves className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        Theta Binaural Beat
                      </span>
                    </div>
                    <Badge
                      variant="secondary"
                      className="font-mono text-xs no-default-hover-elevate no-default-active-elevate"
                    >
                      {kit.frequencyHz} Hz
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setFrequencyMuted(!frequencyMuted)}
                      data-testid="button-mute-frequency"
                    >
                      {frequencyMuted ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                    <Slider
                      value={[frequencyVolume * 100]}
                      onValueChange={([v]) => setFrequencyVolume(v / 100)}
                      max={100}
                      step={1}
                      className="flex-1"
                      data-testid="slider-freq-volume"
                    />
                    <Button
                      variant={frequency.isPlaying ? "default" : "outline"}
                      size="sm"
                      className="h-8"
                      onClick={toggleFrequencyPreview}
                      data-testid="button-freq-toggle"
                    >
                      {frequency.isPlaying ? (
                        <>
                          <Pause className="mr-1 h-3 w-3" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Play className="mr-1 h-3 w-3" />
                          Listen
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Music className="h-4 w-4 text-amber-400" />
                      <span className="text-sm font-medium">Your Song</span>
                    </div>
                    {!uploadedSong ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 border-amber-500/20"
                        onClick={() => songFileInputRef.current?.click()}
                        data-testid="button-upload-song"
                      >
                        <Upload className="mr-1 h-3 w-3 text-amber-400" />
                        Upload
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleRemoveSong}
                        data-testid="button-remove-song"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {uploadedSong ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-amber-500/10 rounded-md p-2">
                        <Headphones className="h-3 w-3 shrink-0 text-amber-400" />
                        <span className="truncate">{uploadedSong.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setSongMuted(!songMuted)}
                          data-testid="button-mute-song"
                        >
                          {songMuted ? (
                            <VolumeX className="h-3.5 w-3.5" />
                          ) : (
                            <Volume2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Slider
                          value={[songVolume * 100]}
                          onValueChange={([v]) => setSongVolume(v / 100)}
                          max={100}
                          step={1}
                          className="flex-1"
                          data-testid="slider-song-volume"
                        />
                      </div>
                      <p className="text-xs text-amber-400/70">
                        Plays in the forefront; auto-lowers for affirmations.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Add a song you love! It plays in the forefront of your
                        vision movie while the healing frequency works
                        subliminally underneath.
                      </p>
                    </div>
                  )}
                </div>

                {allRecorded && (
                  <div className="border-t pt-4">
                    <div className="text-center space-y-4">
                      <div className="relative mx-auto w-14 h-14">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-500/20 via-purple-500/20 to-pink-500/20 animate-pulse" />
                        <div className="relative flex items-center justify-center h-full">
                          <Film className="h-7 w-7 text-purple-400" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-serif font-bold text-base">
                          All Pieces Ready
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {selectedVisualIds.size} visuals, {totalAffirmations}{" "}
                          recorded affirmations
                          {uploadedSong ? `, and "${uploadedSong.name}"` : ""} —
                          ready to be woven into your personalized vision movie.
                        </p>
                      </div>
                      <Button
                        onClick={startAssembly}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/20"
                        size="lg"
                        data-testid="button-complete-movie"
                      >
                        <Sparkles className="mr-2 h-5 w-5" />
                        Complete My Movie
                      </Button>
                      <p className="text-[11px] text-muted-foreground/70">
                        This will assemble all your choices into a seamless,
                        entrancing experience
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}

      {mode === "assembling" && (
        <div className="flex-1 relative overflow-hidden">
          {selectedVisuals.length > 0 && (
            <img
              src={selectedVisuals[0]?.imageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover blur-sm scale-105"
            />
          )}
          <div className="absolute inset-0 bg-black/80" />

          <div className="relative flex flex-col items-center justify-center h-full min-h-[70vh] px-4">
            <div className="premium-border rounded-2xl max-w-lg w-full">
              <Card className="bg-black/60 backdrop-blur-xl border-0 rounded-2xl p-8">
                <div className="text-center space-y-8">
                  <div className="relative mx-auto w-20 h-20">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/30 via-amber-500/20 to-pink-500/30 animate-pulse" />
                    <div
                      className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 animate-spin"
                      style={{ animationDuration: "3s" }}
                    />
                    <div className="relative flex items-center justify-center h-full">
                      <Film className="h-10 w-10 text-purple-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2
                      className="font-serif text-2xl sm:text-3xl font-bold text-white"
                      data-testid="text-assembling-title"
                    >
                      Assembling Your Vision Movie
                    </h2>
                    <p className="text-sm text-white/60">
                      Weaving your personal choices into a seamless, entrancing
                      experience
                    </p>
                  </div>

                  <div className="space-y-3 max-w-sm mx-auto">
                    <Progress value={assemblyProgress} className="h-2" />
                    <p
                      className="text-sm text-white/80 font-medium"
                      data-testid="text-assembly-step"
                    >
                      {assemblyStep}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 max-w-xs mx-auto">
                    <div className="text-center space-y-1">
                      <Image className="h-5 w-5 text-purple-400 mx-auto" />
                      <p className="text-xs text-white/50">
                        {selectedVisualIds.size} Visuals
                      </p>
                    </div>
                    <div className="text-center space-y-1">
                      <Mic className="h-5 w-5 text-pink-400 mx-auto" />
                      <p className="text-xs text-white/50">
                        {totalAffirmations} Voices
                      </p>
                    </div>
                    <div className="text-center space-y-1">
                      <Waves className="h-5 w-5 text-amber-400 mx-auto" />
                      <p className="text-xs text-white/50">{kit.frequencyHz} Hz</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {mode === "preparation" && (
        <div className="flex-1 relative overflow-hidden">
          {selectedVisuals.length > 0 && (
            <img
              src={selectedVisuals[0]?.imageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover blur-md scale-105"
            />
          )}
          <div className="absolute inset-0 bg-black/85" />

          <div className="absolute top-4 right-4 z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={skipPreparation}
              className="text-white/50 hover:text-white hover:bg-white/10"
              data-testid="button-skip-preparation"
            >
              <SkipForward className="mr-1.5 h-3.5 w-3.5" />
              Skip to Movie
            </Button>
          </div>

          <div className="relative flex flex-col items-center justify-center h-full min-h-[70vh] px-4">
            <div className="text-center space-y-8 max-w-xl w-full">
              <div className="flex items-center justify-center gap-2 mb-2">
                {[0, 1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      s <= prepStep ? "bg-purple-400 w-10" : "bg-white/20 w-6"
                    }`}
                  />
                ))}
              </div>

              {prepStep === 0 && (
                <div
                  className="space-y-8 animate-in fade-in duration-700"
                  data-testid="prep-vagus-nerve"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2">
                      <Heart className="h-6 w-6 text-rose-400" />
                    </div>
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                      Vagus Nerve Reset
                    </h2>
                    <p className="text-sm text-white/60 max-w-md mx-auto">
                      Activating your vagus nerve switches your nervous system
                      from fight-or-flight to rest-and-receive — the ideal state
                      for subconscious reprogramming.
                    </p>
                  </div>

                  <div className="space-y-4 text-left max-w-md mx-auto">
                    {vagusNerveExercises.map((ex, i) => (
                      <Card
                        key={i}
                        className="bg-white/5 border-white/10 p-4 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold">
                            {i + 1}
                          </span>
                          <h4 className="text-sm font-semibold text-white">
                            {ex.title}
                          </h4>
                        </div>
                        <p className="text-xs text-white/60 leading-relaxed pl-8">
                          {ex.instruction}
                        </p>
                      </Card>
                    ))}
                  </div>

                  <Button
                    onClick={startBreathingExercise}
                    className="bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-700 hover:to-purple-700 text-white"
                    size="lg"
                    data-testid="button-vagus-ready"
                  >
                    <ChevronRight className="mr-2 h-5 w-5" />
                    I'm Ready — Begin Breathing
                  </Button>
                </div>
              )}

              {prepStep === 1 && (
                <div
                  className="space-y-8 animate-in fade-in duration-700"
                  data-testid="prep-breathing"
                >
                  <div className="space-y-2">
                    <Wind className="h-6 w-6 text-sky-400 mx-auto" />
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                      7-4-7 Breathing
                    </h2>
                    <p className="text-sm text-white/60">
                      Cycle {breathCycle} of 3
                    </p>
                  </div>

                  <div className="relative flex items-center justify-center">
                    <div
                      className="rounded-full border-2 flex items-center justify-center transition-all duration-1000 ease-in-out"
                      style={{
                        width:
                          breathPhase === "inhale"
                            ? "200px"
                            : breathPhase === "hold"
                              ? "200px"
                              : "120px",
                        height:
                          breathPhase === "inhale"
                            ? "200px"
                            : breathPhase === "hold"
                              ? "200px"
                              : "120px",
                        borderColor:
                          breathPhase === "inhale"
                            ? "rgba(56, 189, 248, 0.5)"
                            : breathPhase === "hold"
                              ? "rgba(168, 85, 247, 0.5)"
                              : "rgba(52, 211, 153, 0.5)",
                        backgroundColor:
                          breathPhase === "inhale"
                            ? "rgba(56, 189, 248, 0.08)"
                            : breathPhase === "hold"
                              ? "rgba(168, 85, 247, 0.08)"
                              : "rgba(52, 211, 153, 0.08)",
                      }}
                    >
                      <div className="text-center">
                        <p className="text-4xl font-bold text-white font-mono">
                          {breathTimer}
                        </p>
                        <p
                          className={`text-sm font-semibold mt-1 ${
                            breathPhase === "inhale"
                              ? "text-sky-400"
                              : breathPhase === "hold"
                                ? "text-purple-400"
                                : "text-emerald-400"
                          }`}
                        >
                          {breathPhase === "inhale"
                            ? "Breathe In"
                            : breathPhase === "hold"
                              ? "Hold"
                              : "Breathe Out"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-white/40">
                    {breathPhase === "inhale"
                      ? "Inhale slowly through your nose... fill your lungs completely"
                      : breathPhase === "hold"
                        ? "Hold gently... feel the stillness within"
                        : "Exhale slowly through your mouth... release everything"}
                  </p>
                </div>
              )}

              {prepStep === 2 && (
                <div
                  className="space-y-8 animate-in fade-in duration-700"
                  data-testid="prep-relaxation"
                >
                  <div className="space-y-2">
                    <Sparkles className="h-6 w-6 text-purple-400 mx-auto" />
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                      Silva Deep Relaxation
                    </h2>
                    <p className="text-sm text-white/60">
                      Progressive body relaxation — theta frequency now active
                    </p>
                  </div>

                  <div className="relative max-w-md mx-auto">
                    <div className="h-1 bg-white/10 rounded-full mb-6">
                      <div
                        className="h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000"
                        style={{
                          width: `${((relaxationIndex + 1) / relaxationBodyParts.length) * 100}%`,
                        }}
                      />
                    </div>
                    <p
                      className="text-lg text-white/90 font-serif italic leading-relaxed min-h-[80px]"
                      data-testid="text-relaxation"
                    >
                      {relaxationBodyParts[relaxationIndex]}
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-xs text-white/40">
                    <Waves className="h-3 w-3" />
                    <span>{kit.frequencyHz} Hz Solfeggio + Theta active</span>
                  </div>
                </div>
              )}

              {prepStep === 3 && (
                <div
                  className="space-y-8 animate-in fade-in duration-700"
                  data-testid="prep-countdown"
                >
                  <div className="space-y-2">
                    <h2 className="font-serif text-xl text-white/60">
                      Entering Theta State
                    </h2>
                  </div>

                  <div className="relative flex items-center justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/20 to-amber-500/20 animate-pulse blur-xl scale-150" />
                      <div className="relative w-40 h-40 rounded-full bg-gradient-to-br from-purple-500/10 to-amber-500/10 border border-white/10 flex items-center justify-center">
                        <span
                          className="text-7xl font-bold text-white font-mono"
                          data-testid="text-countdown-number"
                        >
                          {countdownNumber}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p
                    className="text-base text-white/80 font-serif italic leading-relaxed max-w-md mx-auto min-h-[60px]"
                    data-testid="text-countdown-story"
                  >
                    {countdownText}
                  </p>

                  <div className="flex items-center justify-center gap-2 text-xs text-white/40">
                    <Waves className="h-3 w-3" />
                    <span>Theta binaural beats guiding you deeper...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {mode === "complete" && !isPlayingBack && (
        <div className="flex-1 relative overflow-hidden">
          {selectedVisuals.length > 0 && (
            <img
              src={selectedVisuals[0]?.imageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover blur-sm"
            />
          )}
          <div className="absolute inset-0 bg-black/75" />

          <div className="relative flex flex-col items-center justify-center h-full min-h-[70vh] px-4">
            <div className="text-center space-y-8 max-w-lg">
              <div className="relative mx-auto w-20 h-20">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-500/20 via-purple-500/20 to-amber-500/20" />
                <div className="relative flex items-center justify-center h-full">
                  <CheckCircle className="h-12 w-12 text-green-400" />
                </div>
              </div>

              <div className="space-y-3">
                <h2
                  className="font-serif text-2xl sm:text-3xl font-bold text-white"
                  data-testid="text-complete-title"
                >
                  Session Complete
                </h2>
                <p className="text-base text-white/70 leading-relaxed max-w-md mx-auto">
                  Beautiful work. Every time you watch your vision movie, you're
                  retraining your subconscious mind to align with your deepest
                  goals.
                </p>
              </div>

              <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6 text-left space-y-4">
                <h3 className="font-serif font-bold text-white text-center">
                  For Best Results
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
                      <Sun className="h-4 w-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        Morning — Right After Waking
                      </p>
                      <p className="text-xs text-white/50">
                        Your subconscious is most receptive in the first minutes
                        after sleep. Watch your movie before checking your phone
                        or starting your day.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/20">
                      <Moon className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        Night — Just Before Sleep
                      </p>
                      <p className="text-xs text-white/50">
                        As you drift off, your brain naturally enters theta
                        state. Your vision movie's affirmations become the last
                        thoughts your subconscious processes.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/20">
                      <RefreshCw className="h-4 w-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        Consistency Is Everything
                      </p>
                      <p className="text-xs text-white/50">
                        Daily repetition rewires neural pathways. Most users
                        report noticeable shifts in beliefs and behavior within
                        21 days of consistent use.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {!hasUnlockedReplay ? (
                <div className="premium-border rounded-xl">
                  <Card className="bg-black/70 backdrop-blur-xl border-0 rounded-xl p-6 space-y-5">
                    <div className="flex items-center justify-center gap-2">
                      <Crown className="h-6 w-6 text-amber-400" />
                      <h3 className="font-serif font-bold text-lg text-white">
                        Unlock Unlimited Replays
                      </h3>
                    </div>
                    <p className="text-sm text-white/60 leading-relaxed text-center">
                      Purchase this kit to save your personalized vision movie,
                      replay it anytime, and access all {totalAffirmations}{" "}
                      affirmations with your custom voice recordings.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs text-white/40">
                      <Lock className="h-3 w-3" />
                      <span>Secure checkout via Stripe</span>
                    </div>
                    <Button
                      onClick={handleUnlockReplay}
                      disabled={isCheckingOut}
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold shadow-lg shadow-amber-500/25"
                      size="lg"
                      data-testid="button-unlock-replay"
                    >
                      {isCheckingOut ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <CreditCard className="mr-2 h-5 w-5" />
                      )}
                      Save & Unlock — ${((kit.price || 2997) / 100).toFixed(2)}
                    </Button>
                    <button
                      onClick={() => setHasUnlockedReplay(true)}
                      className="block mx-auto text-xs text-white/30 hover:text-white/50 transition-colors"
                      data-testid="button-skip-purchase"
                    >
                      Continue without saving
                    </button>
                  </Card>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
                  <Button
                    onClick={startAssembly}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/20"
                    size="lg"
                    data-testid="button-replay-movie"
                  >
                    <Play className="mr-2 h-5 w-5" />
                    Play Again
                  </Button>
                  <Link href="/kits">
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-white/20 text-white hover:bg-white/10"
                      data-testid="button-browse-kits"
                    >
                      Browse More Kits
                    </Button>
                  </Link>
                </div>
              )}

              <p className="text-xs text-white/40 max-w-sm mx-auto">
                Use headphones for the full theta binaural beat effect. The{" "}
                {kit.frequencyHz} Hz Solfeggio frequency works best when heard
                through stereo audio.
              </p>
            </div>
          </div>
        </div>
      )}

      {(mode === "playback" || isPlayingBack) && (
        <div className="flex-1 relative overflow-hidden">
          {selectedVisuals.length > 0 ? (
            <>
              <img
                src={selectedVisuals[previousVisualIndex]?.imageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                style={{ opacity: 0, transition: "opacity 2s ease-in-out" }}
                key={`prev-${previousVisualIndex}`}
              />
              <img
                src={selectedVisuals[currentVisualIndex]?.imageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                style={{ opacity: 1, transition: "opacity 2s ease-in-out" }}
                key={`curr-${currentVisualIndex}`}
              />
            </>
          ) : (
            <img
              src={kit.thumbnailUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black/60" />

          <div className="relative flex flex-col items-center justify-center h-full min-h-[60vh] px-4">
            <div className="text-center space-y-6 max-w-2xl">
              <p
                className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white leading-tight drop-shadow-lg"
                data-testid="text-playback-affirmation"
              >
                {currentAffirmation?.text}
              </p>
              <div className="flex items-center gap-1 justify-center">
                <span className="font-mono text-sm text-white/70">
                  {currentPlaybackIndex + 1} / {totalAffirmations}
                </span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
            <div className="mx-auto max-w-2xl space-y-3">
              <Progress value={playbackProgress} className="h-1.5" />
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <span className="font-mono text-xs text-white/70">
                  {formatTime(playbackElapsed)} /{" "}
                  {formatTime(kit.duration * 60)}
                </span>
                <div className="flex items-center gap-3 flex-wrap">
                  {uploadedSong && (
                    <div className="flex items-center gap-1.5">
                      <Music className="h-3.5 w-3.5 text-white/60" />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSongMuted(!songMuted)}
                        className="text-white"
                        data-testid="button-playback-song-mute"
                      >
                        {songMuted ? (
                          <VolumeX className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </Button>
                      <Slider
                        value={[songVolume * 100]}
                        onValueChange={([v]) => setSongVolume(v / 100)}
                        max={100}
                        step={1}
                        className="w-20"
                        data-testid="slider-playback-song-volume"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Waves className="h-3.5 w-3.5 text-white/60" />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setFrequencyMuted(!frequencyMuted)}
                      className="text-white"
                      data-testid="button-playback-mute"
                    >
                      {frequencyMuted ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                    <Slider
                      value={[frequencyVolume * 100]}
                      onValueChange={([v]) => setFrequencyVolume(v / 100)}
                      max={100}
                      step={1}
                      className="w-20"
                      data-testid="slider-frequency-volume"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={stopPlayback}
                    data-testid="button-stop-playback"
                  >
                    <Square className="mr-1.5 h-3.5 w-3.5" />
                    Stop
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
