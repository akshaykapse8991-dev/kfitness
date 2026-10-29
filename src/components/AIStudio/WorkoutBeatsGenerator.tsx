import React, { useState, useRef, useEffect } from 'react';
import {
  Music,
  Play,
  Square,
  Volume2,
  Sparkles,
  Zap,
  Flame,
  Radio,
  Sliders,
  Download,
  AlertCircle,
  Activity,
  Headphones,
} from 'lucide-react';

const GENRES = [
  { id: 'Synthwave', name: 'Cyberpunk Synthwave', description: 'Driving arpeggios, neon synth leads & punchy 808' },
  { id: 'Hardstyle', name: 'Hardstyle & Phonk', description: 'Distorted heavy kick drums & aggressive energy' },
  { id: 'Metal', name: 'Industrial Metal & Rock', description: 'Crunchy guitar distortion & fast double-bass drums' },
  { id: 'BassTrap', name: 'High-Octane Dhol & Bass Trap', description: 'Desi power beats with booming 808 sub-bass' },
  { id: 'LoFi', name: 'Ambient Lo-Fi Cool-down', description: 'Relaxed groove, warm Rhodes chords & soft vinyl tape' },
];

const TEMPO_PRESETS = [
  { label: 'Cool-down / Yoga', bpm: 95 },
  { label: 'Warm-Up', bpm: 115 },
  { label: 'HIIT & Cardio', bpm: 135 },
  { label: 'Heavy PR Lifting', bpm: 152 },
];

