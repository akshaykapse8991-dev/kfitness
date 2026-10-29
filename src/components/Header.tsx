import React from 'react';
import {
  Flame,
  LayoutDashboard,
  Calculator,
  Dumbbell,
  Salad,
  CalendarDays,
  Camera,
  Bell,
  Droplet,
  Target,
  ShieldCheck,
  Lock,
  Shield,
  Sparkles,
  Search,
  Smartphone,
  Download,
} from 'lucide-react';
import { UserProfile } from '../types/fitness';
import { GOAL_LABELS } from '../utils/calculators';
import { PrivacyShieldConfig } from '../types/privacyShield';
import { playShortBeep } from '../utils/audioChime';

export type ActiveTab =
  | 'dashboard'
  | 'calendar'
  | 'exercises'
  | 'nutrition'
  | 'diet_plan'
  | 'scanner'
  | 'ai_studio'
  | 'calculators'
  | 'reminders';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  userProfile: UserProfile;
  waterGlasses: number;
  consumedCalories: number;
  privacyShieldConfig?: PrivacyShieldConfig;
  onOpenPrivacySettings?: () => void;
  onLockNow?: () => void;
  onOpenSearch?: () => void;
  onOpenWhatsNew?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  userProfile,
  waterGlasses,
  consumedCalories,
  privacyShieldConfig,
  onOpenPrivacySettings,
  onLockNow,
  onOpenSearch,
  onOpenWhatsNew,
}) => {
  const currentGoalConfig = GOAL_LABELS[userProfile.goal] || GOAL_LABELS.fat_loss;
  const waterLiters = Math.round((waterGlasses * 0.25) * 10) / 10;

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'calendar', label: 'Adaptive Calendar', icon: <CalendarDays className="w-4 h-4" />, badge: 'Adaptive' },
    { id: 'exercises', label: 'Workouts', icon: <Dumbbell className="w-4 h-4" /> },
    { id: 'ai_studio', label: 'AI Coach & Studio', icon: <Sparkles className="w-4 h-4 text-emerald-400" />, badge: 'AI' },
    { id: 'nutrition', label: 'Indian Foods', icon: <Salad className="w-4 h-4" /> },
    { id: 'diet_plan', label: 'Diet Planner', icon: <CalendarDays className="w-4 h-4" /> },
    { id: 'scanner', label: 'AI Food Cam', icon: <Camera className="w-4 h-4" />, badge: 'Vision' },
    { id: 'calculators', label: 'Calculators', icon: <Calculator className="w-4 h-4" /> },
    { id: 'reminders', label: 'Reminders & Habits', icon: <Bell className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Brand & Version Badge */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2.5 cursor-pointer"
              onClick={() => {
                playShortBeep(650, 0.05);
                setActiveTab('dashboard');
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-300 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/25">
                <Flame className="w-6 h-6 fill-slate-950 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                    Kapse Fitness
                  </span>
                </div>
                <p className="text-[11px] text-emerald-400/90 font-medium tracking-wide hidden sm:block">
                  Train • Transform • Perform
                </p>
              </div>
            </div>

            {/* v2.5 Updated Edition Badge */}
            {onOpenWhatsNew && (
              <button
                type="button"
                onClick={() => {
                  playShortBeep(750, 0.05);
                  onOpenWhatsNew();
                }}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer"
                title="Click to view What's New in v2.5"
              >
                <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>v2.5 Updated</span>
              </button>
            )}
          </div>

          {/* Center Search / Quick Jump Button (Ctrl + K) */}
          {onOpenSearch && (
            <button
              type="button"
              onClick={() => {
                playShortBeep(600, 0.05);
                onOpenSearch();
              }}
              className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-all shadow-sm cursor-pointer min-w-[200px]"
            >
              <Search className="w-3.5 h-3.5 text-emerald-400" />
              <span className="flex-1 text-left">Quick Search & Jump...</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono border border-slate-700">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Quick Metrics Header Pill */}
          <div className="hidden md:flex items-center gap-2 text-xs">
            {/* Calories metric */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">Cal:</span>
              <span className="font-bold text-slate-100">
                {consumedCalories} <span className="text-slate-500 font-normal">/{userProfile.targetCalories}</span>
              </span>
            </div>

            {/* Water metric */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <Droplet className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Water:</span>
              <span className="font-bold text-cyan-300">
                {waterLiters}L <span className="text-slate-500 font-normal">/{userProfile.waterGoalLiters}L</span>
              </span>
            </div>

            {/* Android APK Download Direct Link */}
            <a
              href="/api/download-apk"
              download="KapseFitness-v2.5.apk"
              title="Download Android APK for offline phone installation"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-teal-950/60 border border-slate-800 hover:border-teal-500/40 text-teal-300 text-[11px] font-bold transition-all cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5 text-teal-400" />
              <span>Get APK</span>
            </a>

            {/* Privacy Shield Button & Quick Lock */}
            {onOpenPrivacySettings && (
              <div className="flex items-center gap-1.5 pl-1 border-l border-slate-800">
                <button
                  type="button"
                  onClick={onOpenPrivacySettings}
                  title="Configure Privacy Shield (Biometrics / PIN / Pattern)"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    privacyShieldConfig?.enabled
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    {privacyShieldConfig?.enabled ? 'Shield On' : 'Privacy'}
                  </span>
                </button>
                {privacyShieldConfig?.enabled && onLockNow && (
                  <button
                    type="button"
                    onClick={onLockNow}
                    title="Lock App Now (Privacy Mode)"
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/20 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 transition-all cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-rose-400" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Mobile Action Controls */}
          <div className="flex md:hidden items-center gap-1.5">
            {onOpenSearch && (
              <button
                type="button"
                onClick={onOpenSearch}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                title="Search (Ctrl+K)"
              >
                <Search className="w-4 h-4 text-emerald-400" />
              </button>
            )}

            {onOpenWhatsNew && (
              <button
                type="button"
                onClick={onOpenWhatsNew}
                className="px-2 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black"
                title="What's New in v2.5"
              >
                v2.5
              </button>
            )}

            {onOpenPrivacySettings && (
              <button
                type="button"
                onClick={onOpenPrivacySettings}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                title="Privacy Shield"
              >
                <Shield className="w-4 h-4 text-emerald-400" />
              </button>
            )}
            {privacyShieldConfig?.enabled && onLockNow && (
              <button
                type="button"
                onClick={onLockNow}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-rose-400 hover:text-rose-300"
                title="Lock App Now"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1 overflow-x-auto py-2 no-scrollbar border-t border-slate-800/60">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  playShortBeep(650, 0.04);
                  setActiveTab(item.id);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/25'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-slate-950/20 text-slate-950'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
