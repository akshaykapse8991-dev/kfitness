import React, { useState, useEffect, useRef } from 'react';
import {
  Dumbbell,
  Plus,
  Play,
  CheckCircle2,
  Trash2,
  Copy,
  Edit3,
  Clock,
  Flame,
  Sparkles,
  Search,
  Filter,
  ArrowLeft,
  Check,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Trophy,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  Info,
  Calendar,
  Zap,
} from 'lucide-react';
import {
  WorkoutTemplate,
  WorkoutTemplateExercise,
  WorkoutTemplateCategory,
  ExerciseLogItem,
  WorkoutSetRecord,
} from '../../types/fitness';
import { DEFAULT_WORKOUT_TEMPLATES } from '../../data/workoutTemplatesData';
import { EXERCISES_DATABASE } from '../../data/exercises';
import { playShortBeep, playTimerFinishChime } from '../../utils/audioChime';

interface WorkoutTemplatesViewProps {
  onLogExerciseSession: (session: ExerciseLogItem) => void;
  onOpenTimer?: () => void;
}

const STORAGE_KEY_CUSTOM_TEMPLATES = 'kapse_custom_workout_templates';
const STORAGE_KEY_STATS = 'kapse_templates_stats';

interface TemplateStatsRecord {
  timesCompleted: number;
  lastUsedAt?: string;
}

