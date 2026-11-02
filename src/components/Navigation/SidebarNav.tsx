import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Dumbbell,
  Sparkles,
  Salad,
  Camera,
  Calculator,
  Bell,
  Lock,
  Search,
  Download,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { ActiveTab } from '../Header';
import { PrivacyShieldConfig } from '../../types/privacyShield';
import { playShortBeep } from '../../utils/audioChime';

interface SidebarNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  privacyShieldConfig?: PrivacyShieldConfig;
  onOpenPrivacySettings?: () => void;
  onLockNow?: () => void;
  onOpenSearch?: () => void;
  onOpenWhatsNew?: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  setActiveTab,
  privacyShieldConfig,
  onOpenPrivacySettings,
  onLockNow,
  onOpenSearch,
  onOpenWhatsNew,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; tag?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'calendar', label: 'Adaptive Calendar', icon: <CalendarDays className="w-4 h-4" />, tag: 'ADAPTIVE' },
    { id: 'exercises', label: 'Workout Studio', icon: <Dumbbell className="w-4 h-4" /> },
    { id: 'ai_studio', label: 'AI Coach & Studio', icon: <Sparkles className="w-4 h-4 text-[#00DC82]" />, tag: 'AI' },
    { id: 'nutrition', label: 'Indian Foods', icon: <Salad className="w-4 h-4" /> },
    { id: 'diet_plan', label: 'Diet Planner', icon: <CalendarDays className="w-4 h-4" /> },
    { id: 'scanner', label: 'AI Food Cam', icon: <Camera className="w-4 h-4" />, tag: 'VISION' },
    { id: 'calculators', label: 'Calculators', icon: <Calculator className="w-4 h-4" /> },
    { id: 'reminders', label: 'Reminders & Habits', icon: <Bell className="w-4 h-4" /> },
  ];

  return (
    <aside className="hidden lg:flex w-60 shrink-0 bg-[#141417] border-r border-white/10 flex-col justify-between p-5 min-h-screen sticky top-0 h-screen overflow-y-auto no-scrollbar z-30">
      <div className="space-y-6">
        {/* Brand / Logo matching Variation 3 specification */}
        <div
          onClick={() => {
            playShortBeep(650, 0.05);
            setActiveTab('dashboard');
          }}
          className="cursor-pointer group select-none"
        >
          <div className="font-syne text-2xl font-extrabold uppercase leading-none text-white tracking-tight">
            KAPSE<br />
            <span className="text-[#00DC82]">FITNESS</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono tracking-widest mt-1 opacity-70 group-hover:text-[#00DC82] transition-colors">
            TRAIN • TRANSFORM
          </div>
        </div>

        {/* Navigation list */}
        <div>
          <div className="label-mono mb-2">System Navigation</div>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    playShortBeep(700, 0.04);
                    setActiveTab(item.id);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white/5 text-white font-bold border-l-2 border-[#00DC82] rounded-l-none'
                      : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className={isActive ? 'text-[#00DC82]' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.tag && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
                      {item.tag}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* System Status section at the bottom */}
      <div className="pt-4 border-t border-white/10 space-y-3">
        <div className="label-mono">System Status</div>

        <div className="space-y-1.5 text-xs font-mono">
          <div className="px-2.5 py-1.5 rounded bg-black/40 border border-white/5 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">ENGINE:</span>
            <span className="text-[#00DC82] font-bold">ONLINE</span>
          </div>

          {privacyShieldConfig?.enabled ? (
            <div
              onClick={onOpenPrivacySettings}
              className="px-2.5 py-1.5 rounded bg-black/40 border border-white/5 flex items-center justify-between text-[11px] cursor-pointer hover:border-[#00DC82]/40 transition-colors"
            >
              <span className="text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#00DC82]" />
                SHIELD:
              </span>
              <span className="text-[#00DC82] font-bold uppercase">
                {privacyShieldConfig.lockType}
              </span>
            </div>
          ) : (
            <div
              onClick={onOpenPrivacySettings}
              className="px-2.5 py-1.5 rounded bg-black/40 border border-white/5 flex items-center justify-between text-[11px] cursor-pointer hover:border-slate-500 transition-colors"
            >
              <span className="text-slate-400">SHIELD:</span>
              <span className="text-amber-400 font-bold">UNLOCKED</span>
            </div>
          )}
        </div>

        {/* Quick Actions in Sidebar */}
        <div className="flex flex-col gap-1.5 pt-1">
          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white text-[11px] font-mono transition-colors cursor-pointer border border-white/5"
            >
              <span className="flex items-center gap-1.5">
                <Search className="w-3 h-3 text-[#00DC82]" />
                Command Menu
              </span>
              <kbd className="px-1 py-0.2 rounded bg-black/50 text-[10px] text-slate-400 border border-white/10">
                ⌘K
              </kbd>
            </button>
          )}

          {onLockNow && privacyShieldConfig?.enabled && (
            <button
              type="button"
              onClick={onLockNow}
              className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[11px] font-mono transition-colors cursor-pointer border border-rose-500/30"
            >
              <Lock className="w-3 h-3" />
              <span>Lock Applet</span>
            </button>
          )}

          <a
            href="/api/download-apk"
            download="KapseFitness-v2.5.apk"
            className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white text-[11px] font-mono transition-colors border border-white/5"
          >
            <Download className="w-3 h-3 text-[#00DC82]" />
            <span>Download APK</span>
          </a>
        </div>
      </div>
    </aside>
  );
};
