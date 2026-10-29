import React, { useState, useEffect, useRef } from 'react';
import {
  Music,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Zap,
  Activity,
  Flame,
  Radio,
  Sliders,
  Disc,
} from 'lucide-react';

interface BeatTrack {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  genre: string;
  intensity: 'low' | 'medium' | 'high' | 'peak';
  durationSec: number;
}

const BEATMATCH_PRESETS = [
  {
    id: 'hiit_heavy',
    label: 'High-Intensity & Heavy PRs',
    bpm: 140,
    genre: 'Cyberpunk Electro & Hardstyle',
    intensity: 'peak' as const,
    color: '#ef4444',
    description: '140 BPM driving 808 percussion to maximize CNS arousal for top sets and heavy singles.',
  },
  {
    id: 'hypertrophy',
    label: 'Hypertrophy & Pump',
    bpm: 128,
    genre: 'Bass House & Synthwave',
    intensity: 'high' as const,
    color: '#f59e0b',
    description: '128 BPM rhythmic cadence ideal for 8-12 rep hypertrophy time-under-tension.',
  },
  {
    id: 'zone2',
    label: 'Zone 2 Steady State Cardio',
    bpm: 120,
    genre: 'Melodic Deep House',
    intensity: 'medium' as const,
    color: '#10b981',
    description: '120 BPM metronomic pacing for steady treadmill, elliptical, or outdoor jogging.',
  },
  {
    id: 'yoga_mobility',
    label: 'Yoga, Mobility & Breathwork',
    bpm: 90,
    genre: 'Ambient Lofi & Chillstep',
    intensity: 'low' as const,
    color: '#8b5cf6',
    description: '90 BPM relaxing cadence designed to lower cortisol and deepen diaphragmatic breathing.',
  },
  {
    id: 'sprints',
    label: 'Sprint Intervals & Tabata',
    bpm: 170,
    genre: 'Fast Drum & Bass',
    intensity: 'peak' as const,
    color: '#ec4899',
    description: '170 BPM high-turnover cadence for max-effort all-out sprints and Tabata burnouts.',
  },
];