export const WorkoutTemplatesView: React.FC<WorkoutTemplatesViewProps> = ({
  onLogExerciseSession,
}) => {
  // All templates state (built-in + custom)
  const [customTemplates, setCustomTemplates] = useState<WorkoutTemplate[]>([]);
  const [templateStats, setTemplateStats] = useState<{ [id: string]: TemplateStatsRecord }>({});

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<WorkoutTemplateCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Active Modes
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<WorkoutTemplate | null>(null);

  // Active Runner State
  const [activeRunningTemplate, setActiveRunningTemplate] = useState<WorkoutTemplate | null>(null);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [activeSessionSets, setActiveSessionSets] = useState<{ [exId: string]: WorkoutSetRecord[] }>({});
  const [sessionElapsedSeconds, setSessionElapsedSeconds] = useState(0);
  const [isSessionPaused, setIsSessionPaused] = useState(false);

  // Between-set rest timer in active runner
  const [runnerRestSeconds, setRunnerRestSeconds] = useState(0);
  const [runnerRestInitial, setRunnerRestInitial] = useState(60);
  const [isRestRunning, setIsRestRunning] = useState(false);
  const [restSoundEnabled, setRestSoundEnabled] = useState(true);

  // Completion Victory Modal
  const [workoutCompleteSummary, setWorkoutCompleteSummary] = useState<{
    templateName: string;
    totalSets: number;
    totalVolumeKg: number;
    durationMinutes: number;
  } | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form builder state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState<WorkoutTemplateCategory>('push');
  const [formDuration, setFormDuration] = useState(45);
  const [formExercises, setFormExercises] = useState<WorkoutTemplateExercise[]>([]);
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerMuscleFilter, setPickerMuscleFilter] = useState<string>('all');

  const sessionIntervalRef = useRef<any>(null);
  const restIntervalRef = useRef<any>(null);

  // Load custom templates & stats from localStorage
  useEffect(() => {
    try {
      const storedCustom = localStorage.getItem(STORAGE_KEY_CUSTOM_TEMPLATES);
      if (storedCustom) {
        setCustomTemplates(JSON.parse(storedCustom));
      }
      const storedStats = localStorage.getItem(STORAGE_KEY_STATS);
      if (storedStats) {
        setTemplateStats(JSON.parse(storedStats));
      }
    } catch (e) {
      console.error('Failed to load workout templates from localStorage', e);
    }
  }, []);

  // Save custom templates
  const saveCustomTemplatesToStorage = (updated: WorkoutTemplate[]) => {
    setCustomTemplates(updated);
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_TEMPLATES, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save templates', e);
    }
  };

  // Save stats
  const saveStatsToStorage = (updatedStats: { [id: string]: TemplateStatsRecord }) => {
    setTemplateStats(updatedStats);
    try {
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(updatedStats));
    } catch (e) {
      console.error('Failed to save stats', e);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Combined templates
  const allTemplates = [...DEFAULT_WORKOUT_TEMPLATES, ...customTemplates].map((tmpl) => {
    const stats = templateStats[tmpl.id];
    return {
      ...tmpl,
      timesCompleted: stats?.timesCompleted ?? tmpl.timesCompleted ?? 0,
      lastUsedAt: stats?.lastUsedAt ?? tmpl.lastUsedAt,
    };
  });

  // Filtered templates
  const filteredTemplates = allTemplates.filter((tmpl) => {
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'custom' && !tmpl.isCustom) return false;
      if (selectedCategory !== 'custom' && tmpl.category !== selectedCategory) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = tmpl.name.toLowerCase().includes(q);
      const matchDesc = tmpl.description.toLowerCase().includes(q);
      const matchEx = tmpl.exercises.some((e) => e.exerciseName.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchEx) return false;
    }
    return true;
  });

  // Session elapsed timer ticker
  useEffect(() => {
    if (activeRunningTemplate && !isSessionPaused) {
      sessionIntervalRef.current = setInterval(() => {
        setSessionElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);
    }
    return () => {
      if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);
    };
  }, [activeRunningTemplate, isSessionPaused]);

  // Runner Rest timer ticker
  useEffect(() => {
    if (isRestRunning && runnerRestSeconds > 0) {
      restIntervalRef.current = setInterval(() => {
        setRunnerRestSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(restIntervalRef.current);
            setIsRestRunning(false);
            if (restSoundEnabled) playTimerFinishChime();
            return 0;
          }
          if (prev <= 4 && prev > 1 && restSoundEnabled) {
            playShortBeep(750, 0.08);
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    }
    return () => {
      if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    };
  }, [isRestRunning, runnerRestSeconds, restSoundEnabled]);

  const triggerRestTimer = (seconds: number) => {
    setRunnerRestInitial(seconds);
    setRunnerRestSeconds(seconds);
    setIsRestRunning(true);
    if (restSoundEnabled) playShortBeep(880, 0.1);
  };

  // Start Workout Runner with a template
  const handleStartWorkout = (template: WorkoutTemplate) => {
    setActiveRunningTemplate(template);
    setActiveExerciseIndex(0);
    setSessionElapsedSeconds(0);
    setIsSessionPaused(false);
    setRunnerRestSeconds(0);
    setIsRestRunning(false);

    // Initialize set records for each exercise
    const initialSetsMap: { [exId: string]: WorkoutSetRecord[] } = {};
    template.exercises.forEach((ex) => {
      const dbEx = EXERCISES_DATABASE.find((d) => d.id === ex.exerciseId);
      const targetRepsNum = parseInt(ex.targetReps) || (dbEx ? parseInt(dbEx.defaultReps) : 10) || 10;
      const targetWeight = ex.targetWeightKg ?? (dbEx?.equipment === 'bodyweight' ? 0 : 20);

      initialSetsMap[ex.exerciseId] = Array.from({ length: ex.targetSets || 3 }).map((_, idx) => ({
        setNumber: idx + 1,
        reps: targetRepsNum,
        weightKg: targetWeight,
        completed: false,
      }));
    });

    setActiveSessionSets(initialSetsMap);
    setPreviewTemplate(null);
  };

  // Toggle set completion in active runner
  const handleToggleSetCompleted = (exId: string, setIndex: number, restSec: number = 60) => {
    setActiveSessionSets((prev) => {
      const currentSets = prev[exId] || [];
      const updated = [...currentSets];
      const targetSet = updated[setIndex];
      const isNowCompleted = !targetSet.completed;
      updated[setIndex] = { ...targetSet, completed: isNowCompleted };

      if (isNowCompleted) {
        triggerRestTimer(restSec);
      }
      return { ...prev, [exId]: updated };
    });
  };

  // Update reps or weight in active runner
  const handleUpdateSetField = (
    exId: string,
    setIndex: number,
    field: 'reps' | 'weightKg',
    value: number
  ) => {
    setActiveSessionSets((prev) => {
      const currentSets = prev[exId] || [];
      const updated = [...currentSets];
      updated[setIndex] = { ...updated[setIndex], [field]: Math.max(0, value) };
      return { ...prev, [exId]: updated };
    });
  };

  // Add set to active runner exercise
  const handleAddSetToExercise = (exId: string) => {
    setActiveSessionSets((prev) => {
      const currentSets = prev[exId] || [];
      const lastSet = currentSets[currentSets.length - 1];
      const newSet: WorkoutSetRecord = {
        setNumber: currentSets.length + 1,
        reps: lastSet ? lastSet.reps : 10,
        weightKg: lastSet ? lastSet.weightKg : 0,
        completed: false,
      };
      return { ...prev, [exId]: [...currentSets, newSet] };
    });
  };

  // Complete & Save full template workout
  const handleFinishWorkout = () => {
    if (!activeRunningTemplate) return;

    let totalCompletedSetsCount = 0;
    let totalVolumeKg = 0;

    // Log each exercise that has at least one completed set
    activeRunningTemplate.exercises.forEach((tmplEx) => {
      const sets = activeSessionSets[tmplEx.exerciseId] || [];
      const completedSets = sets.filter((s) => s.completed);

      if (completedSets.length > 0) {
        totalCompletedSetsCount += completedSets.length;
        completedSets.forEach((s) => {
          totalVolumeKg += (s.weightKg || 0) * (s.reps || 0);
        });

        const dbEx = EXERCISES_DATABASE.find((d) => d.id === tmplEx.exerciseId);
        const logItem: ExerciseLogItem = {
          id: `log-template-${Date.now()}-${tmplEx.exerciseId}`,
          exerciseId: tmplEx.exerciseId,
          exerciseName: tmplEx.exerciseName,
          targetMuscle: dbEx?.muscleLabel || 'Full Body',
          sets: sets,
          timestamp: new Date().toISOString(),
        };
        onLogExerciseSession(logItem);
      }
    });

    // Update stats for this template
    const currentStats = templateStats[activeRunningTemplate.id] || { timesCompleted: 0 };
    const updatedStats = {
      ...templateStats,
      [activeRunningTemplate.id]: {
        timesCompleted: currentStats.timesCompleted + 1,
        lastUsedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      },
    };
    saveStatsToStorage(updatedStats);

    // Show victory modal
    setWorkoutCompleteSummary({
      templateName: activeRunningTemplate.name,
      totalSets: totalCompletedSetsCount,
      totalVolumeKg: Math.round(totalVolumeKg),
      durationMinutes: Math.max(1, Math.round(sessionElapsedSeconds / 60)),
    });

    setActiveRunningTemplate(null);
    setIsRestRunning(false);
    playTimerFinishChime();
  };

  // Template CRUD actions
  const handleOpenCreateModal = () => {
    setEditingTemplateId(null);
    setFormName('');
    setFormDesc('');
    setFormCategory('push');
    setFormDuration(45);
    setFormExercises([]);
    setIsBuilderOpen(true);
  };

  const handleEditTemplate = (tmpl: WorkoutTemplate) => {
    setEditingTemplateId(tmpl.id);
    setFormName(tmpl.name);
    setFormDesc(tmpl.description);
    setFormCategory(tmpl.category);
    setFormDuration(tmpl.estimatedDurationMinutes);
    setFormExercises([...tmpl.exercises]);
    setIsBuilderOpen(true);
  };

  const handleDuplicateTemplate = (tmpl: WorkoutTemplate) => {
    const duplicated: WorkoutTemplate = {
      ...tmpl,
      id: `template-custom-${Date.now()}`,
      name: `${tmpl.name} (Copy)`,
      isCustom: true,
      createdAt: new Date().toISOString(),
      timesCompleted: 0,
      lastUsedAt: undefined,
    };
    const updated = [duplicated, ...customTemplates];
    saveCustomTemplatesToStorage(updated);
    showToast(`"${duplicated.name}" created and added to your templates!`);
  };

  const handleDeleteTemplate = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete template "${name}"?`)) {
      const updated = customTemplates.filter((t) => t.id !== id);
      saveCustomTemplatesToStorage(updated);
      showToast(`Template "${name}" deleted.`);
      if (previewTemplate?.id === id) setPreviewTemplate(null);
    }
  };

  const handleSaveTemplateForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Please enter a template name.');
      return;
    }
    if (formExercises.length === 0) {
      alert('Please add at least one exercise to the template.');
      return;
    }

    if (editingTemplateId) {
      // Check if editing built-in or custom
      const isExistingCustom = customTemplates.some((t) => t.id === editingTemplateId);
      if (isExistingCustom) {
        const updated = customTemplates.map((t) => {
          if (t.id === editingTemplateId) {
            return {
              ...t,
              name: formName.trim(),
              description: formDesc.trim(),
              category: formCategory,
              estimatedDurationMinutes: Number(formDuration) || 45,
              exercises: formExercises,
            };
          }
          return t;
        });
        saveCustomTemplatesToStorage(updated);
        showToast(`Template "${formName}" updated successfully!`);
      } else {
        // Was editing a built-in template -> save as a new custom template
        const newCustom: WorkoutTemplate = {
          id: `template-custom-${Date.now()}`,
          name: `${formName.trim()} (Custom)`,
          description: formDesc.trim(),
          category: formCategory,
          estimatedDurationMinutes: Number(formDuration) || 45,
          exercises: formExercises,
          isCustom: true,
          createdAt: new Date().toISOString(),
          timesCompleted: 0,
        };
        saveCustomTemplatesToStorage([newCustom, ...customTemplates]);
        showToast(`Custom version saved as "${newCustom.name}"!`);
      }
    } else {
      // Create new
      const newTemplate: WorkoutTemplate = {
        id: `template-custom-${Date.now()}`,
        name: formName.trim(),
        description: formDesc.trim() || 'Custom workout routine',
        category: formCategory,
        estimatedDurationMinutes: Number(formDuration) || 45,
        exercises: formExercises,
        isCustom: true,
        createdAt: new Date().toISOString(),
        timesCompleted: 0,
      };
      saveCustomTemplatesToStorage([newTemplate, ...customTemplates]);
      showToast(`New template "${newTemplate.name}" created!`);
    }

    setIsBuilderOpen(false);
  };

  // Add exercise to builder
  const handleAddExerciseToForm = (exerciseId: string) => {
    const dbEx = EXERCISES_DATABASE.find((e) => e.id === exerciseId);
    if (!dbEx) return;

    const newTmplEx: WorkoutTemplateExercise = {
      exerciseId: dbEx.id,
      exerciseName: dbEx.name,
      targetSets: dbEx.defaultSets || 3,
      targetReps: dbEx.defaultReps || '10-12',
      targetWeightKg: dbEx.equipment === 'bodyweight' ? 0 : 20,
      restSeconds: 60,
      notes: '',
    };

    setFormExercises((prev) => [...prev, newTmplEx]);
    setIsExercisePickerOpen(false);
  };

  // Move exercise up/down in builder
  const handleMoveExercise = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === formExercises.length - 1) return;

    setFormExercises((prev) => {
      const copy = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  // Remove exercise from builder
  const handleRemoveExerciseFromForm = (index: number) => {
    setFormExercises((prev) => prev.filter((_, i) => i !== index));
  };

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder.toString().padStart(2, '0')}`;
  };

  // Category tags
  const categories: { id: WorkoutTemplateCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All Templates' },
    { id: 'push', label: 'Push' },
    { id: 'pull', label: 'Pull' },
    { id: 'legs', label: 'Legs' },
    { id: 'full_body', label: 'Full Body' },
    { id: 'arms_core', label: 'Arms & Core' },
    { id: 'custom', label: 'My Custom' },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-500 text-slate-950 font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-400 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner & Stats */}
      <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Reusable Workout Templates</span>
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                {allTemplates.length} Available ({customTemplates.length} Custom)
              </span>
            </div>
            <h2 className="text-2xl font-black text-white mt-1">
              Custom Workout Routines & Splits
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Save favorite exercise sequences, customize target sets, reps, and rest timers, or launch live interactive tracking sessions.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Template</span>
            </button>
          </div>
        </div>

        {/* Filter bar and search */}
        <div className="pt-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search routines or exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTemplates.map((template) => {
          const isCustom = template.isCustom;
          return (
            <div
              key={template.id}
              className="bg-slate-900/90 rounded-3xl border border-slate-800 hover:border-slate-700 p-5 shadow-xl flex flex-col justify-between transition-all group"
            >
              <div className="space-y-3.5">
                {/* Header row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        template.category === 'push'
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          : template.category === 'pull'
                          ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                          : template.category === 'legs'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : template.category === 'arms_core'
                          ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {template.category.replace('_', ' ')}
                    </span>
                    {isCustom && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                        Custom
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-slate-400 text-xs font-semibold">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>~{template.estimatedDurationMinutes}m</span>
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-base font-extrabold text-white group-hover:text-amber-400 transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {template.description}
                  </p>
                </div>

                {/* Exercises list preview */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                    <span>Exercises ({template.exercises.length})</span>
                    <span className="text-[10px] text-slate-500">Target Sets × Reps</span>
                  </div>
                  <div className="space-y-1 max-h-36 overflow-y-auto no-scrollbar pr-0.5">
                    {template.exercises.map((ex, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-800/40 border border-slate-800/60"
                      >
                        <span className="font-semibold text-slate-200 truncate pr-2">
                          {i + 1}. {ex.exerciseName}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-amber-400 shrink-0">
                          {ex.targetSets}×{ex.targetReps}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats badge */}
                {(template.timesCompleted > 0 || template.lastUsedAt) && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 text-emerald-400 font-bold">
                      <Trophy className="w-3 h-3" />
                      <span>Completed {template.timesCompleted}x</span>
                    </span>
                    {template.lastUsedAt && (
                      <span className="text-slate-500">Last: {template.lastUsedAt}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions row */}
              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPreviewTemplate(template)}
                    title="View details & form notes"
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicateTemplate(template)}
                    title="Duplicate as new custom template"
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEditTemplate(template)}
                    title={isCustom ? 'Edit template' : 'Customize as template'}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  {isCustom && (
                    <button
                      onClick={() => handleDeleteTemplate(template.id, template.name)}
                      title="Delete template"
                      className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleStartWorkout(template)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Start Workout</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-dashed border-slate-800 space-y-3">
          <Dumbbell className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No workout templates match your criteria</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try resetting your search query or create a brand new routine template for your workouts.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
          >
            Create New Template
          </button>
        </div>
      )}

      {/* =========================================================================
          ACTIVE WORKOUT RUNNER MODAL / VIEW
         ========================================================================= */}
      {activeRunningTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md overflow-y-auto p-4 sm:p-6 flex flex-col items-center">
          <div className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 my-auto">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                    Active Workout Session
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    {activeRunningTemplate.name}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white mt-1">
                  Exercise {activeExerciseIndex + 1} of {activeRunningTemplate.exercises.length}:{' '}
                  <span className="text-amber-400">
                    {activeRunningTemplate.exercises[activeExerciseIndex]?.exerciseName}
                  </span>
                </h3>
              </div>

              {/* Session Controls: Timer & End Workout */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-black font-mono text-white">
                    {formatTime(sessionElapsedSeconds)}
                  </span>
                  <button
                    onClick={() => setIsSessionPaused(!isSessionPaused)}
                    className="text-xs text-slate-400 hover:text-white p-1"
                    title={isSessionPaused ? 'Resume Session' : 'Pause Session'}
                  >
                    {isSessionPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <button
                  onClick={handleFinishWorkout}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Finish & Log</span>
                </button>

                <button
                  onClick={() => {
                    if (confirm('Discard current workout session? Unsaved sets will be lost.')) {
                      setActiveRunningTemplate(null);
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-white cursor-pointer"
                  title="Quit session"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Exercise Tabs Navigation Chips */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {activeRunningTemplate.exercises.map((ex, idx) => {
                const exSets = activeSessionSets[ex.exerciseId] || [];
                const isAllCompleted = exSets.length > 0 && exSets.every((s) => s.completed);
                const isPartiallyDone = exSets.some((s) => s.completed);
                const isCurrent = idx === activeExerciseIndex;

                return (
                  <button
                    key={ex.exerciseId}
                    onClick={() => setActiveExerciseIndex(idx)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : isAllCompleted
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : isPartiallyDone
                        ? 'bg-slate-800 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    {isAllCompleted ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : (
                      <span>{idx + 1}.</span>
                    )}
                    <span className="truncate max-w-[120px]">{ex.exerciseName}</span>
                  </button>
                );
              })}
            </div>

            {/* Rest Timer Widget inside active runner */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Between-Set Rest Timer</span>
                    {isRestRunning && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block ml-1" />
                    )}
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span
                      className={`text-3xl font-black font-mono transition-colors ${
                        runnerRestSeconds <= 5 && runnerRestSeconds > 0
                          ? 'text-rose-400 animate-pulse'
                          : runnerRestSeconds <= 10 && runnerRestSeconds > 0
                          ? 'text-amber-400'
                          : isRestRunning
                          ? 'text-emerald-400'
                          : 'text-white'
                      }`}
                    >
                      {formatTime(runnerRestSeconds)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {isRestRunning ? 'Resting & recovering...' : runnerRestSeconds === 0 ? 'Ready for next set' : 'Timer paused'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (runnerRestSeconds === 0) {
                        const targetRest =
                          activeRunningTemplate.exercises[activeExerciseIndex]?.restSeconds || 60;
                        triggerRestTimer(targetRest);
                      } else {
                        setIsRestRunning(!isRestRunning);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                      isRestRunning
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    }`}
                  >
                    {isRestRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isRestRunning ? 'Pause' : runnerRestSeconds === 0 ? 'Start Rest' : 'Resume'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRunnerRestSeconds((prev) => prev + 15)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    +15s
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsRestRunning(false);
                      setRunnerRestSeconds(0);
                    }}
                    className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                    title="Skip Rest"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setRestSoundEnabled(!restSoundEnabled)}
                    className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                  >
                    {restSoundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Current Exercise Details & Sets Table */}
            {(() => {
              const currentTmplEx = activeRunningTemplate.exercises[activeExerciseIndex];
              const dbEx = EXERCISES_DATABASE.find((e) => e.id === currentTmplEx?.exerciseId);
              const currentSets = activeSessionSets[currentTmplEx?.exerciseId] || [];

              return (
                <div className="space-y-4">
                  {/* Exercise info header */}
                  <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-emerald-400 uppercase">
                        {dbEx?.muscleLabel || 'Primary Muscle'}
                      </span>
                      <h4 className="text-base font-extrabold text-white">{currentTmplEx.exerciseName}</h4>
                      {currentTmplEx.notes && (
                        <p className="text-xs text-amber-300/90 mt-0.5">
                          Form Cue: {currentTmplEx.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 font-mono">
                        Target: {currentTmplEx.targetSets} sets × {currentTmplEx.targetReps} reps
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 font-mono">
                        Rest: {currentTmplEx.restSeconds || 60}s
                      </span>
                    </div>
                  </div>

                  {/* Sets interactive table */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3">
                      <span className="col-span-2">Set</span>
                      <span className="col-span-4">Reps</span>
                      <span className="col-span-4">Weight (kg)</span>
                      <span className="col-span-2 text-right">Done</span>
                    </div>

                    <div className="space-y-2">
                      {currentSets.map((s, idx) => (
                        <div
                          key={idx}
                          className={`grid grid-cols-12 gap-2 items-center p-2.5 rounded-2xl border transition-all ${
                            s.completed
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                              : 'bg-slate-800/60 border-slate-700 text-slate-200'
                          }`}
                        >
                          <span className="col-span-2 font-black text-xs pl-2">#{s.setNumber}</span>
                          <div className="col-span-4">
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={s.reps}
                              onChange={(e) =>
                                handleUpdateSetField(
                                  currentTmplEx.exerciseId,
                                  idx,
                                  'reps',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-black text-center text-white focus:border-amber-400 focus:outline-none"
                            />
                          </div>
                          <div className="col-span-4">
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={s.weightKg}
                              onChange={(e) =>
                                handleUpdateSetField(
                                  currentTmplEx.exerciseId,
                                  idx,
                                  'weightKg',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-black text-center text-white focus:border-amber-400 focus:outline-none"
                            />
                          </div>
                          <div className="col-span-2 text-right pr-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleSetCompleted(
                                  currentTmplEx.exerciseId,
                                  idx,
                                  currentTmplEx.restSeconds || 60
                                )
                              }
                              className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-all cursor-pointer ml-auto ${
                                s.completed
                                  ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black'
                                  : 'border-slate-600 bg-slate-900 text-transparent hover:border-slate-400'
                              }`}
                            >
                              ✓
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddSetToExercise(currentTmplEx.exerciseId)}
                      className="w-full py-2.5 rounded-2xl bg-slate-800/70 hover:bg-slate-800 border border-dashed border-slate-700 text-xs text-slate-300 font-bold transition-all cursor-pointer"
                    >
                      + Add Extra Set to this Exercise
                    </button>
                  </div>

                  {/* Prev / Next Exercise buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      disabled={activeExerciseIndex === 0}
                      onClick={() => setActiveExerciseIndex((prev) => Math.max(0, prev - 1))}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-slate-200 transition-all cursor-pointer"
                    >
                      ← Previous Exercise
                    </button>

                    {activeExerciseIndex < activeRunningTemplate.exercises.length - 1 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setActiveExerciseIndex((prev) =>
                            Math.min(activeRunningTemplate.exercises.length - 1, prev + 1)
                          )
                        }
                        className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                      >
                        Next Exercise →
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleFinishWorkout}
                        className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                      >
                        Finish Full Workout 🎉
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* =========================================================================
          WORKOUT SUMMARY & VICTORY DIALOG
         ========================================================================= */}
      {workoutCompleteSummary && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl max-w-md w-full p-6 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <Trophy className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                Session Logged Successfully
              </span>
              <h3 className="text-2xl font-black text-white mt-1">
                Workout Complete!
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {workoutCompleteSummary.templateName}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Sets</span>
                <span className="text-xl font-black text-white">{workoutCompleteSummary.totalSets}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Volume</span>
                <span className="text-xl font-black text-amber-400">{workoutCompleteSummary.totalVolumeKg} kg</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Duration</span>
                <span className="text-xl font-black text-emerald-400">{workoutCompleteSummary.durationMinutes}m</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/40 p-3 rounded-xl border border-slate-800">
              ⚡ Great effort! Each completed set has been recorded into your daily tracker and strength volume dashboard.
            </p>

            <button
              onClick={() => setWorkoutCompleteSummary(null)}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              Done & Return to Templates
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          TEMPLATE PREVIEW / DETAILS DRAWER
         ========================================================================= */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  {previewTemplate.category.replace('_', ' ')}
                </span>
                <h3 className="text-xl font-black text-white mt-1.5">{previewTemplate.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{previewTemplate.description}</p>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold text-slate-300 bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Est. Duration: {previewTemplate.estimatedDurationMinutes} mins</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Dumbbell className="w-4 h-4 text-emerald-400" />
                <span>{previewTemplate.exercises.length} Exercises</span>
              </div>
            </div>

            {/* Exercise list with cues */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Workout Sequence
              </h4>
              <div className="space-y-2">
                {previewTemplate.exercises.map((ex, i) => {
                  const dbEx = EXERCISES_DATABASE.find((e) => e.id === ex.exerciseId);
                  return (
                    <div
                      key={i}
                      className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">
                          {i + 1}. {ex.exerciseName}
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-400">
                          {ex.targetSets} sets × {ex.targetReps} reps
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span>Target: {ex.targetWeightKg ? `${ex.targetWeightKg} kg` : 'Bodyweight'}</span>
                        <span>Rest: {ex.restSeconds || 60}s</span>
                        {dbEx && <span className="text-emerald-400">{dbEx.muscleLabel}</span>}
                      </div>
                      {ex.notes && (
                        <p className="text-xs text-amber-300/80 italic pt-1 border-t border-slate-700/40">
                          Form Note: {ex.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => handleStartWorkout(previewTemplate)}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                <span>Start Workout Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CREATE / EDIT TEMPLATE MODAL
         ========================================================================= */}
      {isBuilderOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Template Designer
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">
                  {editingTemplateId ? 'Edit Workout Template' : 'Create Custom Workout Template'}
                </h3>
              </div>
              <button
                onClick={() => setIsBuilderOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplateForm} className="space-y-4">
              {/* Template Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Push Day Hypertrophy"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Category Focus
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as WorkoutTemplateCategory)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="push">Push (Chest/Shoulders/Triceps)</option>
                    <option value="pull">Pull (Back/Lats/Biceps)</option>
                    <option value="legs">Legs (Quads/Hamstrings/Glutes)</option>
                    <option value="full_body">Full Body</option>
                    <option value="upper">Upper Body</option>
                    <option value="lower">Lower Body</option>
                    <option value="arms_core">Arms & Core</option>
                    <option value="custom">Custom Specialty</option>
                  </select>
                </div>
              </div>

              {/* Description & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Description & Objectives
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Target upper chest shelf, heavy bench press, lateral shoulder cap"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Est. Duration (mins)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="180"
                    value={formDuration}
                    onChange={(e) => setFormDuration(parseInt(e.target.value) || 45)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Exercises in Template */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Exercises in this Routine ({formExercises.length})
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Order exercises, configure target sets, rep ranges, and rest intervals.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsExercisePickerOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Exercise</span>
                  </button>
                </div>

                {formExercises.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-950 border border-dashed border-slate-800 space-y-2">
                    <Dumbbell className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400">No exercises added yet.</p>
                    <button
                      type="button"
                      onClick={() => setIsExercisePickerOpen(true)}
                      className="text-xs font-bold text-amber-400 hover:underline"
                    >
                      Click here to pick exercises from the database
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {formExercises.map((ex, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 text-xs font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-white truncate max-w-[200px]">
                              {ex.exerciseName}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveExercise(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveExercise(idx, 'down')}
                              disabled={idx === formExercises.length - 1}
                              className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveExerciseFromForm(idx)}
                              className="p-1 rounded bg-slate-800 text-slate-400 hover:text-rose-400 ml-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Exercise target parameters */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold block">Sets</span>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={ex.targetSets}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 3;
                                setFormExercises((prev) => {
                                  const copy = [...prev];
                                  copy[idx] = { ...copy[idx], targetSets: val };
                                  return copy;
                                });
                              }}
                              className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-white text-center"
                            />
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-500 font-bold block">Reps</span>
                            <input
                              type="text"
                              value={ex.targetReps}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormExercises((prev) => {
                                  const copy = [...prev];
                                  copy[idx] = { ...copy[idx], targetReps: val };
                                  return copy;
                                });
                              }}
                              placeholder="e.g. 8-12"
                              className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-white text-center"
                            />
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-500 font-bold block">Weight (kg)</span>
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={ex.targetWeightKg ?? 0}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setFormExercises((prev) => {
                                  const copy = [...prev];
                                  copy[idx] = { ...copy[idx], targetWeightKg: val };
                                  return copy;
                                });
                              }}
                              className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-white text-center"
                            />
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-500 font-bold block">Rest (sec)</span>
                            <select
                              value={ex.restSeconds || 60}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 60;
                                setFormExercises((prev) => {
                                  const copy = [...prev];
                                  copy[idx] = { ...copy[idx], restSeconds: val };
                                  return copy;
                                });
                              }}
                              className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-white text-center"
                            >
                              <option value={30}>30s</option>
                              <option value={45}>45s</option>
                              <option value={60}>60s</option>
                              <option value={90}>90s</option>
                              <option value={120}>120s</option>
                              <option value={180}>180s</option>
                            </select>
                          </div>
                        </div>

                        {/* Optional Form cue */}
                        <div>
                          <input
                            type="text"
                            placeholder="Optional cue: e.g. pause 1s at stretch, pin elbows..."
                            value={ex.notes || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormExercises((prev) => {
                                const copy = [...prev];
                                copy[idx] = { ...copy[idx], notes: val };
                                return copy;
                              });
                            }}
                            className="w-full px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-slate-300 placeholder-slate-600"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBuilderOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  {editingTemplateId ? 'Save Changes' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          EXERCISE PICKER MODAL (SUB-MODAL FOR BUILDER)
         ========================================================================= */}
      {isExercisePickerOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-5 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white">Select Exercise to Add</h3>
                <p className="text-xs text-slate-400">Choose from verified exercise movements</p>
              </div>
              <button
                onClick={() => setIsExercisePickerOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Picker Filters */}
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Search exercise by name or muscle..."
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />

              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'chest', label: 'Chest' },
                  { id: 'back', label: 'Back' },
                  { id: 'shoulders', label: 'Shoulders' },
                  { id: 'biceps', label: 'Biceps' },
                  { id: 'triceps', label: 'Triceps' },
                  { id: 'quads', label: 'Quads/Legs' },
                  { id: 'hamstrings_glutes', label: 'Hamstrings' },
                  { id: 'core', label: 'Core' },
                  { id: 'cardio_hiit', label: 'Cardio' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPickerMuscleFilter(m.id)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                      pickerMuscleFilter === m.id
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Exercise list */}
            <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
              {EXERCISES_DATABASE.filter((e) => {
                if (pickerMuscleFilter !== 'all' && e.targetMuscle !== pickerMuscleFilter) return false;
                if (pickerSearch.trim()) {
                  const q = pickerSearch.toLowerCase();
                  if (!e.name.toLowerCase().includes(q) && !e.muscleLabel.toLowerCase().includes(q)) {
                    return false;
                  }
                }
                return true;
              }).map((ex) => {
                const isAlreadyAdded = formExercises.some((f) => f.exerciseId === ex.id);
                return (
                  <div
                    key={ex.id}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-white">{ex.name}</h5>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="text-emerald-400">{ex.muscleLabel}</span>
                        <span>•</span>
                        <span className="capitalize">{ex.equipment}</span>
                        <span>•</span>
                        <span>{ex.defaultSets}×{ex.defaultReps}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddExerciseToForm(ex.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isAlreadyAdded
                          ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          : 'bg-amber-500 text-slate-950 hover:bg-amber-400 font-black'
                      }`}
                    >
                      {isAlreadyAdded ? '+ Add Again' : '+ Add'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
