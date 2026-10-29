import React, { useState } from 'react';
import {
  Bell,
  Clock,
  Droplet,
  Volume2,
  VolumeX,
  CheckCircle2,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Calendar,
  AlertCircle,
  Lock,
  KeyRound,
} from 'lucide-react';
import { DailyActivityTracker, DailyReminder, UserProfile } from '../../types/fitness';
import { PrivacyShieldConfig } from '../../types/privacyShield';
import { playReminderNotificationSound } from '../../utils/audioChime';

interface RemindersViewProps {
  userProfile: UserProfile;
  dailyTracker: DailyActivityTracker;
  onUpdateDailyTracker: (updated: Partial<DailyActivityTracker>) => void;
  onExportData: () => void;
  onImportData: (data: any) => void;
  onResetData: () => void;
  privacyShieldConfig?: PrivacyShieldConfig;
  onOpenPrivacySettings?: () => void;
  onLockNow?: () => void;
}

const DEFAULT_REMINDERS: DailyReminder[] = [
  {
    id: 'rem-water-morning',
    title: 'Morning Hydration & Warm Water',
    time: '07:00',
    category: 'water',
    enabled: true,
    sound: true,
    message: 'Drink 500ml warm water with lemon and pink salt to kickstart digestion.',
  },
  {
    id: 'rem-breakfast',
    title: 'High-Protein Breakfast',
    time: '08:30',
    category: 'meal',
    enabled: true,
    sound: true,
    message: 'Time for breakfast! Fuel up with complex carbs and 25g+ protein.',
  },
  {
    id: 'rem-water-midday',
    title: 'Midday Water Refill',
    time: '11:30',
    category: 'water',
    enabled: true,
    sound: true,
    message: 'Hydration check! Drink a fresh glass of water or spiced buttermilk (chaas).',
  },
  {
    id: 'rem-lunch',
    title: 'Balanced Indian Lunch',
    time: '13:30',
    category: 'meal',
    enabled: true,
    sound: true,
    message: 'Enjoy your lunch with whole wheat phulkas, dal/chicken, and fresh salad.',
  },
  {
    id: 'rem-snack-preworkout',
    title: 'Pre-Workout Snack & Energy',
    time: '17:00',
    category: 'meal',
    enabled: true,
    sound: true,
    message: 'Have roasted chana, a banana or black coffee before your workout.',
  },
  {
    id: 'rem-workout',
    title: 'Workout & Training Session',
    time: '18:00',
    category: 'workout',
    enabled: true,
    sound: true,
    message: 'Time to train! 45 minutes of dedicated strength or home conditioning.',
  },
  {
    id: 'rem-dinner',
    title: 'High-Protein Dinner',
    time: '20:30',
    category: 'meal',
    enabled: true,
    sound: true,
    message: 'Time for dinner. Keep carbs moderate and focus on paneer, soya or fish.',
  },
  {
    id: 'rem-weigh-in',
    title: 'Scheduled Morning Weigh-In',
    time: '07:15',
    category: 'stretch',
    enabled: true,
    sound: false,
    message: 'Step on the scale right after morning bathroom routine for accurate weight.',
  },
  {
    id: 'rem-sleep',
    title: 'Bedtime & Recovery Sleep',
    time: '22:30',
    category: 'sleep',
    enabled: true,
    sound: true,
    message: 'Wind down screens. 7-8 hours of sleep is where muscle builds and fat burns.',
  },
];