export const WorkoutBeatsGenerator: React.FC = () => {
  const [selectedGenre, setSelectedGenre] = useState(GENRES[0].id);
  const [bpm, setBpm] = useState(135);
  const [modelType, setModelType] = useState<'lyria-3-clip-preview' | 'lyria-3-pro-preview'>('lyria-3-clip-preview');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  // Web Audio synth synthesizer state
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthTimerRef = useRef<number | null>(null);
  const stepRef = useRef<number>(0);

  // Stop active synthesis / playback
  const stopAudio = () => {
    if (synthTimerRef.current) {
      clearInterval(synthTimerRef.current);
      synthTimerRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setIsPlaying(false);
    setActiveStep(0);
  };

  // Real Web Audio Synthesizer Beat Engine (Plays high-energy energetic workout rhythm)
  const playSynthesizedWorkoutBeat = () => {
    stopAudio();

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const intervalMs = (60 / bpm / 4) * 1000; // 16th note subdivision
      let step = 0;
      setIsPlaying(true);

      const triggerKick = (time: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, time);
        osc.frequency.exponentialRampToValueAtTime(35, time + 0.18);
        gain.gain.setValueAtTime(1, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.22);
      };

      const triggerSnare = (time: number) => {
        // Noise buffer for snare snap
        const bufferSize = ctx.sampleRate * 0.15;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1000, time);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.6, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(time);
      };

      const triggerHiHat = (time: number, isAccent: boolean) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(8000, time);
        gain.gain.setValueAtTime(isAccent ? 0.3 : 0.12, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.05);
      };

      const triggerBassSynth = (time: number, freq: number) => {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        osc.type = selectedGenre === 'Hardstyle' ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq, time);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, time);
        gain.gain.setValueAtTime(0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.2);
      };

      synthTimerRef.current = window.setInterval(() => {
        const now = ctx.currentTime;
        const beatStep = step % 16;
        stepRef.current = beatStep;
        setActiveStep(beatStep);

        // Kick drum on 1, 5, 9, 13 (four on floor)
        if (beatStep === 0 || beatStep === 4 || beatStep === 8 || beatStep === 12) {
          triggerKick(now);
        }

        // Snare / Clap on 4 and 12
        if (beatStep === 4 || beatStep === 12) {
          triggerSnare(now);
        }

        // Hi-hat on 8th notes
        if (beatStep % 2 === 0) {
          triggerHiHat(now, beatStep % 4 === 2);
        }

        // Driving bassline sequence
        if (beatStep === 0 || beatStep === 2 || beatStep === 6 || beatStep === 8 || beatStep === 10 || beatStep === 14) {
          const baseFreq = selectedGenre === 'BassTrap' ? 48 : 55;
          const noteFreq = beatStep > 8 ? baseFreq * 1.25 : baseFreq;
          triggerBassSynth(now, noteFreq);
        }

        step++;
      }, intervalMs);
    } catch (e) {
      console.error('Web Audio Synth failed:', e);
      setIsPlaying(false);
    }
  };

  const handleGenerateBeats = async () => {
    setIsGenerating(true);
    setNotice(null);

    try {
      const res = await fetch('/api/ai/generate-beats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelType,
          duration: modelType === 'lyria-3-pro-preview' ? 'pro' : 'clip',
          bpm,
          genre: selectedGenre,
          prompt: customPrompt || undefined,
        }),
      });

      const data = await res.json();

      if (data.success && data.audioBase64) {
        // Lyria audio returned
        const audioSrc = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
        setAudioUrl(audioSrc);
        setNotice(`✅ Workout beat rendered with ${data.modelUsed || modelType}! Tap Play to train.`);
      } else {
        // Fallback or paid tier note
        setNotice(`🎧 Running high-energy dynamic workout beat engine (${bpm} BPM ${selectedGenre}). Ready to pump!`);
        playSynthesizedWorkoutBeat();
      }
    } catch (err: any) {
      console.warn('Lyria API error, falling back to Web Audio synth:', err);
      setNotice(`🎧 Running high-energy workout synthesizer at ${bpm} BPM.`);
      playSynthesizedWorkoutBeat();
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  return (
    <div className="flex flex-col bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl p-6 gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
              <Music className="w-5 h-5 text-emerald-400" />
              Workout Beats Generator
            </h2>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Lyria Clip & Pro
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic high-BPM motivational soundtracks tailored for heavy lifting, sprinting, and workout intensity.
          </p>
        </div>

        {/* Model selection */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400">Model:</span>
          <select
            value={modelType}
            onChange={(e) => setModelType(e.target.value as any)}
            className="bg-transparent text-xs text-emerald-300 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="lyria-3-clip-preview" className="bg-slate-900 text-slate-200">
              lyria-3-clip-preview (30s Workout Clip)
            </option>
            <option value="lyria-3-pro-preview" className="bg-slate-900 text-slate-200">
              lyria-3-pro-preview (Full Length Track)
            </option>
          </select>
        </div>
      </div>

      {/* Genre Grid */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 block">
          Select Workout Soundstyle:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {GENRES.map((g) => {
            const isSelected = selectedGenre === g.id;
            return (
              <button
                key={g.id}
                onClick={() => setSelectedGenre(g.id)}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  isSelected
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-bold text-sm text-slate-200">{g.name}</span>
                  {isSelected && <Zap className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">{g.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* BPM Controls */}
      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Tempo (BPM): <span className="text-emerald-400 text-sm font-mono">{bpm}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {TEMPO_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => setBpm(preset.bpm)}
                className={`px-2 py-1 rounded text-[10px] font-semibold transition ${
                  bpm === preset.bpm
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {preset.label} ({preset.bpm})
              </button>
            ))}
          </div>
        </div>

        <input
          type="range"
          min="85"
          max="175"
          step="1"
          value={bpm}
          onChange={(e) => setBpm(parseInt(e.target.value, 10))}
          className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
        />
      </div>

      {/* Custom prompt input */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">
          Custom Music Direction (Optional):
        </label>
        <input
          type="text"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="e.g. Heavy aggressive drop with siren buildup for final deadlift set..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
        />
      </div>

      {/* Beat Stage & Step Visualizer */}
      <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center gap-4 relative overflow-hidden">
        {/* 16-step visualizer LEDs */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 w-full max-w-lg justify-center">
          {Array.from({ length: 16 }).map((_, i) => {
            const isCurrent = activeStep === i && isPlaying;
            const isQuarter = i % 4 === 0;
            return (
              <div
                key={i}
                className={`flex-1 h-6 rounded-md transition-all ${
                  isCurrent
                    ? 'bg-emerald-400 scale-110 shadow-lg shadow-emerald-400/50'
                    : isQuarter
                    ? 'bg-slate-700/80'
                    : 'bg-slate-850'
                }`}
              />
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 mt-2">
          {!isPlaying ? (
            <button
              onClick={handleGenerateBeats}
              disabled={isGenerating}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition"
            >
              {isGenerating ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing Workout Beats...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Generate & Play Beat</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={stopAudio}
              className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-red-500/25 transition"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Stop Beat</span>
            </button>
          )}

          <button
            onClick={playSynthesizedWorkoutBeat}
            className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-semibold flex items-center gap-2 transition"
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Instant Beat Synth</span>
          </button>
        </div>

        {notice && (
          <p className="text-xs text-emerald-400/90 font-medium mt-1 text-center">
            {notice}
          </p>
        )}

        {audioUrl && (
          <div className="w-full max-w-md mt-2 flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
            <audio src={audioUrl} controls className="w-full h-8" />
          </div>
        )}
      </div>
    </div>
  );
};
