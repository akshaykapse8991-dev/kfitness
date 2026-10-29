import React, { useState } from 'react';
import {
  LayoutDashboard,
  Dumbbell,
  Salad,
  Sparkles,
  Grid,
  Camera,
  Calculator,
  Bell,
  CalendarDays,
  Shield,
  Smartphone,
  X,
  Droplet,
  Flame,
  Search,
} from 'lucide-react';
import { ActiveTab } from '../Header';
import { playShortBeep, playTimerFinishChime } from '../../utils/audioChime';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenSearch: () => void;
  onOpenPrivacySettings?: () => void;
  onOpenWhatsNew?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenSearch,
  onOpenPrivacySettings,
  onOpenWhatsNew,
}) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const mainTabs = [
    { id: 'dashboard' as ActiveTab, label: 'Home', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'exercises' as ActiveTab, label: 'Workouts', icon: <Dumbbell className="w-5 h-5" /> },
    { id: 'nutrition' as ActiveTab, label: 'Diet', icon: <Salad className="w-5 h-5" /> },
    { id: 'ai_studio' as ActiveTab, label: 'AI Coach', icon: <Sparkles className="w-5 h-5" /> },
  ];

  const moreItems: {
    id?: ActiveTab;
    label: string;
    icon: React.ReactNode;
    action?: () => void;
    badge?: string;
  }[] = [
    { id: 'scanner', label: 'AI Food Cam', icon: <Camera className="w-5 h-5 text-cyan-400" />, badge: 'Gemini' },
    { id: 'calculators', label: 'Calculators', icon: <Calculator className="w-5 h-5 text-indigo-400" /> },
    { id: 'diet_plan', label: 'Diet Planner', icon: <CalendarDays className="w-5 h-5 text-rose-400" /> },
    { id: 'calendar', label: 'Adaptive Calendar', icon: <CalendarDays className="w-5 h-5 text-amber-400" /> },
    { id: 'reminders', label: 'Reminders & Habits', icon: <Bell className="w-5 h-5 text-emerald-400" /> },
    {
      label: 'Privacy Shield',
      icon: <Shield className="w-5 h-5 text-emerald-400" />,
      action: () => {
        setIsMoreMenuOpen(false);
        if (onOpenPrivacySettings) onOpenPrivacySettings();
      },
    },
    {
      label: "What's New v2.5",
      icon: <Sparkles className="w-5 h-5 text-amber-400" />,
      action: () => {
        setIsMoreMenuOpen(false);
        if (onOpenWhatsNew) onOpenWhatsNew();
      },
      badge: 'Updated',
    },
    {
      label: 'Download APK',
      icon: <Smartphone className="w-5 h-5 text-teal-400" />,
      action: () => {
        setIsMoreMenuOpen(false);
        const link = document.createElement('a');
        link.href = '/api/download-apk';
        link.download = 'KapseFitness-v2.5.apk';
        link.click();
      },
      badge: 'Offline',
    },
  ];

  return (
    <>
      {/* Slide-up "More" sheet on mobile */}
      {isMoreMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm md:hidden flex flex-col justify-end p-4 animate-in fade-in"
          onClick={() => setIsMoreMenuOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl max-h-[75vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Grid className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-black text-white">All Fitness Hubs & Tools</h3>
              </div>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-1 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {moreItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    playShortBeep(650, 0.05);
                    if (item.action) {
                      item.action();
                    } else if (item.id) {
                      setActiveTab(item.id);
                      setIsMoreMenuOpen(false);
                    }
                  }}
                  className={`p-3 rounded-2xl border flex items-center gap-3 transition-all text-left cursor-pointer ${
                    item.id && activeTab === item.id
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold block truncate">{item.label}</span>
                    {item.badge && (
                      <span className="text-[9px] font-extrabold uppercase px-1 py-0.2 rounded bg-slate-800 text-emerald-400">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setIsMoreMenuOpen(false);
                onOpenSearch();
              }}
              className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
            >
              <Search className="w-4 h-4 text-emerald-400" />
              <span>Universal Search & Shortcuts (Ctrl+K)</span>
            </button>
          </div>
        </div>
      )}

      {/* Fixed Bottom Dock (Mobile Only) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 safe-area-pb">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {mainTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  playShortBeep(650, 0.04);
                  setActiveTab(tab.id);
                }}
                className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
                  isActive
                    ? 'text-emerald-400 font-extrabold scale-105'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div
                  className={`p-1 rounded-xl transition-all ${
                    isActive ? 'bg-emerald-500/20 text-emerald-400 shadow-sm shadow-emerald-500/30' : ''
                  }`}
                >
                  {tab.icon}
                </div>
                <span className="text-[10px] mt-0.5 font-bold tracking-tight">{tab.label}</span>
              </button>
            );
          })}

          {/* More Drawer Button */}
          <button
            onClick={() => {
              playShortBeep(550, 0.05);
              setIsMoreMenuOpen(true);
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
              isMoreMenuOpen
                ? 'text-emerald-400 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="p-1 rounded-xl">
              <Grid className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 font-bold tracking-tight">Tools</span>
          </button>
        </div>
      </nav>
    </>
  );
};
