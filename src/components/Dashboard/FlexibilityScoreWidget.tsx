import React, { useState, useEffect } from 'react';
import {
  Activity,
  Flame,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Plus,
  RefreshCw,
  Zap,
  Dumbbell,
} from 'lucide-react';
import { playShortBeep, playTimerFinishChime } from '../../utils/audioChime';

interface FlexibilityScoreWidgetProps {
  onLaunchWarmup?: () => void;
}

export const FlexibilityScoreWidget: React.FC<FlexibilityScoreWidgetProps> = ({
  onLaunchWarmup,
}) => {
  const [sessionsThisWeek, setSessionsThisWeek] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('kapse_mobility_sessions_week');
      if (stored) return parseInt(stored, 10);
    } catch {}
    return 4;
  });

  const [stretchStreak, setStretchStreak] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('kapse_stretching_streak');
      if (stored) return parseInt(stored, 10);
    } catch {}
    return 6;
  });

  const [justLogged, setJustLogged] = useState(false);

  // Flexibility Score formula based on weekly volume and streak
  // 0 sessions = 35%, 1 = 50%, 2 = 62%, 3 = 74%, 4 = 84%, 5 = 92%, 6+ = 98%
  const baseScoreMap: Record<number, number> = {
    0: 35,
    1: 50,
    2: 63,
    3: 75,
    4: 84,
    5: 92,
    6: 96,
    7: 99,
  };

  const flexibilityScore = Math.min(
    100,
    (baseScoreMap[Math.min(7, sessionsThisWeek)] || 84) + Math.min(5, Math.floor(stretchStreak / 2))
  );

  const getTier = (score: number) => {
    if (score >= 90) return { label: 'Elite Mobility', color: 'text-emerald-400', badgeBg: 'bg-emerald-500/20 text-emerald-300' };
    if (score >= 75) return { label: 'Optimal Mobility', color: 'text-cyan-400', badgeBg: 'bg-cyan-500/20 text-cyan-300' };
    if (score >= 60) return { label: 'Moderate Range', color: 'text-amber-400', badgeBg: 'bg-amber-500/20 text-amber-300' };
    return { label: 'Restricted / Stiff', color: 'text-rose-400', badgeBg: 'bg-rose-500/20 text-rose-300' };
  };

  const tier = getTier(flexibilityScore);

  // SVG circular gauge calculation
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (flexibilityScore / 100) * circumference;

  const handleLogMobilitySession = () => {
    const nextSessions = sessionsThisWeek + 1;
    const nextStreak = stretchStreak + 1;
    setSessionsThisWeek(nextSessions);
    setStretchStreak(nextStreak);
    setJustLogged(true);

    try {
      localStorage.setItem('kapse_mobility_sessions_week', nextSessions.toString());
      localStorage.setItem('kapse_stretching_streak', nextStreak.toString());
    } catch {}

    playTimerFinishChime();
    setTimeout(() => setJustLogged(false), 2500);
  };

  return (
    <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 shadow-xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Flexibility & Mobility Score</h3>
            <p className="text-[11px] text-slate-400">Stretching consistency & joint range-of-motion</p>
          </div>
        </div>

        <span className={`text-xs font-black px-2.5 py-1 rounded-lg uppercase tracking-wider border border-current/20 ${tier.badgeBg}`}>
          {tier.label}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Left: Circular Progress Gauge */}
        <div className="md:col-span-5 flex flex-col items-center justify-center py-2">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
              <defs>
                <linearGradient id="flexibilityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              {/* Background Ring */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                className="stroke-slate-800/80"
                strokeWidth="10"
                fill="transparent"
              />
              {/* Progress Ring with Animated Stroke */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                stroke="url(#flexibilityGradient)"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{
                  transition: 'stroke-dashoffset 1s ease-in-out',
                }}
              />
            </svg>

            {/* Central Score Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black text-white tracking-tight">
                {flexibilityScore}
                <span className="text-xs text-slate-400 font-normal">/100</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Score
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-amber-400">
            <Flame className="w-3.5 h-3.5 fill-amber-400" />
            <span>{stretchStreak} Day Mobility Streak</span>
          </div>
        </div>

        {/* Right: Pillars & Action */}
        <div className="md:col-span-7 space-y-3">
          {/* 4 Mobility Pillars */}
          <div className="space-y-1.5">
            {[
              { name: 'Hamstrings & Posterior Chain', pct: Math.min(100, flexibilityScore + 4) },
              { name: 'Hip Flexors & Glute Mobility', pct: Math.min(100, flexibilityScore - 2) },
              { name: 'Thoracic Spine Extension', pct: Math.min(100, flexibilityScore - 5) },
              { name: 'Shoulder Internal/External Rotation', pct: Math.min(100, flexibilityScore + 2) },
            ].map((pillar, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-300 font-medium">{pillar.name}</span>
                  <span className="text-cyan-400 font-bold">{pillar.pct}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-700"
                    style={{ width: `${pillar.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={handleLogMobilitySession}
              disabled={justLogged}
              className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-600/25 hover:bg-cyan-600/40 text-cyan-200 border border-cyan-500/40 text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-60"
            >
              {justLogged ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Logged (+Score)</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Log 10m Routine</span>
                </>
              )}
            </button>

            {onLaunchWarmup && (
              <button
                onClick={onLaunchWarmup}
                className="flex-1 min-w-[140px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-slate-950" />
                <span>5-Min Routine</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
