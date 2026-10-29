import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Dumbbell,
  Bed,
  Footprints,
  Flame,
  Info,
  Clock,
  Play,
  Move,
  X,
} from 'lucide-react';
import { ScheduledWorkoutSession, WorkoutDayType, Exercise } from '../../types/fitness';
import { EXERCISES_DATABASE } from '../../data/exercises';
import {
  generateMonthlyCalendar,
  moveSession,
  checkFatigueStreak,
  toISODateString,
  SplitType,
} from '../../utils/calendarPlanner';

interface AdaptiveCalendarViewProps {
  onStartExercise?: (exercise: Exercise) => void;
  onNavigateTab?: (tab: any) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const AdaptiveCalendarView: React.FC<AdaptiveCalendarViewProps> = ({
  onStartExercise,
  onNavigateTab,
}) => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());
  const [selectedSplit, setSelectedSplit] = useState<SplitType>('ppl_5day');

  // Calendar schedule state stored by dateString ("YYYY-MM-DD")
  const [calendarSchedule, setCalendarSchedule] = useState<Record<string, ScheduledWorkoutSession>>(() => {
    try {
      const stored = localStorage.getItem('kapse_fitness_training_calendar');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Calendar load error', e);
    }
    return generateMonthlyCalendar(today.getFullYear(), today.getMonth(), 'ppl_5day');
  });

  // Drag and Drop state
  const [draggedDate, setDraggedDate] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  // Manual move modal state (for mobile / one-click moves)
  const [movingSessionDate, setMovingSessionDate] = useState<string | null>(null);
  const [targetMoveDate, setTargetMoveDate] = useState<string>('');

  // Selected Day Details Modal
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Save to localStorage whenever schedule changes
  useEffect(() => {
    try {
      localStorage.setItem('kapse_fitness_training_calendar', JSON.stringify(calendarSchedule));
    } catch (e) {
      console.warn('Calendar save error', e);
    }
  }, [calendarSchedule]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleGoToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  // Regeneration from split
  const handleRegenerateFromSplit = (split: SplitType) => {
    setSelectedSplit(split);
    const newMonthData = generateMonthlyCalendar(currentYear, currentMonth, split);
    setCalendarSchedule((prev) => ({ ...prev, ...newMonthData }));
    showToast(`Updated calendar schedule with ${split.replace('_', ' ').toUpperCase()} split`);
  };

  // Move or swap session between dates
  const handlePerformMove = (sourceDate: string, destinationDate: string) => {
    if (sourceDate === destinationDate) return;
    setCalendarSchedule((prev) => moveSession(prev, sourceDate, destinationDate));
    setMovingSessionDate(null);
    setTargetMoveDate('');
    showToast(`Rescheduled session from ${sourceDate} to ${destinationDate}`);
  };

  const handleToggleComplete = (dateStr: string) => {
    setCalendarSchedule((prev) => {
      const existing = prev[dateStr];
      if (!existing) return prev;
      return {
        ...prev,
        [dateStr]: {
          ...existing,
          completed: !existing.completed,
        },
      };
    });
  };

  const handleQuickInsertRest = (dateStr: string) => {
    setCalendarSchedule((prev) => {
      const existing = prev[dateStr];
      if (!existing) return prev;
      return {
        ...prev,
        [dateStr]: {
          ...existing,
          type: 'rest',
          title: 'Rest & Recovery Day',
          focus: 'Inserted recovery day for fatigue adaptation',
          exerciseIds: [],
          durationMinutes: 0,
          completed: false,
        },
      };
    });
    showToast(`Converted ${dateStr} into a rest day.`);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, dateStr: string) => {
    e.dataTransfer.setData('text/plain', dateStr);
    setDraggedDate(dateStr);
  };

  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    setDragOverDate(dateStr);
  };

  const handleDrop = (e: React.DragEvent, targetDate: string) => {
    e.preventDefault();
    const sourceDate = e.dataTransfer.getData('text/plain') || draggedDate;
    if (sourceDate && sourceDate !== targetDate) {
      handlePerformMove(sourceDate, targetDate);
    }
    setDraggedDate(null);
    setDragOverDate(null);
  };

  // Month grid computations
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  // Monday as 0, Sunday as 6
  const startDayOffset = (firstDayOfMonth + 6) % 7;

  const todayIso = toISODateString(today.getFullYear(), today.getMonth(), today.getDate());
  const fatigueAlert = checkFatigueStreak(calendarSchedule);

  const selectedDaySession = selectedDayDate ? calendarSchedule[selectedDayDate] : null;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Adaptive Periodization
              </span>
              <span className="text-xs text-slate-400">Drag & Drop / Reschedule Workouts</span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">
              Adaptive Training Calendar
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Plan and reschedule your workout sessions across the month. Drag any session to swap days, adapt to sudden life events, monitor fatigue, and avoid overtraining.
            </p>
          </div>

          {/* Quick Split Generator Toolbar */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
              Apply Split:
            </span>
            <button
              onClick={() => handleRegenerateFromSplit('ppl_5day')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedSplit === 'ppl_5day'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              5-Day PPL
            </button>
            <button
              onClick={() => handleRegenerateFromSplit('home_4day')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedSplit === 'home_4day'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              4-Day Home
            </button>
            <button
              onClick={() => handleRegenerateFromSplit('fullbody_3day')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedSplit === 'fullbody_3day'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              3-Day Full Body
            </button>
          </div>
        </div>

        {/* Fatigue Warning Banner */}
        {fatigueAlert.warning && (
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs flex items-start justify-between gap-3 animate-fade-in shadow-lg">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-200">Adaptive Fatigue Warning: </span>
                You have {fatigueAlert.consecutiveDays} consecutive lifting sessions scheduled without a recovery day. Extended streaks without rest increase systemic cortisol and injury risk.
              </div>
            </div>
            {fatigueAlert.endDate && (
              <button
                onClick={() => handleQuickInsertRest(fatigueAlert.endDate!)}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shrink-0 text-xs shadow cursor-pointer"
              >
                Insert Rest Day
              </button>
            )}
          </div>
        )}

        {toastMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>

      {/* Calendar Navigation Bar */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl font-black text-white">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </h2>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleGoToday}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
          >
            Today
          </button>
          <div className="flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-4 sm:p-6 shadow-xl">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-bold uppercase tracking-wider text-slate-400 pb-3 border-b border-slate-800">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 pt-3">
          {/* Empty cells before 1st of month */}
          {Array.from({ length: startDayOffset }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="min-h-[100px] sm:min-h-[125px] rounded-2xl bg-slate-950/20 border border-transparent opacity-30"
            />
          ))}

          {/* Days of Month */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dateStr = toISODateString(currentYear, currentMonth, dayNum);
            const session = calendarSchedule[dateStr];
            const isToday = dateStr === todayIso;
            const isDragOver = dragOverDate === dateStr;

            const isRest = session?.type === 'rest';
            const isActiveRecovery = session?.type === 'active_recovery';
            const isDeload = session?.type === 'deload';
            const isWorkout = session?.type === 'workout';
            const isCompleted = session?.completed;

            return (
              <div
                key={dateStr}
                draggable={!!session && !isRest}
                onDragStart={(e) => handleDragStart(e, dateStr)}
                onDragOver={(e) => handleDragOver(e, dateStr)}
                onDragLeave={() => setDragOverDate(null)}
                onDrop={(e) => handleDrop(e, dateStr)}
                onClick={() => setSelectedDayDate(dateStr)}
                className={`group min-h-[105px] sm:min-h-[135px] p-2 sm:p-2.5 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer relative select-none ${
                  isToday
                    ? 'ring-2 ring-emerald-400 border-emerald-500/50 bg-slate-850'
                    : isDragOver
                    ? 'border-amber-400 bg-amber-500/10 shadow-lg scale-[1.02]'
                    : isCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50'
                    : isWorkout
                    ? 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600 hover:bg-slate-800/90'
                    : isDeload
                    ? 'bg-indigo-950/20 border-indigo-500/30 hover:border-indigo-500/50'
                    : isActiveRecovery
                    ? 'bg-cyan-950/20 border-cyan-500/30 hover:border-cyan-500/50'
                    : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-900/60'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                      isToday
                        ? 'bg-emerald-500 text-slate-950'
                        : isCompleted
                        ? 'text-emerald-400'
                        : 'text-slate-300'
                    }`}
                  >
                    {dayNum}
                  </span>

                  {session && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleComplete(dateStr);
                      }}
                      title={isCompleted ? 'Mark uncompleted' : 'Mark completed'}
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer ${
                        isCompleted
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                          : 'border-slate-600 bg-slate-900 text-transparent hover:border-emerald-400'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3 stroke-[3]" />
                    </button>
                  )}
                </div>

                {/* Session Card Content */}
                {session ? (
                  <div className="mt-1 space-y-1">
                    <p
                      className={`text-[11px] sm:text-xs font-bold leading-tight line-clamp-2 ${
                        isCompleted
                          ? 'text-emerald-300 line-through opacity-80'
                          : isWorkout
                          ? 'text-amber-300'
                          : isDeload
                          ? 'text-indigo-300'
                          : isActiveRecovery
                          ? 'text-cyan-300'
                          : 'text-slate-500'
                      }`}
                    >
                      {session.title.split('(')[0].trim()}
                    </p>

                    {/* Metadata pill */}
                    <div className="flex items-center gap-1 text-[9px] text-slate-400">
                      {isWorkout ? (
                        <>
                          <Dumbbell className="w-2.5 h-2.5 text-amber-400" />
                          <span>{session.durationMinutes}m</span>
                          <span>•</span>
                          <span>{session.exerciseIds.length} ex</span>
                        </>
                      ) : isActiveRecovery ? (
                        <>
                          <Footprints className="w-2.5 h-2.5 text-cyan-400" />
                          <span>Active Walk</span>
                        </>
                      ) : isDeload ? (
                        <span>50% Deload</span>
                      ) : (
                        <span className="text-slate-500">Rest</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-600 italic">No session</div>
                )}

                {/* Quick Move Trigger Icon on Hover */}
                <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity pt-1 text-[9px] text-slate-400">
                  <span className="flex items-center gap-0.5 text-slate-400 hover:text-white">
                    <Move className="w-2.5 h-2.5" />
                    <span className="hidden sm:inline">Drag</span>
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMovingSessionDate(dateStr);
                    }}
                    className="text-amber-400 hover:text-amber-300 font-bold"
                  >
                    Move
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Manual Move / Reschedule Modal */}
      {movingSessionDate && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Reschedule Workout Session
                </span>
                <h3 className="text-lg font-black text-white mt-0.5">Move Session</h3>
                <p className="text-xs text-slate-400">
                  Moving from: <strong className="text-slate-200">{movingSessionDate}</strong>
                </p>
              </div>
              <button
                onClick={() => setMovingSessionDate(null)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Select Target Destination Date:</label>
                <input
                  type="date"
                  value={targetMoveDate}
                  onChange={(e) => setTargetMoveDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <p className="text-[11px] text-slate-400 italic">
                💡 If the destination day already has a workout scheduled, the two sessions will automatically swap!
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setMovingSessionDate(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!targetMoveDate}
                onClick={() => handlePerformMove(movingSessionDate, targetMoveDate)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
              >
                Confirm Move
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Day Details Drawer / Modal */}
      {selectedDayDate && selectedDaySession && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>Scheduled Session • {selectedDayDate}</span>
                </span>
                <h3 className="text-xl font-black text-white mt-1">{selectedDaySession.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedDaySession.focus}</p>
              </div>

              <button
                onClick={() => setSelectedDayDate(null)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 font-bold block">Type</span>
                <span className="font-bold text-slate-200 capitalize">{selectedDaySession.type}</span>
              </div>
              <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 font-bold block">Est. Duration</span>
                <span className="font-bold text-amber-400">{selectedDaySession.durationMinutes} mins</span>
              </div>
              <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 font-bold block">Status</span>
                <span className={`font-bold ${selectedDaySession.completed ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {selectedDaySession.completed ? 'Completed ✓' : 'Scheduled'}
                </span>
              </div>
            </div>

            {/* Exercise List */}
            {selectedDaySession.exerciseIds.length > 0 ? (
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Prescribed Exercise Movements ({selectedDaySession.exerciseIds.length})
                </span>
                {selectedDaySession.exerciseIds.map((exId, idx) => {
                  const ex = EXERCISES_DATABASE.find((e) => e.id === exId);
                  if (!ex) return null;
                  return (
                    <div
                      key={exId}
                      className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-black flex items-center justify-center shrink-0 text-[10px]">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-100 block truncate">{ex.name}</span>
                          <span className="text-[11px] text-slate-400">{ex.muscleLabel}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-slate-300 font-semibold">{ex.defaultSets} sets</span>
                        <span className="text-[10px] text-slate-500 block">{ex.defaultReps}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
                <Bed className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-300">Rest & Recovery Focus</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Take a light walk, drink plenty of water, and nourish your body with wholesome Indian meals to let muscle fibers regenerate.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => {
                  setMovingSessionDate(selectedDayDate);
                  setSelectedDayDate(null);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold transition-all cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
                <span>Move to Another Day</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleToggleComplete(selectedDayDate);
                    setSelectedDayDate(null);
                  }}
                  className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                    selectedDaySession.completed
                      ? 'bg-slate-800 text-slate-300 border border-slate-700'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                  }`}
                >
                  {selectedDaySession.completed ? 'Mark Incomplete' : 'Mark Completed ✓'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
