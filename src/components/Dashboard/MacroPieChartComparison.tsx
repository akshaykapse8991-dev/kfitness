import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { UtensilsCrossed, PieChart as PieIcon, Layers, Columns2, Sparkles, CheckCircle2 } from 'lucide-react';

interface MacroPieChartComparisonProps {
  consumedProtein: number;
  consumedCarbs: number;
  consumedFat: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
}

interface MacroSlice {
  name: string;
  macro: 'Protein' | 'Carbohydrates' | 'Healthy Fats';
  type: 'Consumed' | 'Target';
  value: number;
  calories: number;
  pct: number;
  fill: string;
}

export const MacroPieChartComparison: React.FC<MacroPieChartComparisonProps> = ({
  consumedProtein,
  consumedCarbs,
  consumedFat,
  targetProtein,
  targetCarbs,
  targetFat,
}) => {
  const [chartMode, setChartMode] = useState<'concentric' | 'sideBySide'>('concentric');

  // Gram totals
  const totalTargetGrams = targetProtein + targetCarbs + targetFat || 1;
  const totalConsumedGrams = consumedProtein + consumedCarbs + consumedFat;

  // Calorie totals
  const targetCaloriesFromMacros = targetProtein * 4 + targetCarbs * 4 + targetFat * 9;
  const consumedCaloriesFromMacros = Math.round(consumedProtein * 4 + consumedCarbs * 4 + consumedFat * 9);

  // Target dataset
  const targetData: MacroSlice[] = [
    {
      name: 'Target Protein',
      macro: 'Protein',
      type: 'Target',
      value: targetProtein,
      calories: targetProtein * 4,
      pct: Math.round((targetProtein / totalTargetGrams) * 100),
      fill: '#10b981', // Emerald
    },
    {
      name: 'Target Carbs',
      macro: 'Carbohydrates',
      type: 'Target',
      value: targetCarbs,
      calories: targetCarbs * 4,
      pct: Math.round((targetCarbs / totalTargetGrams) * 100),
      fill: '#f59e0b', // Amber
    },
    {
      name: 'Target Fats',
      macro: 'Healthy Fats',
      type: 'Target',
      value: targetFat,
      calories: targetFat * 9,
      pct: Math.round((targetFat / totalTargetGrams) * 100),
      fill: '#f43f5e', // Rose
    },
  ];

  // Consumed dataset
  const hasConsumed = totalConsumedGrams > 0;
  const consumedData: MacroSlice[] = hasConsumed
    ? [
        {
          name: 'Consumed Protein',
          macro: 'Protein',
          type: 'Consumed',
          value: Math.round(consumedProtein * 10) / 10,
          calories: Math.round(consumedProtein * 4),
          pct: Math.round((consumedProtein / totalConsumedGrams) * 100),
          fill: '#34d399', // Bright Emerald
        },
        {
          name: 'Consumed Carbs',
          macro: 'Carbohydrates',
          type: 'Consumed',
          value: Math.round(consumedCarbs * 10) / 10,
          calories: Math.round(consumedCarbs * 4),
          pct: Math.round((consumedCarbs / totalConsumedGrams) * 100),
          fill: '#fbbf24', // Bright Amber
        },
        {
          name: 'Consumed Fats',
          macro: 'Healthy Fats',
          type: 'Consumed',
          value: Math.round(consumedFat * 10) / 10,
          calories: Math.round(consumedFat * 9),
          pct: Math.round((consumedFat / totalConsumedGrams) * 100),
          fill: '#fb7185', // Bright Rose
        },
      ]
    : [
        {
          name: 'No Food Logged Yet',
          macro: 'Protein',
          type: 'Consumed',
          value: 1,
          calories: 0,
          pct: 0,
          fill: '#334155', // Slate placeholder
        },
      ];

  // Custom Dark Theme Tooltip
  const renderCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: MacroSlice = payload[0].payload;
      if (!hasConsumed && data.type === 'Consumed') {
        return (
          <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1 backdrop-blur-md">
            <p className="font-bold text-slate-300">No Food Logged Today</p>
            <p className="text-[11px] text-slate-400">Scan meals or add Indian foods to track macros.</p>
          </div>
        );
      }
      return (
        <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 backdrop-blur-md min-w-[170px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1">
            <span className="font-bold text-white flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: data.fill }} />
              {data.macro}
            </span>
            <span
              className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                data.type === 'Consumed'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {data.type}
            </span>
          </div>

          <div className="space-y-0.5 pt-0.5">
            <p className="text-sm font-black text-slate-100">
              {data.value}g{' '}
              <span className="text-xs font-normal text-slate-400">({data.calories} kcal)</span>
            </p>
            <p className="text-[11px] text-slate-400">
              <span className="text-emerald-400 font-semibold">{data.pct}%</span> of total {data.type.toLowerCase()} macros
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const macroProgress = [
    {
      label: 'Protein',
      consumed: consumedProtein,
      target: targetProtein,
      color: 'emerald',
      barBg: 'bg-emerald-500',
      textBg: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
      calMultiplier: 4,
    },
    {
      label: 'Carbohydrates',
      consumed: consumedCarbs,
      target: targetCarbs,
      color: 'amber',
      barBg: 'bg-amber-500',
      textBg: 'text-amber-400',
      badgeBg: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
      calMultiplier: 4,
    },
    {
      label: 'Healthy Fats',
      consumed: consumedFat,
      target: targetFat,
      color: 'rose',
      barBg: 'bg-rose-500',
      textBg: 'text-rose-400',
      badgeBg: 'bg-rose-500/10 border-rose-500/20 text-rose-300',
      calMultiplier: 9,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Controls & Mode Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <PieIcon className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Recharts Visual Comparison
          </span>
        </div>

        {/* View Mode Toggle: Concentric vs Side by Side */}
        <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 self-start sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setChartMode('concentric')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              chartMode === 'concentric'
                ? 'bg-slate-800 text-emerald-400 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Dual Ring (Inner vs Outer)</span>
          </button>

          <button
            type="button"
            onClick={() => setChartMode('sideBySide')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              chartMode === 'sideBySide'
                ? 'bg-slate-800 text-emerald-400 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span>Side-by-Side</span>
          </button>
        </div>
      </div>

      {/* Chart Render Area */}
      {chartMode === 'concentric' ? (
        <div className="relative bg-slate-950/60 rounded-2xl border border-slate-800/80 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border border-dashed border-slate-400 bg-slate-700 inline-block" />
              Outer Ring: <strong className="text-slate-200">Daily Target Split</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
              Inner Ring: <strong className="text-slate-200">Today&apos;s Consumed</strong>
            </span>
          </div>

          <div className="w-full h-64 sm:h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={renderCustomTooltip} />

                {/* Outer Ring: Daily Target Split */}
                <Pie
                  data={targetData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={3}
                  stroke="#0f172a"
                  strokeWidth={2}
                  isAnimationActive={true}
                >
                  {targetData.map((entry, index) => (
                    <Cell key={`target-cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>

                {/* Inner Ring: Consumed Intake */}
                <Pie
                  data={consumedData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={62}
                  paddingAngle={hasConsumed ? 3 : 0}
                  stroke="#0f172a"
                  strokeWidth={2}
                  isAnimationActive={true}
                >
                  {consumedData.map((entry, index) => (
                    <Cell key={`consumed-cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {!hasConsumed && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-slate-900/90 border border-slate-700/80 px-3.5 py-1.5 rounded-xl shadow-xl text-center">
                <span className="text-[11px] font-bold text-slate-300 block">Inner Ring: 0g Logged</span>
                <span className="text-[10px] text-emerald-400 font-semibold">Log meals to fill ring</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Side-by-Side Dual Charts */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Consumed Pie */}
          <div className="bg-slate-950/60 rounded-2xl border border-slate-800/80 p-4 flex flex-col items-center">
            <div className="w-full flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-slate-200">Today&apos;s Consumed</span>
              <span className="font-extrabold text-emerald-400">
                {Math.round(totalConsumedGrams)}g ({consumedCaloriesFromMacros} kcal)
              </span>
            </div>

            <div className="w-full h-52 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={renderCustomTooltip} />
                  <Pie
                    data={consumedData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={68}
                    paddingAngle={hasConsumed ? 3 : 0}
                    stroke="#0f172a"
                    strokeWidth={2}
                  >
                    {consumedData.map((entry, index) => (
                      <Cell key={`c-pie-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              {hasConsumed ? 'Macronutrient intake share' : 'No food entries logged today'}
            </span>
          </div>

          {/* Target Pie */}
          <div className="bg-slate-950/60 rounded-2xl border border-slate-800/80 p-4 flex flex-col items-center">
            <div className="w-full flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-slate-200">Daily Target Split</span>
              <span className="font-extrabold text-slate-300">
                {totalTargetGrams}g ({targetCaloriesFromMacros} kcal)
              </span>
            </div>

            <div className="w-full h-52 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={renderCustomTooltip} />
                  <Pie
                    data={targetData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={68}
                    paddingAngle={3}
                    stroke="#0f172a"
                    strokeWidth={2}
                  >
                    {targetData.map((entry, index) => (
                      <Cell key={`t-pie-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Recommended target ratio</span>
          </div>
        </div>
      )}

      {/* Macro Legend & Direct Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {macroProgress.map((item) => {
          const pct = Math.min(100, Math.round((item.consumed / item.target) * 100));
          const diff = Math.round((item.target - item.consumed) * 10) / 10;
          return (
            <div
              key={item.label}
              className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/90 flex flex-col justify-between space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${item.textBg} flex items-center gap-1.5`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${item.barBg} inline-block`} />
                  {item.label}
                </span>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${item.badgeBg}`}>
                  {pct}%
                </span>
              </div>

              <div className="flex items-baseline justify-between text-xs">
                <span className="text-slate-400 font-medium">Consumed:</span>
                <span className="text-sm font-black text-white">
                  {item.consumed}g <span className="text-slate-500 font-normal">/ {item.target}g</span>
                </span>
              </div>

              {/* Progress Mini Bar */}
              <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  style={{ width: `${pct}%` }}
                  className={`h-full ${item.barBg} transition-all duration-500 rounded-full`}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                <span>{diff <= 0 ? 'Goal Met!' : `${diff}g left`}</span>
                <span className="text-slate-500 font-mono">
                  {Math.round(item.consumed * item.calMultiplier)} / {item.target * item.calMultiplier} kcal
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
