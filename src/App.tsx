import React, { useState, useEffect } from 'react';
import { Header, ActiveTab } from './components/Header';
import { DashboardView } from './components/Dashboard/DashboardView';
import { CalculatorsView } from './components/Calculators/CalculatorsView';
import { ExercisesView } from './components/Exercises/ExercisesView';
import { NutritionView } from './components/Nutrition/NutritionView';
import { DietPlannerView } from './components/DietPlanner/DietPlannerView';
import { FoodScannerView } from './components/FoodScanner/FoodScannerView';
import { RemindersView } from './components/Reminders/RemindersView';
import { AdaptiveCalendarView } from './components/Calendar/AdaptiveCalendarView';
import { AIStudioView } from './components/AIStudio/AIStudioView';
import {
  DailyActivityTracker,
  ExerciseLogItem,
  MealItem,
  UserProfile,
} from './types/fitness';
import {
  PrivacyShieldConfig,
  DEFAULT_SECURITY_QUESTIONS,
} from './types/privacyShield';
import { PrivacyShieldLockScreen } from './components/PrivacyShield/PrivacyShieldLockScreen';
import { PrivacyShieldSettingsModal } from './components/PrivacyShield/PrivacyShieldSettingsModal';
import { FloatingQuickAccess } from './components/Navigation/FloatingQuickAccess';
import { MobileBottomNav } from './components/Navigation/MobileBottomNav';
import { QuickCommandPalette } from './components/Navigation/QuickCommandPalette';
import { WhatsNewModal } from './components/Common/WhatsNewModal';
import { playReminderNotificationSound } from './utils/audioChime';

const DEFAULT_PRIVACY_CONFIG: PrivacyShieldConfig = {
  enabled: false,
  lockType: 'pin',
  pinCode: '1234',
  autoLockMinutes: 5,
  securityQuestion: DEFAULT_SECURITY_QUESTIONS[0],
  securityAnswer: 'kapse',
};