export const BeatMatchPlayer: React.FC = () => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('hiit_heavy');
  const [activeBpm, setActiveBpm] = useState<number>(140);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.75);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [pulseBeat, setPulseBeat] = useState<boolean>(false);

  const activePreset = BEATMATCH_PRESETS.find((p) => p.id === selectedPresetId) || BEATMATCH_PRESETS[0];

  // Generated tempo playlist
  const [playlist, setPlaylist] = useState<BeatTrack[]>([
    {
      id: 't1',
      title: 'Neon PR Overdrive',
      artist: 'AI BeatMatch • Kapse Audio',
      bpm: 140,
      genre: 'Cyberpunk Electro',
      intensity: 'peak',
      durationSec: 180,
    },
    {
      id: 't2',
      title: 'Titanium Anvil Drop',
      artist: 'AI BeatMatch • Kapse Audio',
      bpm: 140,
      genre: 'Hardstyle Synth',
      intensity: 'peak',
      durationSec: 210,
    },
    {
      id: 't3',
      title: 'Dopamine Surge 140',
      artist: 'AI BeatMatch • Kapse Audio',
      bpm: 140,
      genre: 'Industrial Bass',
      intensity: 'high',
      durationSec: 195,
    },
  ]);

  // Audio Context Ref for Real-time Web Audio Synthesizer
  const audioCtxRef = useRef<AudioContext | null>(null);
  const beatIntervalRef = useRef<any>(null);

  // Initialize and play rhythmic synth beat at exact BPM
  const playSynthesizedBeat = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const effectiveVol = isMuted ? 0 : volume;

      // 1. Kick drum (deep punch 120Hz -> 40Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.12);
      gain.gain.setValueAtTime(0.8 * effectiveVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);

      // 2. High-hat / snap accent
      const noise = ctx.createOscillator();
      const noiseGain = ctx.createGain();
      noise.type = 'triangle';
      noise.frequency.setValueAtTime(1200, now);
      noiseGain.gain.setValueAtTime(0.18 * effectiveVol, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      noise.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.05);
    } catch (e) {
      console.warn('Synth error', e);
    }
  };

  // Metronome beat loop according to active BPM
  useEffect(() => {
    if (isPlaying) {
      const beatIntervalMs = (60 / activeBpm) * 1000;
      playSynthesizedBeat();
      setPulseBeat(true);
      setTimeout(() => setPulseBeat(false), 120);

      beatIntervalRef.current = setInterval(() => {
        playSynthesizedBeat();
        setPulseBeat(true);
        setTimeout(() => setPulseBeat(false), 120);
      }, beatIntervalMs);
    } else {
      if (beatIntervalRef.current) clearInterval(beatIntervalRef.current);
    }
    return () => {
      if (beatIntervalRef.current) clearInterval(beatIntervalRef.current);
    };
  }, [isPlaying, activeBpm, volume, isMuted]);

  const handleSelectPreset = (preset: typeof BEATMATCH_PRESETS[0]) => {
    setSelectedPresetId(preset.id);
    setActiveBpm(preset.bpm);
    // Regenerate playlist for new tempo
    setPlaylist([
      {
        id: `t1-${preset.bpm}`,
        title: `${preset.label.split('&')[0].trim()} Pulse`,
        artist: 'AI BeatMatch Engine',
        bpm: preset.bpm,
        genre: preset.genre,
        intensity: preset.intensity,
        durationSec: 180,
      },
      {
        id: `t2-${preset.bpm}`,
        title: `Cadence Synchronizer ${preset.bpm}`,
        artist: 'AI BeatMatch Engine',
        bpm: preset.bpm,
        genre: preset.genre,
        intensity: preset.intensity,
        durationSec: 215,
      },
      {
        id: `t3-${preset.bpm}`,
        title: `Flow State Metronome`,
        artist: 'AI BeatMatch Engine',
        bpm: preset.bpm,
        genre: preset.genre,
        intensity: preset.intensity,
        durationSec: 240,
      },
    ]);
    setCurrentTrackIndex(0);
  };

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
  };

  const currentTrack = playlist[currentTrackIndex] || playlist[0];

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Acoustic Biomechanics
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              Tempo Synchronization
            </span>
          </div>
          <h2 className="text-xl font-black text-white mt-1 flex items-center gap-2">
            <Music className="w-5 h-5 text-rose-400" />
            AI BeatMatch — Workout Tempo Playlist
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
            Synchronize your lifting tempo or cardio cadence to target BPM beats. Increases motor unit recruitment during heavy sets and optimizes breathing cadence during recovery.
          </p>
        </div>

        {/* Live Audio Controls */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer border border-slate-700"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              setIsMuted(false);
            }}
            className="w-20 accent-rose-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Preset Tempo Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {BEATMATCH_PRESETS.map((p) => {
          const isSelected = selectedPresetId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => handleSelectPreset(p)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'bg-rose-500/15 border-rose-500/50 text-white shadow-lg'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-white">{p.bpm} BPM</span>
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
              </div>
              <p className="text-xs font-bold mt-1 text-slate-200 line-clamp-1">{p.label}</p>
              <span className="text-[10px] text-slate-400 block mt-0.5 truncate">{p.genre}</span>
            </button>
          );
        })}
      </div>

      {/* Interactive Music Player Card */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            {/* Spinning Disc / Beat Pulse Visualizer */}
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-100 ${
                pulseBeat && isPlaying
                  ? 'bg-rose-500 text-slate-950 shadow-xl shadow-rose-500/50 scale-105'
                  : 'bg-slate-900 border border-slate-800 text-rose-400'
              }`}
            >
              <Disc className={`w-8 h-8 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: `${60 / activeBpm * 2}s` }} />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                Playing at {activeBpm} BPM
              </span>
              <h3 className="text-xl font-black text-white mt-1">
                {currentTrack.title}
              </h3>
              <p className="text-xs text-slate-400">
                {currentTrack.artist} • {activePreset.genre}
              </p>
            </div>
          </div>

          {/* Master Player Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleTogglePlay}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-slate-950 transition-all shadow-xl cursor-pointer ${
                isPlaying
                  ? 'bg-rose-500 hover:bg-rose-400 shadow-rose-500/30'
                  : 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/30'
              }`}
              title={isPlaying ? 'Pause Beats' : 'Start BeatMatch'}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-slate-950" />
              ) : (
                <Play className="w-6 h-6 fill-slate-950 ml-1" />
              )}
            </button>

            <button
              onClick={handleNextTrack}
              className="w-11 h-11 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center border border-slate-800 transition-all cursor-pointer"
              title="Next Tempo Track"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BPM Slider Control */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-rose-400" />
              Adjust Tempo Frequency
            </span>
            <span className="text-rose-400 font-black font-mono text-sm">{activeBpm} BPM</span>
          </div>
          <input
            type="range"
            min="70"
            max="180"
            value={activeBpm}
            onChange={(e) => setActiveBpm(parseInt(e.target.value, 10))}
            className="w-full accent-rose-500 cursor-pointer"
          />
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>70 BPM (Slow Yin)</span>
            <span>120 BPM (Cardio)</span>
            <span>140 BPM (PR Strength)</span>
            <span>180 BPM (Max Sprint)</span>
          </div>
        </div>

        {/* Playlist Tracks Queue */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Generated Tempo Playlist Queue:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {playlist.map((track, idx) => (
              <div
                key={track.id}
                onClick={() => setCurrentTrackIndex(idx)}
                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                  currentTrackIndex === idx
                    ? 'bg-rose-500/15 border-rose-500/40 text-white shadow'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <span className="font-bold block truncate text-slate-200">{track.title}</span>
                  <span className="text-[10px] text-slate-400">{track.bpm} BPM</span>
                </div>
                {currentTrackIndex === idx && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
