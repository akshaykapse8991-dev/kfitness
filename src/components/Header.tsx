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
  Shield,
  Sparkles,
  Search,
  Smartphone,
  Lock,
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
  const goalInfo = GOAL_LABELS[userProfile.goal] || GOAL_LABELS.fat_loss;
  const waterLiters = Math.round((waterGlasses * 0.25) * 10) / 10;
  const todayDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).toUpperCase();

  const navItemsMobile: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { id: 'calendar', label: 'Calendar', icon: <CalendarDays className="w-3.5 h-3.5" /> },
    { id: 'exercises', label: 'Workouts', icon: <Dumbbell className="w-3.5 h-3.5" /> },
    { id: 'ai_studio', label: 'AI Studio', icon: <Sparkles className="w-3.5 h-3.5 text-[#00DC82]" /> },
    { id: 'nutrition', label: 'Nutrition', icon: <Salad className="w-3.5 h-3.5" /> },
    { id: 'scanner', label: 'AI Cam', icon: <Camera className="w-3.5 h-3.5" /> },
    { id: 'calculators', label: 'Calculators', icon: <Calculator className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#141417]/95 backdrop-blur-md border-b border-white/10">
      {/* Desktop Top-Bar (Variation 3 style) */}
      <div className="hidden lg:flex items-center justify-between px-8 py-3.5">
        {/* Telemetry info */}
        <div>
          <div className="label-mono flex items-center gap-2">
            <span>SYSTEM TELEMETRY // TODAY: {todayDateStr}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00DC82] animate-pulse" />
          </div>
          <div className="font-mono text-xs text-white/90 font-semibold flex items-center gap-3 mt-0.5">
            <span>
              TARGET BUDGET: <strong className="text-white">{userProfile.targetCalories}</strong> KCAL
            </span>
            <span className="text-white/20">•</span>
            <span>
              HYDRATION: <strong className="text-[#38BDF8]">{waterLiters}L</strong> / {userProfile.waterGoalLiters}L
            </span>
            <span className="text-white/20">•</span>
            <span className="text-[#00DC82] uppercase">
              {goalInfo.label.split('(')[0]} PHASE
            </span>
          </div>
        </div>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2.5">
          {/* Quick AI Vision Food Scanner CTA */}
          <button
            type="button"
            onClick={() => {
              playShortBeep(700, 0.05);
              setActiveTab('scanner');
            }}
            className="btn-accent text-xs"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Scan Food</span>
          </button>

          {/* Quick Search Ctrl+K */}
          {onOpenSearch && (
            <button
              type="button"
              onClick={() => {
                playShortBeep(600, 0.05);
                onOpenSearch();
              }}
              className="btn-ghost text-xs"
            >
              <Search className="w-3.5 h-3.5 text-[#00DC82]" />
              <span>Search</span>
              <kbd className="px-1.5 py-0.5 rounded bg-black/60 text-[10px] font-mono border border-white/10 text-white/70">
                ⌘K
              </kbd>
            </button>
          )}

          {/* v2.5 Updated Edition Badge */}
          {onOpenWhatsNew && (
            <button
              type="button"
              onClick={() => {
                playShortBeep(750, 0.05);
                onOpenWhatsNew();
              }}
              className="btn-ghost text-xs text-[#00DC82] border-[#00DC82]/30"
              title="View What's New in v2.5"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>v2.5 OS</span>
            </button>
          )}

          {/* Privacy Shield quick trigger */}
          {onOpenPrivacySettings && (
            <button
              type="button"
              onClick={onOpenPrivacySettings}
              className={`btn-ghost text-xs ${
                privacyShieldConfig?.enabled
                  ? 'border-[#00DC82]/40 text-[#00DC82]'
                  : 'text-white/60'
              }`}
              title="Privacy Shield Settings"
            >
              <Shield className="w-3.5 h-3.5 text-[#00DC82]" />
              <span>{privacyShieldConfig?.enabled ? 'Shielded' : 'Privacy'}</span>
            </button>
          )}

          {privacyShieldConfig?.enabled && onLockNow && (
            <button
              type="button"
              onClick={onLockNow}
              className="p-2 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors cursor-pointer"
              title="Lock Now"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Top Bar (< lg:) */}
      <div className="flex lg:hidden flex-col px-4 py-2.5">
        <div className="flex items-center justify-between">
          {/* Brand */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => {
              playShortBeep(650, 0.05);
              setActiveTab('dashboard');
            }}
          >
            <div className="w-8 h-8 rounded bg-black border border-white/10 flex items-center justify-center text-[#00DC82]">
              <Flame className="w-4 h-4 fill-[#00DC82]" />
            </div>
            <div>
              <div className="font-syne text-base font-extrabold uppercase leading-none text-white tracking-tight">
                KAPSE <span className="text-[#00DC82]">FITNESS</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">v2.5 // PRIVACY ON</p>
            </div>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex items-center gap-1.5">
            {onOpenSearch && (
              <button
                type="button"
                onClick={onOpenSearch}
                className="p-2 rounded bg-black/40 border border-white/10 text-white/80 hover:text-white"
                title="Search"
              >
                <Search className="w-3.5 h-3.5 text-[#00DC82]" />
              </button>
            )}

            {onOpenWhatsNew && (
              <button
                type="button"
                onClick={onOpenWhatsNew}
                className="px-2 py-1 rounded bg-[#00DC82]/10 border border-[#00DC82]/30 text-[#00DC82] text-[10px] font-mono font-bold"
              >
                v2.5
              </button>
            )}

            {onOpenPrivacySettings && (
              <button
                type="button"
                onClick={onOpenPrivacySettings}
                className="p-2 rounded bg-black/40 border border-white/10 text-white/80 hover:text-white"
                title="Privacy Shield"
              >
                <Shield className="w-3.5 h-3.5 text-[#00DC82]" />
              </button>
            )}

            {privacyShieldConfig?.enabled && onLockNow && (
              <button
                type="button"
                onClick={onLockNow}
                className="p-2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400"
                title="Lock"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Horizontal Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto py-1.5 mt-1 no-scrollbar border-t border-white/5">
          {navItemsMobile.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  playShortBeep(650, 0.04);
                  setActiveTab(item.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#00DC82] text-black font-bold'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
