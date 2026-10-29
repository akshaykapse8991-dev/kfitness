import React from 'react';
import {
  Sparkles,
  X,
  CheckCircle2,
  Fingerprint,
  Music,
  Video,
  Flame,
  Salad,
  TrendingUp,
  Activity,
  Droplet,
  Smartphone,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { playShortBeep, playTimerFinishChime } from '../../utils/audioChime';

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: any) => void;
}

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  if (!isOpen) return null;

  const features = [
    {
      icon: <Fingerprint className="w-5 h-5 text-indigo-400" />,
      title: 'Biometric Fingerprint & Face Unlock',
      category: 'Privacy Shield',
      desc: 'Unlock your private health logs instantly using Touch ID, Android BiometricPrompt, Face ID, or Windows Hello with PIN fallback.',
      actionTab: 'reminders',
      actionLabel: 'Configure Biometrics',
      badge: 'New Security',
      color: 'border-indigo-500/30 bg-indigo-950/20',
    },
    {
      icon: <Music className="w-5 h-5 text-rose-400" />,
      title: 'BeatMatch AI Workout Audio Engine',
      category: 'Workouts',
      desc: 'Tempo-matched workout beats synthesizers (140 BPM for heavy PRs, 128 for hypertrophy, 90 for yoga) with real-time Web Audio.',
      actionTab: 'exercises',
      actionLabel: 'Launch BeatMatch',
      badge: '140 BPM',
      color: 'border-rose-500/30 bg-rose-950/20',
    },
    {
      icon: <Video className="w-5 h-5 text-cyan-400" />,
      title: 'Gym Equipment Tutorial Scanner',
      category: 'AI Vision',
      desc: 'Point the camera at any gym machine to view safety checkpoints, pin height setup, correct biomechanics, and common injury risks.',
      actionTab: 'exercises',
      actionLabel: 'Scan Machine',
      badge: 'Vision AI',
      color: 'border-cyan-500/30 bg-cyan-950/20',
    },
    {
      icon: <Flame className="w-5 h-5 text-amber-400" />,
      title: 'Dynamic 5-Minute Warmup Generator',
      category: 'Mobility',
      desc: 'Get targeted pre-workout mobility routines for Push, Pull, Legs, or Full Body with interactive countdown timer and joint cues.',
      actionTab: 'exercises',
      actionLabel: 'Start Warmup',
      badge: '5-Min Timer',
      color: 'border-amber-500/30 bg-amber-950/20',
    },
    {
      icon: <Salad className="w-5 h-5 text-emerald-400" />,
      title: 'AI Nutrition Coach & Macro Swaps',
      category: 'Nutrition',
      desc: 'Scans your 7-day meal history against macro goals and suggests 3 high-impact dietary optimizations with one-tap food swaps.',
      actionTab: 'nutrition',
      actionLabel: 'Open AI Coach',
      badge: 'Macro Engine',
      color: 'border-emerald-500/30 bg-emerald-950/20',
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-blue-400" />,
      title: 'Weight Projections & Goal Forecast',
      category: 'Analytics',
      desc: 'Predicts the exact calendar milestone when you will reach your target weight based on current weekly velocity.',
      actionTab: 'dashboard',
      actionLabel: 'View Forecast',
      badge: 'Projections',
      color: 'border-blue-500/30 bg-blue-950/20',
    },
    {
      icon: <Activity className="w-5 h-5 text-teal-400" />,
      title: 'Flexibility & Mobility Score Gauge',
      category: 'Joint Health',
      desc: 'Circular progress gauge tracking weekly stretching consistency across hamstrings, hip flexors, thoracic spine, and shoulders.',
      actionTab: 'dashboard',
      actionLabel: 'Check Mobility',
      badge: '0-100 Gauge',
      color: 'border-teal-500/30 bg-teal-950/20',
    },
    {
      icon: <Droplet className="w-5 h-5 text-sky-400" />,
      title: 'Animated Water Ring & Streaks',
      category: 'Hydration',
      desc: 'Visualizes daily hydration with smooth animated SVG progress rings, consecutive days streak counter, and 250ml quick logging.',
      actionTab: 'dashboard',
      actionLabel: 'Log Water',
      badge: '5-Day Streak',
      color: 'border-sky-500/30 bg-sky-950/20',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/25">
              <Sparkles className="w-6 h-6 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white">What&apos;s New in v2.5 Updated Edition</h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Latest Build
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Faster navigation, one-tap quick actions, AI coaches, biometric security & offline APK support.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playShortBeep(450, 0.05);
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Features List Scrollable */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all hover:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${feat.color}`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 shrink-0">
                  {feat.icon}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white">{feat.title}</span>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-900/90 text-slate-300 font-extrabold border border-slate-800">
                      {feat.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                    {feat.desc}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  playShortBeep(650, 0.05);
                  onNavigateTab(feat.actionTab);
                  onClose();
                }}
                className="self-end sm:self-center shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 border border-slate-700/80 text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <span>{feat.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Android APK Available • 100% Offline Compatible</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/download-apk"
              download="KapseFitness-v2.5.apk"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Get APK</span>
            </a>

            <button
              onClick={() => {
                playTimerFinishChime();
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              Got it, Let&apos;s Train!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
