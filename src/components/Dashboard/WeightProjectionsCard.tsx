import React, { useMemo } from 'react';
import {
  TrendingDown,
  TrendingUp,
  Calendar,
  Clock,
  Target,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Flame,
  Scale,
} from 'lucide-react';
import { WeightRecord } from '../../types/fitness';

interface WeightProjectionsCardProps {
  weightHistory: WeightRecord[];
  currentWeightKg: number;
  targetWeightKg: number;
}

export const WeightProjectionsCard: React.FC<WeightProjectionsCardProps> = ({
  weightHistory,
  currentWeightKg,
  targetWeightKg,
}) => {
  const projection = useMemo(() => {
    const isGoalLoss = targetWeightKg < currentWeightKg;
    const isGoalGain = targetWeightKg > currentWeightKg;
    const totalRemainingKg = Math.round(Math.abs(currentWeightKg - targetWeightKg) * 10) / 10;

    if (totalRemainingKg <= 0.2) {
      return {
        status: 'achieved' as const,
        weeklyVelocityKg: 0,
        daysRemaining: 0,
        projectedDateStr: 'Target Reached!',
        totalRemainingKg: 0,
        message: 'Congratulations! You have reached your target weight. You are currently in the metabolic maintenance phase.',
        paceStatus: 'Maintenance',
      };
    }

    // Need at least 2 entries to calculate velocity, or estimate a healthy baseline of 0.5 kg/week
    let weeklyVelocityKg = 0;

    if (weightHistory.length >= 2) {
      const first = weightHistory[0];
      const last = weightHistory[weightHistory.length - 1];
      const weightDelta = last.weightKg - first.weightKg;
      // Estimate time span in days (minimum 7 days to avoid division by 0)
      const daysSpan = Math.max(7, (weightHistory.length - 1) * 3);
      weeklyVelocityKg = Math.round((weightDelta / (daysSpan / 7)) * 100) / 100;
    } else {
      // Default recommended healthy velocity
      weeklyVelocityKg = isGoalLoss ? -0.5 : 0.35;
    }

    // Check if progress direction aligns with goal
    const isProgressingTowardsGoal =
      (isGoalLoss && weeklyVelocityKg < 0) || (isGoalGain && weeklyVelocityKg > 0);

    // If velocity is 0 or going away from goal, compute based on recommended pace (-0.5 kg/wk or +0.35 kg/wk)
    const effectiveWeeklyRate = isProgressingTowardsGoal
      ? Math.abs(weeklyVelocityKg)
      : isGoalLoss ? 0.5 : 0.35;

    const weeksNeeded = Math.max(1, totalRemainingKg / effectiveWeeklyRate);
    const daysNeeded = Math.round(weeksNeeded * 7);

    const projectedDate = new Date();
    projectedDate.setDate(projectedDate.getDate() + daysNeeded);
    const dateFormatted = projectedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    let paceStatus = 'Optimal Pace';
    if (isProgressingTowardsGoal) {
      if (Math.abs(weeklyVelocityKg) > 1.0) paceStatus = 'Aggressive Velocity';
      else if (Math.abs(weeklyVelocityKg) >= 0.4) paceStatus = 'Optimal Sustainable Pace';
      else paceStatus = 'Gradual Transition';
    } else {
      paceStatus = 'Deficit Adjustment Required';
    }

    return {
      status: isProgressingTowardsGoal ? ('on_track' as const) : ('adjust_needed' as const),
      weeklyVelocityKg,
      effectiveWeeklyRate,
      daysRemaining: daysNeeded,
      weeksRemaining: Math.round(weeksNeeded * 10) / 10,
      projectedDateStr: dateFormatted,
      totalRemainingKg,
      message: isProgressingTowardsGoal
        ? `At your current velocity of ${Math.abs(weeklyVelocityKg)} kg/week, you will hit your goal of ${targetWeightKg} kg on schedule.`
        : `Your weight trend has stabilized. A slight daily adjustment of -350 kcal will resume optimal progress toward your ${targetWeightKg} kg goal.`,
      paceStatus,
    };
  }, [weightHistory, currentWeightKg, targetWeightKg]);

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 rounded-3xl border border-indigo-500/20 p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              Goal Weight Projection
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 uppercase">
                Forecast
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Trajectory calculated from weigh-in velocity and remaining delta.
            </p>
          </div>
        </div>

        <span
          className={`self-start sm:self-auto text-xs font-black px-3 py-1 rounded-full border ${
            projection.status === 'achieved'
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              : projection.status === 'on_track'
              ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
              : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
          }`}
        >
          {projection.paceStatus}
        </span>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Estimated Date */}
        <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            Projected Target Date
          </span>
          <div className="text-base sm:text-lg font-black text-white">
            {projection.projectedDateStr}
          </div>
          <span className="text-[10px] text-slate-400">
            {projection.status === 'achieved' ? 'Goal Reached' : `in ~${projection.daysRemaining} days`}
          </span>
        </div>

        {/* Time Remaining */}
        <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            Estimated Duration
          </span>
          <div className="text-base sm:text-lg font-black text-cyan-300">
            {projection.status === 'achieved' ? '0 Weeks' : `${projection.weeksRemaining} Wks`}
          </div>
          <span className="text-[10px] text-slate-400">
            {projection.status === 'achieved' ? 'Maintenance' : 'To final goal'}
          </span>
        </div>

        {/* Current Weekly Velocity */}
        <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
            Current Velocity
          </span>
          <div className="text-base sm:text-lg font-black text-emerald-400">
            {projection.weeklyVelocityKg > 0 ? `+${projection.weeklyVelocityKg}` : projection.weeklyVelocityKg}{' '}
            <span className="text-xs font-normal text-slate-400">kg/wk</span>
          </div>
          <span className="text-[10px] text-slate-400">7-day rolling trend</span>
        </div>

        {/* Remaining Weight */}
        <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Scale className="w-3.5 h-3.5 text-amber-400" />
            Remaining Gap
          </span>
          <div className="text-base sm:text-lg font-black text-amber-400">
            {projection.totalRemainingKg} <span className="text-xs font-normal text-slate-400">kg</span>
          </div>
          <span className="text-[10px] text-slate-400">
            {currentWeightKg}kg → {targetWeightKg}kg
          </span>
        </div>
      </div>

      {/* Advisory / Coaching Note */}
      <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center gap-2.5 text-xs text-slate-300">
        <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
        <p className="leading-relaxed">
          {projection.message}
        </p>
      </div>
    </div>
  );
};