const DEFAULT_PROFILE: UserProfile = {
  name: 'Akshay',
  age: 26,
  gender: 'male',
  heightCm: 175,
  weightKg: 72,
  targetWeightKg: 68,
  neckCm: 38,
  waistCm: 84,
  hipCm: 96,
  activityLevel: 'moderate',
  goal: 'fat_loss',
  dietPreference: 'all',
  targetCalories: 2050,
  targetProtein: 144,
  targetCarbs: 215,
  targetFat: 57,
  waterGoalLiters: 3.5,
};

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [todayKey] = useState<string>(getTodayKey());

  // Search Palette and What's New state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);

  // User Profile
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem('kapse_fitness_profile');
      if (stored) return JSON.parse(stored);
    } catch {}
    return DEFAULT_PROFILE;
  });

  // Daily Activity Tracker
  const [dailyTracker, setDailyTracker] = useState<DailyActivityTracker>(() => {
    try {
      const stored = localStorage.getItem(`kapse_daily_${todayKey}`);
      if (stored) return JSON.parse(stored);
    } catch {}
    return {
      date: todayKey,
      waterGlasses: 4,
      consumedCalories: 0,
      consumedProtein: 0,
      consumedCarbs: 0,
      consumedFat: 0,
      mealsLogged: [],
      completedExercises: [],
      checklist: { water: false, protein: false, workout: false, salad: false, sleep: false },
    };
  });

  // Weight History
  const [weightHistory, setWeightHistory] = useState<{ date: string; weightKg: number }[]>(() => {
    try {
      const stored = localStorage.getItem('kapse_fitness_weight_history');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      { date: 'Oct 15', weightKg: 73.5 },
      { date: 'Oct 18', weightKg: 72.8 },
      { date: 'Oct 22', weightKg: 72.0 },
    ];
  });

  // Save profile to local storage on change
  useEffect(() => {
    try {
      localStorage.setItem('kapse_fitness_profile', JSON.stringify(userProfile));
    } catch (e) {
      console.warn('Profile save error', e);
    }
  }, [userProfile]);

  // Save daily tracker to local storage
  useEffect(() => {
    try {
      localStorage.setItem(`kapse_daily_${todayKey}`, JSON.stringify(dailyTracker));
    } catch (e) {
      console.warn('Daily tracker save error', e);
    }
  }, [dailyTracker, todayKey]);

  // Save weight history
  useEffect(() => {
    try {
      localStorage.setItem('kapse_fitness_weight_history', JSON.stringify(weightHistory));
    } catch (e) {
      console.warn('Weight history save error', e);
    }
  }, [weightHistory]);

  // Keyboard shortcut listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Privacy Shield State
  const [privacyShieldConfig, setPrivacyShieldConfig] = useState<PrivacyShieldConfig>(() => {
    try {
      const stored = localStorage.getItem('kapse_privacy_shield_config');
      return stored ? { ...DEFAULT_PRIVACY_CONFIG, ...JSON.parse(stored) } : DEFAULT_PRIVACY_CONFIG;
    } catch {
      return DEFAULT_PRIVACY_CONFIG;
    }
  });

  const [isAppLocked, setIsAppLocked] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('kapse_privacy_shield_config');
      if (stored) {
        const c = JSON.parse(stored);
        return !!c.enabled;
      }
    } catch {}
    return false;
  });

  const [isPrivacySettingsOpen, setIsPrivacySettingsOpen] = useState(false);
  const lastActiveTimeRef = React.useRef(Date.now());

  // Inactivity & Window Blur listener
  useEffect(() => {
    const updateActivity = () => {
      lastActiveTimeRef.current = Date.now();
    };
    window.addEventListener('pointerdown', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('touchstart', updateActivity);
    window.addEventListener('scroll', updateActivity);

    // Periodic check for auto-lock timeout
    const interval = setInterval(() => {
      if (privacyShieldConfig.enabled && !isAppLocked && privacyShieldConfig.autoLockMinutes > 0) {
        const idleTimeMs = Date.now() - lastActiveTimeRef.current;
        if (idleTimeMs >= privacyShieldConfig.autoLockMinutes * 60 * 1000) {
          setIsAppLocked(true);
        }
      }
    }, 4000);

    // Immediate lock on blur / visibility change if autoLockMinutes === 0
    const handleVisibilityChange = () => {
      if (document.hidden && privacyShieldConfig.enabled && !isAppLocked && privacyShieldConfig.autoLockMinutes === 0) {
        setIsAppLocked(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pointerdown', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [privacyShieldConfig.enabled, privacyShieldConfig.autoLockMinutes, isAppLocked]);

  const handleSavePrivacyConfig = (newConfig: PrivacyShieldConfig) => {
    setPrivacyShieldConfig(newConfig);
    try {
      localStorage.setItem('kapse_privacy_shield_config', JSON.stringify(newConfig));
    } catch (e) {
      console.warn('Privacy shield save error', e);
    }
  };

  const handleEmergencyResetPrivacy = () => {
    const resetConfig: PrivacyShieldConfig = {
      ...privacyShieldConfig,
      enabled: false,
    };
    handleSavePrivacyConfig(resetConfig);
    setIsAppLocked(false);
  };

  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...updated }));
  };

  const handleUpdateDailyTracker = (updated: Partial<DailyActivityTracker>) => {
    setDailyTracker((prev) => ({ ...prev, ...updated }));
  };

  const handleAddWater = (delta: number) => {
    setDailyTracker((prev) => ({
      ...prev,
      waterGlasses: Math.max(0, prev.waterGlasses + delta),
    }));
  };

  const handleAddMealItem = (item: MealItem) => {
    setDailyTracker((prev) => {
      const nextMeals = [item, ...prev.mealsLogged];
      return {
        ...prev,
        mealsLogged: nextMeals,
        consumedCalories: Math.round(prev.consumedCalories + item.calories),
        consumedProtein: Math.round((prev.consumedProtein + item.protein) * 10) / 10,
        consumedCarbs: Math.round((prev.consumedCarbs + item.carbs) * 10) / 10,
        consumedFat: Math.round((prev.consumedFat + item.fat) * 10) / 10,
      };
    });
  };

  const handleLogExerciseSession = (session: ExerciseLogItem) => {
    setDailyTracker((prev) => ({
      ...prev,
      completedExercises: [session, ...prev.completedExercises],
    }));
    try {
      const stored = localStorage.getItem('kapse_exercise_history_all');
      const list: ExerciseLogItem[] = stored ? JSON.parse(stored) : [];
      localStorage.setItem('kapse_exercise_history_all', JSON.stringify([session, ...list]));
    } catch (e) {
      console.warn('Failed to persist exercise history', e);
    }
  };

  const handleAddWeightLog = (weight: number) => {
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    setWeightHistory((prev) => [...prev, { date: today, weightKg: weight }]);
    setUserProfile((prev) => ({ ...prev, weightKg: weight }));
  };

  const handleExportData = () => {
    const backupData = {
      profile: userProfile,
      dailyTracker,
      weightHistory,
      exportDate: new Date().toISOString(),
      app: 'Kapse Fitness',
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kapse_fitness_backup_${todayKey}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (data: any) => {
    if (data.profile) setUserProfile(data.profile);
    if (data.dailyTracker) setDailyTracker(data.dailyTracker);
    if (data.weightHistory) setWeightHistory(data.weightHistory);
  };

  const handleResetData = () => {
    localStorage.clear();
    setUserProfile(DEFAULT_PROFILE);
    setDailyTracker({
      date: todayKey,
      waterGlasses: 0,
      consumedCalories: 0,
      consumedProtein: 0,
      consumedCarbs: 0,
      consumedFat: 0,
      mealsLogged: [],
      completedExercises: [],
      checklist: {},
    });
    setWeightHistory([]);
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950 font-sans">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userProfile={userProfile}
        waterGlasses={dailyTracker.waterGlasses}
        consumedCalories={dailyTracker.consumedCalories}
        privacyShieldConfig={privacyShieldConfig}
        onOpenPrivacySettings={() => setIsPrivacySettingsOpen(true)}
        onLockNow={() => setIsAppLocked(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenWhatsNew={() => setIsWhatsNewOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            userProfile={userProfile}
            dailyTracker={dailyTracker}
            onUpdateDailyTracker={handleUpdateDailyTracker}
            onNavigateTab={setActiveTab}
            weightHistory={weightHistory}
            onAddWeightLog={handleAddWeightLog}
          />
        )}

        {activeTab === 'calendar' && (
          <AdaptiveCalendarView onNavigateTab={setActiveTab} />
        )}

        {activeTab === 'nutrition' && (
          <NutritionView
            onAddMealItem={handleAddMealItem}
            userProfile={userProfile}
            todayMeals={dailyTracker.mealsLogged}
          />
        )}

        {activeTab === 'exercises' && (
          <ExercisesView
            onLogExerciseSession={handleLogExerciseSession}
            exerciseHistory={dailyTracker.completedExercises}
          />
        )}

        {activeTab === 'ai_studio' && (
          <AIStudioView userProfile={userProfile} />
        )}

        {activeTab === 'calculators' && (
          <CalculatorsView
            userProfile={userProfile}
            onUpdateProfile={handleUpdateProfile}
          />
        )}

        {activeTab === 'diet_plan' && (
          <DietPlannerView
            userProfile={userProfile}
            onAddMealToDiary={handleAddMealItem}
          />
        )}

        {activeTab === 'scanner' && (
          <FoodScannerView
            userProfile={userProfile}
            onAddMealItem={handleAddMealItem}
          />
        )}

        {activeTab === 'reminders' && (
          <RemindersView
            userProfile={userProfile}
            dailyTracker={dailyTracker}
            onUpdateDailyTracker={handleUpdateDailyTracker}
            onExportData={handleExportData}
            onImportData={handleImportData}
            onResetData={handleResetData}
          />
        )}
      </main>

      {/* Floating Speed Dial Quick Action Button */}
      <FloatingQuickAccess
        onAddWater={handleAddWater}
        onNavigateTab={setActiveTab}
        onLockNow={() => setIsAppLocked(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Fixed Bottom Dock on Mobile Phones */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenPrivacySettings={() => setIsPrivacySettingsOpen(true)}
        onOpenWhatsNew={() => setIsWhatsNewOpen(true)}
      />

      {/* Quick Universal Command Palette Search (Ctrl+K) */}
      <QuickCommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigateTab={setActiveTab}
        onAddWater={handleAddWater}
        onLockNow={() => setIsAppLocked(true)}
        onOpenWhatsNew={() => setIsWhatsNewOpen(true)}
      />

      {/* What's New in v2.5 Updated Edition Modal */}
      <WhatsNewModal
        isOpen={isWhatsNewOpen}
        onClose={() => setIsWhatsNewOpen(false)}
        onNavigateTab={setActiveTab}
      />

      {/* Privacy Shield Lock Screen */}
      {isAppLocked && privacyShieldConfig.enabled && (
        <PrivacyShieldLockScreen
          config={privacyShieldConfig}
          onUnlockSuccess={() => setIsAppLocked(false)}
          onEmergencyReset={handleEmergencyResetPrivacy}
        />
      )}

      {/* Privacy Shield Settings Modal */}
      {isPrivacySettingsOpen && (
        <PrivacyShieldSettingsModal
          config={privacyShieldConfig}
          onSaveConfig={handleSavePrivacyConfig}
          onClose={() => setIsPrivacySettingsOpen(false)}
          onTriggerLockNow={() => setIsAppLocked(true)}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-400 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-semibold text-slate-300">
            Kapse Fitness — Train • Transform • Perform (v2.5 Updated Edition)
          </p>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Free personal use</span>
            <span>•</span>
            <a
              href="/api/download-apk"
              download="KapseFitness-v2.5.apk"
              className="text-emerald-400 hover:underline font-bold"
            >
              Download Android APK
            </a>
            <span>•</span>
            <span>100% private offline storage</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
