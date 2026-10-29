import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  LayoutDashboard,
  Dumbbell,
  Salad,
  Sparkles,
  Calculator,
  Bell,
  Camera,
  CalendarDays,
  Flame,
  Droplet,
  Music,
  Video,
  Fingerprint,
  TrendingUp,
  Activity,
  ArrowRight,
  Smartphone,
  Lock,
} from 'lucide-react';
import { playShortBeep, playTimerFinishChime } from '../../utils/audioChime';

interface QuickCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: any) => void;
  onAddWater?: (delta: number) => void;
  onLockNow?: () => void;
  onOpenWhatsNew?: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Views' | 'AI & Tools' | 'Quick Actions' | 'Calculators' | 'Popular Movements';
  icon: React.ReactNode;
  action: () => void;
}

export const QuickCommandPalette: React.FC<QuickCommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onAddWater,
  onLockNow,
  onOpenWhatsNew,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const allCommands: CommandItem[] = [
    // Views
    {
      id: 'view-dashboard',
      title: 'Dashboard & Daily Tracker',
      subtitle: 'View water streak, weight projections, flexibility score, and food diary',
      category: 'Views',
      icon: <LayoutDashboard className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onNavigateTab('dashboard');
        onClose();
      },
    },
    {
      id: 'view-exercises',
      title: 'Home & Gym Workouts',
      subtitle: 'Browse 50+ exercises, routines, templates, rest timers & form analysis',
      category: 'Views',
      icon: <Dumbbell className="w-4 h-4 text-amber-400" />,
      action: () => {
        onNavigateTab('exercises');
        onClose();
      },
    },
    {
      id: 'view-nutrition',
      title: 'Indian Nutrition & AI Coach',
      subtitle: '300+ foods database, weekly macro review, and personalized dietary swaps',
      category: 'Views',
      icon: <Salad className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onNavigateTab('nutrition');
        onClose();
      },
    },
    {
      id: 'view-ai-studio',
      title: 'AI Studio & Coach',
      subtitle: 'Interactive AI coaching assistant, voice agent, and fitness insights',
      category: 'Views',
      icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onNavigateTab('ai_studio');
        onClose();
      },
    },
    {
      id: 'view-scanner',
      title: 'AI Food Nutrition Scanner',
      subtitle: 'Snap a photo of your meal to calculate calories and macros with Gemini Vision',
      category: 'Views',
      icon: <Camera className="w-4 h-4 text-cyan-400" />,
      action: () => {
        onNavigateTab('scanner');
        onClose();
      },
    },
    {
      id: 'view-calculators',
      title: 'Fitness Calculators & Biological Age',
      subtitle: 'Compute Biological Fitness Age, BMI, TDEE, Body Fat %, and One-Rep Max',
      category: 'Views',
      icon: <Calculator className="w-4 h-4 text-indigo-400" />,
      action: () => {
        onNavigateTab('calculators');
        onClose();
      },
    },
    {
      id: 'view-diet-planner',
      title: '7-Day Indian Diet Planner',
      subtitle: 'Custom weekly meal plans tailored to vegetarian, eggetarian, or non-veg targets',
      category: 'Views',
      icon: <CalendarDays className="w-4 h-4 text-rose-400" />,
      action: () => {
        onNavigateTab('diet_plan');
        onClose();
      },
    },
    {
      id: 'view-reminders',
      title: 'Reminders & Daily Habits',
      subtitle: 'Hydration alerts, workout schedules, data export/backup & privacy shield settings',
      category: 'Views',
      icon: <Bell className="w-4 h-4 text-amber-400" />,
      action: () => {
        onNavigateTab('reminders');
        onClose();
      },
    },

    // AI & Tools
    {
      id: 'tool-beatmatch',
      title: 'BeatMatch AI Workout Audio Player',
      subtitle: 'Tempo-matched beats (140 BPM PR, 128 BPM Hypertrophy, 90 BPM Yoga)',
      category: 'AI & Tools',
      icon: <Music className="w-4 h-4 text-rose-400" />,
      action: () => {
        onNavigateTab('exercises');
        onClose();
      },
    },
    {
      id: 'tool-equipment',
      title: 'Gym Equipment Tutorial Scanner',
      subtitle: 'Identify gym machines and learn safety stops, pin height, and technique',
      category: 'AI & Tools',
      icon: <Video className="w-4 h-4 text-indigo-400" />,
      action: () => {
        onNavigateTab('exercises');
        onClose();
      },
    },
    {
      id: 'tool-warmup',
      title: 'Dynamic 5-Minute Warmup Generator',
      subtitle: 'Interactive countdown timer routine for Push, Pull, Legs, or Full Body',
      category: 'AI & Tools',
      icon: <Flame className="w-4 h-4 text-amber-400" />,
      action: () => {
        onNavigateTab('exercises');
        onClose();
      },
    },
    {
      id: 'tool-form-helper',
      title: 'AI Exercise Form Helper (Camera)',
      subtitle: 'Upload lift videos for real-time biomechanical analysis and injury checks',
      category: 'AI & Tools',
      icon: <Camera className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onNavigateTab('exercises');
        onClose();
      },
    },
    {
      id: 'tool-whats-new',
      title: "What's New in v2.5 Updated Edition",
      subtitle: 'Overview of newly released features, biometric unlock, and improvements',
      category: 'AI & Tools',
      icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onClose();
        if (onOpenWhatsNew) onOpenWhatsNew();
      },
    },

    // Quick Actions
    {
      id: 'action-water',
      title: 'Quick Log +250ml Water Glass',
      subtitle: 'Add 1 glass towards your daily hydration goal',
      category: 'Quick Actions',
      icon: <Droplet className="w-4 h-4 text-cyan-400" />,
      action: () => {
        if (onAddWater) onAddWater(1);
        playTimerFinishChime();
        onClose();
      },
    },
    {
      id: 'action-lock',
      title: 'Lock Screen (Privacy Shield)',
      subtitle: 'Immediately activate Privacy Shield requiring PIN, Pattern or Biometrics',
      category: 'Quick Actions',
      icon: <Lock className="w-4 h-4 text-rose-400" />,
      action: () => {
        if (onLockNow) onLockNow();
        onClose();
      },
    },
    {
      id: 'action-apk',
      title: 'Download Android App (APK File)',
      subtitle: 'Install Kapse Fitness directly onto your Android phone for offline training',
      category: 'Quick Actions',
      icon: <Smartphone className="w-4 h-4 text-emerald-400" />,
      action: () => {
        const link = document.createElement('a');
        link.href = '/api/download-apk';
        link.download = 'KapseFitness-v2.5.apk';
        link.click();
        onClose();
      },
    },

    // Calculators
    {
      id: 'calc-bio-age',
      title: 'Biological Age & Fitness Score Calculator',
      subtitle: 'Calculate your metabolic fitness age from BMI, RHR, sleep, and VO2 max',
      category: 'Calculators',
      icon: <Activity className="w-4 h-4 text-teal-400" />,
      action: () => {
        onNavigateTab('calculators');
        onClose();
      },
    },
    {
      id: 'calc-projections',
      title: 'Weight Forecast & Target Projections',
      subtitle: 'See the date you will hit your goal weight based on current progress',
      category: 'Calculators',
      icon: <TrendingUp className="w-4 h-4 text-blue-400" />,
      action: () => {
        onNavigateTab('dashboard');
        onClose();
      },
    },
  ];

  const filtered = query.trim()
    ? allCommands.filter(
        (c) =>
          c.title.toLowerCase().includes(query.toLowerCase()) ||
          c.subtitle.toLowerCase().includes(query.toLowerCase()) ||
          c.category.toLowerCase().includes(query.toLowerCase())
      )
    : allCommands;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
      playShortBeep(700, 0.03);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
      playShortBeep(700, 0.03);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
        playTimerFinishChime();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-md flex items-start justify-center pt-12 sm:pt-20 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950/60">
          <Search className="w-5 h-5 text-emerald-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search exercises, calculators, foods, or actions..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent text-sm font-semibold text-white placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono border border-slate-700">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No matching commands or tools found for &quot;{query}&quot;.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    item.action();
                    playShortBeep(650, 0.05);
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/15 border border-emerald-500/40 text-white shadow-sm'
                      : 'hover:bg-slate-800/60 border border-transparent text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className={`p-2 rounded-xl border shrink-0 ${
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold truncate block">{item.title}</span>
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-extrabold shrink-0">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <ArrowRight
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isSelected ? 'text-emerald-400 translate-x-0.5' : 'text-slate-600'
                    }`}
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Bottom Tip */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span>Use ↑↓ arrows to navigate</span>
            <span>•</span>
            <span>Enter to select</span>
          </div>
          <span className="font-bold text-emerald-400">Kapse Fitness v2.5 Updated</span>
        </div>
      </div>
    </div>
  );
};
