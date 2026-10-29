import React, { useState, useMemo } from 'react';
import {
  Download,
  FileSpreadsheet,
  Copy,
  Check,
  Calendar,
  Filter,
  Dumbbell,
  TrendingUp,
  X,
  Layers,
  Table,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { ExerciseLogItem } from '../../types/fitness';

interface ExerciseHistoryExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseHistory: ExerciseLogItem[];
  onSeedSampleData?: () => void;
}

type DateRangeFilter = 'all' | '7d' | '30d' | '90d';
type ExportFormat = 'detailed_sets' | 'session_summary';

export const ExerciseHistoryExportModal: React.FC<ExerciseHistoryExportModalProps> = ({
  isOpen,
  onClose,
  exerciseHistory,
  onSeedSampleData,
}) => {
  const [dateRange, setDateRange] = useState<DateRangeFilter>('all');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('detailed_sets');
  const [muscleFilter, setMuscleFilter] = useState<string>('all');
  const [copiedToast, setCopiedToast] = useState<boolean>(false);
  const [downloadToast, setDownloadToast] = useState<boolean>(false);

  // Filter history based on date range and muscle
  const filteredHistory = useMemo(() => {
    const now = new Date().getTime();
    return exerciseHistory.filter((session) => {
      // Date filter
      if (dateRange !== 'all') {
        const sessionTime = new Date(session.timestamp).getTime();
        const daysDiff = (now - sessionTime) / (1000 * 60 * 60 * 24);
        if (dateRange === '7d' && daysDiff > 7) return false;
        if (dateRange === '30d' && daysDiff > 30) return false;
        if (dateRange === '90d' && daysDiff > 90) return false;
      }
      // Muscle filter
      if (muscleFilter !== 'all' && session.targetMuscle !== muscleFilter) {
        return false;
      }
      return true;
    });
  }, [exerciseHistory, dateRange, muscleFilter]);

  // Aggregate stats
  const stats = useMemo(() => {
    let totalSets = 0;
    let totalReps = 0;
    let totalVolumeKg = 0;

    filteredHistory.forEach((session) => {
      session.sets?.forEach((set) => {
        totalSets += 1;
        totalReps += set.reps || 0;
        totalVolumeKg += (set.reps || 0) * (set.weightKg || 0);
      });
    });

    return {
      totalSessions: filteredHistory.length,
      totalSets,
      totalReps,
      totalVolumeKg: Math.round(totalVolumeKg),
    };
  }, [filteredHistory]);

  // Distinct muscle groups available in history
  const availableMuscles = useMemo(() => {
    const set = new Set<string>();
    exerciseHistory.forEach((s) => {
      if (s.targetMuscle) set.add(s.targetMuscle);
    });
    return Array.from(set);
  }, [exerciseHistory]);

  // Generate CSV String
  const csvContent = useMemo(() => {
    if (filteredHistory.length === 0) return '';

    if (exportFormat === 'detailed_sets') {
      const headers = [
        'Date',
        'Time',
        'Exercise Name',
        'Target Muscle',
        'Set Number',
        'Weight (kg)',
        'Reps',
        'Volume (kg)',
        'Estimated 1RM (kg)',
        'Completed',
        'Session ID',
      ];

      const rows: string[] = [headers.join(',')];

      filteredHistory.forEach((session) => {
        const dateObj = new Date(session.timestamp);
        const dateStr = !isNaN(dateObj.getTime())
          ? dateObj.toISOString().split('T')[0]
          : 'Unknown Date';
        const timeStr = !isNaN(dateObj.getTime())
          ? dateObj.toTimeString().split(' ')[0]
          : '00:00:00';

        const safeExerciseName = `"${session.exerciseName.replace(/"/g, '""')}"`;
        const safeMuscle = `"${(session.targetMuscle || 'General').replace(/"/g, '""')}"`;

        session.sets?.forEach((set) => {
          const reps = set.reps || 0;
          const weight = set.weightKg || 0;
          const volume = Math.round(reps * weight * 10) / 10;
          // Epley 1RM formula: weight * (1 + reps/30)
          const estOneRm =
            weight > 0 && reps > 0
              ? Math.round(weight * (1 + reps / 30) * 10) / 10
              : weight;

          const row = [
            dateStr,
            timeStr,
            safeExerciseName,
            safeMuscle,
            set.setNumber,
            weight,
            reps,
            volume,
            estOneRm,
            set.completed ? 'Yes' : 'No',
            session.id,
          ];
          rows.push(row.join(','));
        });
      });

      return rows.join('\r\n');
    } else {
      // Session summary format
      const headers = [
        'Date',
        'Time',
        'Exercise Name',
        'Target Muscle',
        'Completed Sets',
        'Total Reps',
        'Max Weight (kg)',
        'Total Volume (kg)',
        'Session ID',
      ];

      const rows: string[] = [headers.join(',')];

      filteredHistory.forEach((session) => {
        const dateObj = new Date(session.timestamp);
        const dateStr = !isNaN(dateObj.getTime())
          ? dateObj.toISOString().split('T')[0]
          : 'Unknown Date';
        const timeStr = !isNaN(dateObj.getTime())
          ? dateObj.toTimeString().split(' ')[0]
          : '00:00:00';

        const safeExerciseName = `"${session.exerciseName.replace(/"/g, '""')}"`;
        const safeMuscle = `"${(session.targetMuscle || 'General').replace(/"/g, '""')}"`;

        const totalSets = session.sets?.length || 0;
        let totalReps = 0;
        let maxWeight = 0;
        let totalVolume = 0;

        session.sets?.forEach((set) => {
          totalReps += set.reps || 0;
          if (set.weightKg > maxWeight) maxWeight = set.weightKg;
          totalVolume += (set.reps || 0) * (set.weightKg || 0);
        });

        const row = [
          dateStr,
          timeStr,
          safeExerciseName,
          safeMuscle,
          totalSets,
          totalReps,
          maxWeight,
          Math.round(totalVolume * 10) / 10,
          session.id,
        ];
        rows.push(row.join(','));
      });

      return rows.join('\r\n');
    }
  }, [filteredHistory, exportFormat]);

  // Preview rows for the preview table (first 5 rows)
  const previewRows = useMemo<{ header: string[]; rows: string[][]; totalCount: number }>(() => {
    if (!csvContent) {
      return { header: [], rows: [], totalCount: 0 };
    }
    const lines = csvContent.split('\r\n');
    const header = lines[0]?.split(',') || [];
    const dataLines = lines.slice(1, 6).map((line) => {
      // Split on commas while respecting quotes
      const values: string[] = [];
      let inQuotes = false;
      let current = '';
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.replace(/^"|"$/g, ''));
      return values;
    });

    return { header, rows: dataLines, totalCount: lines.length - 1 };
  }, [csvContent]);

  // Handle Download CSV
  const handleDownloadCsv = () => {
    if (!csvContent) return;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];
    link.href = url;
    link.setAttribute('download', `kapse_exercise_history_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadToast(true);
    setTimeout(() => setDownloadToast(false), 3000);
  };

  // Handle Copy to Clipboard
  const handleCopyToClipboard = async () => {
    if (!csvContent) return;
    try {
      await navigator.clipboard.writeText(csvContent);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 3000);
    } catch (e) {
      console.warn('Copy to clipboard failed', e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Data Portability & Analytics
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                RFC 4180 CSV
              </span>
            </div>
            <h2 className="text-xl font-black text-white mt-1 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              Export Exercise History to CSV
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Download your complete strength training records for Excel, Google Sheets, Apple Numbers, or Notion.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aggregate Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Sessions
            </span>
            <div className="text-xl font-black text-white mt-0.5">
              {stats.totalSessions}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Total Sets
            </span>
            <div className="text-xl font-black text-emerald-400 mt-0.5">
              {stats.totalSets}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Total Reps
            </span>
            <div className="text-xl font-black text-amber-400 mt-0.5">
              {stats.totalReps}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Tonnage Volume
            </span>
            <div className="text-xl font-black text-cyan-400 mt-0.5">
              {stats.totalVolumeKg.toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-400">kg</span>
            </div>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
          {/* Date Range Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRangeFilter)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Time (Complete History)</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>

          {/* Muscle Group Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-amber-400" />
              Target Muscle
            </label>
            <select
              value={muscleFilter}
              onChange={(e) => setMuscleFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Muscle Groups</option>
              {availableMuscles.map((muscle) => (
                <option key={muscle} value={muscle}>
                  {muscle}
                </option>
              ))}
            </select>
          </div>

          {/* Format Selection */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              CSV Layout Structure
            </label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="detailed_sets">Detailed Sets (1 row per set + 1RM)</option>
              <option value="session_summary">Session Summary (1 row per workout)</option>
            </select>
          </div>
        </div>

        {/* Live CSV Preview Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Table className="w-3.5 h-3.5 text-emerald-400" />
              CSV Table Preview (First {previewRows.rows?.length || 0} of {previewRows.totalCount || 0} rows)
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Ready for Google Sheets / Excel
            </span>
          </div>

          {filteredHistory.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-[11px] text-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold">
                    {previewRows.header?.map((h, i) => (
                      <th key={i} className="px-3 py-2 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {previewRows.rows?.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-900/50">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3 py-1.5 whitespace-nowrap">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 rounded-2xl border border-dashed border-slate-800 text-center space-y-3 bg-slate-950/40">
              <Dumbbell className="w-10 h-10 text-slate-600 mx-auto" />
              <div>
                <p className="text-sm font-bold text-slate-300">No workout records match this filter</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Log exercise sets in the Exercise Library or load demo data to test export.
                </p>
              </div>
              {onSeedSampleData && (
                <button
                  type="button"
                  onClick={onSeedSampleData}
                  className="px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Seed Demo Workout History</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Feedback Toasts */}
        {downloadToast && (
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 flex items-center gap-2 text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>CSV downloaded successfully! Open with Microsoft Excel, Google Sheets, or Apple Numbers.</span>
          </div>
        )}

        {copiedToast && (
          <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 flex items-center gap-2 text-xs font-semibold animate-in fade-in">
            <Check className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>CSV copied to clipboard! You can paste directly into any spreadsheet.</span>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>Includes 1RM calculations & total tonnage metrics.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopyToClipboard}
              disabled={filteredHistory.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer disabled:opacity-50"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy CSV</span>
            </button>

            <button
              onClick={handleDownloadCsv}
              disabled={filteredHistory.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Download CSV File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
