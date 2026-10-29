import React, { useState } from 'react';
import {
  Zap,
  X,
  Droplet,
  Flame,
  Music,
  Camera,
  Video,
  Lock,
  Plus,
  ChevronUp,
  Sparkles,
  Smartphone,
} from 'lucide-react';
import { playShortBeep, playTimerFinishChime } from '../../utils/audioChime';

interface FloatingQuickAccessProps {
  onAddWater: (delta: number) => void;
  onNavigateTab: (tab: any) => void;
  onLockNow?: () => void;
  onOpenSearch?: () => void;
}

export const FloatingQuickAccess: React.FC<FloatingQuickAccessProps> = ({
  onAddWater,
  onNavigateTab,
  onLockNow,
  onOpenSearch,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleQuickWater = () => {
    onAddWater(1);
    playShortBeep(650, 0.08);
    showToast('+250ml Water Logged 💧');
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 flex flex-col items-end">
      {/* Mini Toast */}
      {toastMessage && (
        <div className="mb-2 px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs shadow-lg animate-bounce flex items-center gap-1.5 border border-cyan-300">
          <Droplet className="w-3.5 h-3.5 fill-slate-950" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Speed Dial Menu Items */}
      {isOpen && (
        <div className="mb-3 flex flex-col items-end gap-2.5 animate-in slide-in-from-bottom duration-200">
          {/* Quick Water */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-200 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800 shadow-md">
              +250ml Water
            </span>
            <button
              onClick={handleQuickWater}
              className="w-11 h-11 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/30 transition-transform active:scale-90 cursor-pointer"
              title="Add 250ml water immediately"
            >
              <Droplet className="w-5 h-5 fill-slate-950" />
            </button>
          </div>

          {/* 5-Min Warmup */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-200 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800 shadow-md">
              5-Min Warmup
            </span>
            <button
              onClick={() => {
                onNavigateTab('exercises');
                setIsOpen(false);
                playShortBeep(700, 0.08);
              }}
              className="w-11 h-11 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 transition-transform active:scale-90 cursor-pointer"
              title="Start 5-minute dynamic warmup routine"
            >
              <Flame className="w-5 h-5 fill-slate-950" />
            </button>
          </div>

          {/* BeatMatch Workout Beats */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-200 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800 shadow-md">
              BeatMatch 140 BPM
            </span>
            <button
              onClick={() => {
                onNavigateTab('exercises');
                setIsOpen(false);
                playShortBeep(750, 0.08);
              }}
              className="w-11 h-11 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 transition-transform active:scale-90 cursor-pointer"
              title="Play tempo-matched workout audio"
            >
              <Music className="w-5 h-5" />
            </button>
          </div>

          {/* AI Food Scanner */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-200 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800 shadow-md">
              Scan Food Photo
            </span>
            <button
              onClick={() => {
                onNavigateTab('scanner');
                setIsOpen(false);
                playShortBeep(600, 0.08);
              }}
              className="w-11 h-11 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-transform active:scale-90 cursor-pointer"
              title="Snap food picture to estimate macros"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>

          {/* Equipment Tutorial */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-200 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800 shadow-md">
              Equipment Scanner
            </span>
            <button
              onClick={() => {
                onNavigateTab('exercises');
                setIsOpen(false);
                playShortBeep(650, 0.08);
              }}
              className="w-11 h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-transform active:scale-90 cursor-pointer"
              title="Scan machine for tutorial and safety stops"
            >
              <Video className="w-5 h-5" />
            </button>
          </div>

          {/* Lock Privacy Shield */}
          {onLockNow && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800 shadow-md">
                Lock Screen Now
              </span>
              <button
                onClick={() => {
                  onLockNow();
                  setIsOpen(false);
                  playShortBeep(350, 0.1);
                }}
                className="w-11 h-11 rounded-2xl bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-300 border border-slate-700 flex items-center justify-center shadow-lg transition-transform active:scale-90 cursor-pointer"
                title="Lock App into Privacy Shield mode"
              >
                <Lock className="w-5 h-5 text-rose-400" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Trigger Floating Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          playShortBeep(isOpen ? 400 : 700, 0.05);
        }}
        className={`w-14 h-14 rounded-3xl flex items-center justify-center shadow-2xl transition-all cursor-pointer ${
          isOpen
            ? 'bg-slate-800 text-white border-2 border-slate-700 rotate-45'
            : 'bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-300 text-slate-950 shadow-emerald-500/40 hover:scale-105 active:scale-95'
        }`}
        title="Quick Actions Menu"
      >
        {isOpen ? <Plus className="w-7 h-7" /> : <Zap className="w-7 h-7 fill-slate-950" />}
      </button>
    </div>
  );
};
