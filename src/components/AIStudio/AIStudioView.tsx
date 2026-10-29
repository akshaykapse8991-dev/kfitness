import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  Headphones,
  BookOpen,
  MapPin,
  Music,
  Flame,
  Zap,
} from 'lucide-react';
import { UserProfile } from '../../types/fitness';
import { GeminiChatbot } from './GeminiChatbot';
import { VoiceCoachDialogue } from './VoiceCoachDialogue';
import { FitnessScienceSearch } from './FitnessScienceSearch';
import { GymMapsFinder } from './GymMapsFinder';
import { WorkoutBeatsGenerator } from './WorkoutBeatsGenerator';

export type AISubTab = 'chat' | 'voice' | 'science' | 'maps' | 'beats';

interface AIStudioViewProps {
  userProfile?: UserProfile;
  initialSubTab?: AISubTab;
}

export const AIStudioView: React.FC<AIStudioViewProps> = ({
  userProfile,
  initialSubTab = 'chat',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<AISubTab>(initialSubTab);

  const subTabs: { id: AISubTab; label: string; icon: React.ReactNode; badge: string }[] = [
    {
      id: 'chat',
      label: 'Gemini Coach Chat',
      icon: <Bot className="w-4 h-4" />,
      badge: 'gemini-3.8-flash',
    },
    {
      id: 'voice',
      label: 'Live Voice Coach',
      icon: <Headphones className="w-4 h-4" />,
      badge: 'gemini-3.8-live',
    },
    {
      id: 'science',
      label: 'Fitness Science Search',
      icon: <BookOpen className="w-4 h-4" />,
      badge: 'Search Grounded',
    },
    {
      id: 'maps',
      label: 'Gym & Studio Maps',
      icon: <MapPin className="w-4 h-4" />,
      badge: 'Maps Grounded',
    },
    {
      id: 'beats',
      label: 'Workout Beats Studio',
      icon: <Music className="w-4 h-4" />,
      badge: 'Lyria Music',
    },
  ];

  return (
    <div className="space-y-6">
      {/* AI Studio Header Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Kapse AI Intelligence Suite</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              Gemini Fitness AI & Multimodal Studio
            </h1>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
              Powered by Google Gemini: Multi-turn fitness coaching, real-time hands-free voice dialogue,
              Google Search-grounded exercise science, Google Maps-grounded facility discovery, and Lyria workout beats.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-xs font-medium text-slate-300">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Full-Stack Native SDK</span>
            </div>
          </div>
        </div>

        {/* Sub-Tabs Navigation */}
        <div className="relative z-10 mt-8 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-t border-slate-800/80 pt-6">
          {subTabs.map((tab) => {
            const isCurrent = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
                  isCurrent
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-slate-800'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                    isCurrent
                      ? 'bg-slate-950/30 text-slate-950'
                      : 'bg-slate-800 text-emerald-400/90'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main SubTab Content View */}
      <div>
        {activeSubTab === 'chat' && <GeminiChatbot userProfile={userProfile} />}
        {activeSubTab === 'voice' && <VoiceCoachDialogue />}
        {activeSubTab === 'science' && <FitnessScienceSearch />}
        {activeSubTab === 'maps' && <GymMapsFinder />}
        {activeSubTab === 'beats' && <WorkoutBeatsGenerator />}
      </div>
    </div>
  );
};