export const RemindersView: React.FC<RemindersViewProps> = ({
  userProfile,
  dailyTracker,
  onUpdateDailyTracker,
  onExportData,
  onImportData,
  onResetData,
  privacyShieldConfig,
  onOpenPrivacySettings,
  onLockNow,
}) => {
  const [reminders, setReminders] = useState<DailyReminder[]>(() => {
    try {
      const stored = localStorage.getItem('kapse_fitness_reminders');
      return stored ? JSON.parse(stored) : DEFAULT_REMINDERS;
    } catch {
      return DEFAULT_REMINDERS;
    }
  });

  const [notificationPermission, setNotificationPermission] = useState<string>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const saveReminders = (updated: DailyReminder[]) => {
    setReminders(updated);
    try {
      localStorage.setItem('kapse_fitness_reminders', JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage error', e);
    }
  };

  const handleToggleReminder = (id: string) => {
    const updated = reminders.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r));
    saveReminders(updated);
  };

  const handleUpdateTime = (id: string, newTime: string) => {
    const updated = reminders.map((r) => (r.id === id ? { ...r, time: newTime } : r));
    saveReminders(updated);
  };

  const handleTestSound = () => {
    playReminderNotificationSound();
    setToastMessage('Played reminder alert chime');
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleRequestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        new Notification('Kapse Fitness', {
          body: 'Reminders enabled! You will receive timely alerts for water, meals, and workouts.',
          icon: '/favicon.ico',
        });
        setToastMessage('Browser notifications enabled successfully!');
      } else {
        setToastMessage('Browser notifications blocked or dismissed.');
      }
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string);
        onImportData(json);
        setToastMessage('Backup restored successfully!');
      } catch (err) {
        setToastMessage('Failed to parse backup file. Please select a valid JSON backup.');
      }
      setTimeout(() => setToastMessage(null), 3500);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Daily Habit & Alert Schedule
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">
              Reminders, Water Alarms & Private Data
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Configure daily timing for meals, water intake, workouts, and weigh-ins. 100% free and private with offline local storage and instant JSON data backup.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={handleTestSound}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold cursor-pointer transition-all shadow-md"
            >
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>Test Chime</span>
            </button>

            {notificationPermission !== 'granted' && (
              <button
                onClick={handleRequestNotificationPermission}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 cursor-pointer transition-all"
              >
                <Bell className="w-4 h-4" />
                <span>Enable Notifications</span>
              </button>
            )}
          </div>
        </div>

        {toastMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Reminders List & Data Management */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Reminders Schedule (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900/90 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Daily Schedule & Alert Timings</h2>
              <p className="text-xs text-slate-400">Tap time to customize your personal day</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-emerald-400 border border-slate-700">
              {reminders.filter((r) => r.enabled).length} Active
            </span>
          </div>

          <div className="space-y-3">
            {reminders.map((rem) => (
              <div
                key={rem.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  rem.enabled
                    ? 'bg-slate-800/60 border-slate-700/80 shadow-md'
                    : 'bg-slate-950/40 border-slate-800/80 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      rem.category === 'water'
                        ? 'bg-cyan-500/15 text-cyan-400'
                        : rem.category === 'workout'
                        ? 'bg-amber-500/15 text-amber-400'
                        : rem.category === 'sleep'
                        ? 'bg-indigo-500/15 text-indigo-400'
                        : 'bg-emerald-500/15 text-emerald-400'
                    }`}
                  >
                    {rem.category === 'water' ? (
                      <Droplet className="w-5 h-5" />
                    ) : rem.category === 'workout' ? (
                      <Clock className="w-5 h-5" />
                    ) : (
                      <Bell className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-100">{rem.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-1">{rem.message}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                  <input
                    type="time"
                    value={rem.time}
                    onChange={(e) => handleUpdateTime(rem.id, e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono font-bold text-emerald-400 focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => handleToggleReminder(rem.id)}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      rem.enabled ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white transition-transform transform ${
                        rem.enabled ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Privacy, Storage & Export (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Privacy & Zero-Cloud Principles Card */}
          <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Private & Free Storage</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your workouts, meals, body measurements, and custom recipes are stored exclusively on your device (in browser local storage).
            </p>
            <ul className="text-xs text-slate-300 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero mandatory sign-up or paywall</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Works offline anytime, anywhere</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Full data export and restore ownership</span>
              </li>
            </ul>
          </div>

          {/* Privacy Shield Card */}
          <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Privacy Shield</h3>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  privacyShieldConfig?.enabled
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {privacyShieldConfig?.enabled ? 'Active' : 'Disabled'}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Require a 4-digit PIN or 3×3 pattern gesture to access your workouts, weight logs, and diet data on shared devices.
            </p>

            {privacyShieldConfig?.enabled && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Lock Type:</span>
                  <span className="font-bold uppercase text-emerald-400">
                    {privacyShieldConfig.lockType === 'pin' ? '4-Digit PIN' : '3×3 Pattern'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Auto-Lock:</span>
                  <span className="font-semibold text-slate-200">
                    {privacyShieldConfig.autoLockMinutes === 0
                      ? 'Immediate'
                      : privacyShieldConfig.autoLockMinutes === -1
                      ? 'On Reload'
                      : `${privacyShieldConfig.autoLockMinutes} min`}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2 pt-1">
              {onOpenPrivacySettings && (
                <button
                  type="button"
                  onClick={onOpenPrivacySettings}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>
                    {privacyShieldConfig?.enabled ? 'Configure PIN / Pattern' : 'Enable Privacy Shield'}
                  </span>
                </button>
              )}

              {privacyShieldConfig?.enabled && onLockNow && (
                <button
                  type="button"
                  onClick={onLockNow}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                  <span>Lock App Now</span>
                </button>
              )}
            </div>
          </div>

          {/* Backup & Restore Card */}
          <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white">Backup & Restore</h3>
            <p className="text-xs text-slate-400">
              Download your complete fitness profile, meals log, and workout history as a JSON file to transfer between phone and PC.
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={onExportData}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Export All Data (JSON)</span>
              </button>

              <label className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer shadow-md">
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>Restore Backup File</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to reset all data back to initial defaults?')) {
                    onResetData();
                  }
                }}
                className="w-full py-2 text-xs text-rose-400 hover:text-rose-300 transition-colors font-medium cursor-pointer"
              >
                Reset App Data to Factory Defaults
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
