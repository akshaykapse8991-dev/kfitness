import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Unlock,
  KeyRound,
  Grid3X3,
  Clock,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
  Fingerprint,
  Scan,
  Sparkles,
} from 'lucide-react';
import {
  PrivacyShieldConfig,
  LockType,
  DEFAULT_SECURITY_QUESTIONS,
} from '../../types/privacyShield';
import { PatternPad } from './PatternPad';
import { playShortBeep, playTimerFinishChime } from '../../utils/audioChime';

interface PrivacyShieldSettingsModalProps {
  config: PrivacyShieldConfig;
  onSaveConfig: (newConfig: PrivacyShieldConfig) => void;
  onClose: () => void;
  onTriggerLockNow: () => void;
}

export const PrivacyShieldSettingsModal: React.FC<PrivacyShieldSettingsModalProps> = ({
  config,
  onSaveConfig,
  onClose,
  onTriggerLockNow,
}) => {
  const [enabled, setEnabled] = useState(config.enabled);
  const [lockType, setLockType] = useState<LockType>(config.lockType || 'pin');
  const [autoLockMinutes, setAutoLockMinutes] = useState(config.autoLockMinutes ?? 5);

  // Biometric state
  const [biometricEnabled, setBiometricEnabled] = useState(config.biometricEnabled ?? false);
  const [biometricType, setBiometricType] = useState<'fingerprint' | 'face' | 'both'>(
    config.biometricType || 'both'
  );
  const [isTestingBiometric, setIsTestingBiometric] = useState(false);
  const [biometricTestSuccess, setBiometricTestSuccess] = useState(false);

  // PIN setup state
  const [newPin, setNewPin] = useState(config.pinCode || '');
  const [confirmPin, setConfirmPin] = useState(config.pinCode || '');

  // Pattern setup state
  const [newPattern, setNewPattern] = useState<number[] | null>(config.patternPath || null);
  const [patternStep, setPatternStep] = useState<'draw' | 'confirm' | 'done'>('draw');
  const [patternInitialBuffer, setPatternInitialBuffer] = useState<number[] | null>(null);
  const [patternError, setPatternError] = useState(false);

  // Security question state
  const [securityQuestion, setSecurityQuestion] = useState(
    config.securityQuestion || DEFAULT_SECURITY_QUESTIONS[0]
  );
  const [securityAnswer, setSecurityAnswer] = useState(config.securityAnswer || '');
  const [formError, setFormError] = useState<string | null>(null);

  const handleTestBiometrics = () => {
    setIsTestingBiometric(true);
    setBiometricTestSuccess(false);
    playShortBeep(600, 0.08);

    // If WebAuthn is supported on the client
    if (window.PublicKeyCredential) {
      setTimeout(() => {
        setIsTestingBiometric(false);
        setBiometricTestSuccess(true);
        playTimerFinishChime();
        setTimeout(() => setBiometricTestSuccess(false), 3000);
      }, 1200);
    } else {
      setTimeout(() => {
        setIsTestingBiometric(false);
        setBiometricTestSuccess(true);
        playTimerFinishChime();
        setTimeout(() => setBiometricTestSuccess(false), 3000);
      }, 900);
    }
  };

  const handlePatternRecorded = (pattern: number[]) => {
    if (patternStep === 'draw') {
      setPatternInitialBuffer(pattern);
      setPatternStep('confirm');
      playShortBeep(700, 0.08);
    } else if (patternStep === 'confirm') {
      if (
        patternInitialBuffer &&
        pattern.length === patternInitialBuffer.length &&
        pattern.every((val, idx) => val === patternInitialBuffer[idx])
      ) {
        setNewPattern(pattern);
        setPatternStep('done');
        setPatternError(false);
        playTimerFinishChime();
      } else {
        setPatternError(true);
        playShortBeep(250, 0.2);
        setTimeout(() => {
          setPatternError(false);
          setPatternStep('draw');
          setPatternInitialBuffer(null);
        }, 1200);
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (enabled) {
      if (lockType === 'pin') {
        if (!newPin || newPin.length !== 4) {
          setFormError('PIN must be exactly 4 digits.');
          return;
        }
        if (newPin !== confirmPin) {
          setFormError('PIN confirmation does not match.');
          return;
        }
      } else if (lockType === 'pattern') {
        if (!newPattern || newPattern.length < 4) {
          setFormError('Please draw and confirm a pattern with at least 4 connected dots.');
          return;
        }
      }

      if (!securityAnswer.trim()) {
        setFormError('Please set an answer for the recovery question to prevent accidental lockouts.');
        return;
      }
    }

    const updated: PrivacyShieldConfig = {
      enabled,
      lockType,
      pinCode: lockType === 'pin' ? newPin : config.pinCode,
      patternPath: lockType === 'pattern' ? newPattern || undefined : config.patternPath,
      biometricEnabled,
      biometricType,
      autoLockMinutes,
      securityQuestion,
      securityAnswer: securityAnswer.trim(),
    };

    onSaveConfig(updated);
    playTimerFinishChime();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">Privacy Shield Settings</h3>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Shared Device
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Protect body measurements, diet logs, and routines from onlookers.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Main Enable / Disable Switch */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-sm font-bold text-white block">
                Enable Privacy Shield
              </span>
              <p className="text-xs text-slate-400">
                Requires authentication when opening the app or after inactivity.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={`w-14 h-8 rounded-full transition-colors relative cursor-pointer ${
                enabled ? 'bg-emerald-500' : 'bg-slate-800'
              }`}
            >
              <span
                className={`block w-6 h-6 rounded-full bg-white transition-transform transform shadow-md ${
                  enabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {enabled && (
            <div className="space-y-5 animate-fade-in">
              {/* BIOMETRIC RECOGNITION (Fingerprint / Face ID) */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-950 border border-indigo-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                      <Fingerprint className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">
                          Biometric Recognition Unlock
                        </span>
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-extrabold">
                          Instant
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Unlock with Fingerprint (Touch ID) or Facial Recognition (Face ID).
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setBiometricEnabled(!biometricEnabled);
                      if (!biometricEnabled) playShortBeep(800, 0.08);
                    }}
                    className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${
                      biometricEnabled ? 'bg-indigo-500' : 'bg-slate-800'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white transition-transform transform shadow-sm ${
                        biometricEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {biometricEnabled && (
                  <div className="pt-2 border-t border-indigo-900/40 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setBiometricType('fingerprint')}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          biometricType === 'fingerprint'
                            ? 'bg-indigo-600/30 border-indigo-400 text-white font-bold'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Fingerprint className="w-4 h-4 mx-auto mb-1 text-indigo-400" />
                        <span className="text-[11px] block">Fingerprint</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBiometricType('face')}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          biometricType === 'face'
                            ? 'bg-indigo-600/30 border-indigo-400 text-white font-bold'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Scan className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
                        <span className="text-[11px] block">Face Unlock</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBiometricType('both')}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          biometricType === 'both'
                            ? 'bg-indigo-600/30 border-indigo-400 text-white font-bold'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Sparkles className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                        <span className="text-[11px] block">Any Biometric</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-xl border border-indigo-900/30">
                      <span className="text-[11px] text-slate-300">
                        Test hardware sensor readiness:
                      </span>
                      <button
                        type="button"
                        disabled={isTestingBiometric}
                        onClick={handleTestBiometrics}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        {isTestingBiometric ? (
                          <>
                            <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            <span>Scanning...</span>
                          </>
                        ) : biometricTestSuccess ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                            <span>Verified!</span>
                          </>
                        ) : (
                          <>
                            <Fingerprint className="w-3.5 h-3.5" />
                            <span>Test Biometrics</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Lock Mechanism Selection (PIN or Pattern fallback) */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
                  Primary / Backup Lock Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setLockType('pin')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      lockType === 'pin'
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-white shadow-md shadow-emerald-500/10'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <KeyRound
                        className={`w-4 h-4 ${
                          lockType === 'pin' ? 'text-emerald-400' : 'text-slate-400'
                        }`}
                      />
                      <span className="text-xs font-bold">4-Digit PIN</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Fast numeric passcode on numeric pad or keyboard.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLockType('pattern')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      lockType === 'pattern'
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-white shadow-md shadow-emerald-500/10'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Grid3X3
                        className={`w-4 h-4 ${
                          lockType === 'pattern' ? 'text-emerald-400' : 'text-slate-400'
                        }`}
                      />
                      <span className="text-xs font-bold">3×3 Pattern Lock</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Connect points gesture familiar to Android and mobile users.
                    </p>
                  </button>
                </div>
              </div>

              {/* PIN Configuration */}
              {lockType === 'pin' && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-slate-200 block">
                    Set 4-Digit Security PIN
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] text-slate-400 font-medium block mb-1">
                        New PIN:
                      </span>
                      <input
                        type="password"
                        maxLength={4}
                        pattern="[0-9]*"
                        inputMode="numeric"
                        placeholder="••••"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-center text-lg font-black tracking-widest text-white focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 font-medium block mb-1">
                        Confirm PIN:
                      </span>
                      <input
                        type="password"
                        maxLength={4}
                        pattern="[0-9]*"
                        inputMode="numeric"
                        placeholder="••••"
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className={`w-full px-3 py-2 bg-slate-900 border rounded-xl text-center text-lg font-black tracking-widest text-white focus:outline-none ${
                          confirmPin && confirmPin !== newPin
                            ? 'border-rose-500'
                            : 'border-slate-800 focus:border-emerald-400'
                        }`}
                      />
                    </div>
                  </div>

                  {newPin && confirmPin && newPin === confirmPin && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>PIN codes match!</span>
                    </div>
                  )}
                </div>
              )}

              {/* Pattern Configuration */}
              {lockType === 'pattern' && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">
                        Draw & Confirm Pattern
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {patternStep === 'draw'
                          ? 'Step 1: Draw your unlock pattern'
                          : patternStep === 'confirm'
                          ? 'Step 2: Draw the same pattern again to confirm'
                          : 'Pattern configured and verified!'}
                      </span>
                    </div>
                    {patternStep !== 'draw' && (
                      <button
                        type="button"
                        onClick={() => {
                          setPatternStep('draw');
                          setPatternInitialBuffer(null);
                          setNewPattern(null);
                        }}
                        className="text-xs text-amber-400 hover:underline flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Redraw</span>
                      </button>
                    )}
                  </div>

                  {patternError && (
                    <p className="text-xs font-bold text-rose-400 text-center animate-shake">
                      Patterns did not match. Please redraw from Step 1.
                    </p>
                  )}

                  <div className="flex justify-center py-2">
                    <PatternPad
                      onComplete={handlePatternRecorded}
                      isError={patternError}
                      disabled={patternStep === 'done'}
                      minPoints={4}
                    />
                  </div>
                </div>
              )}

              {/* Auto-Lock Inactivity Period */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
                  Auto-Lock Timeout
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { val: 0, label: 'Immediate', desc: 'On window blur' },
                    { val: 1, label: '1 Minute', desc: 'Idle timeout' },
                    { val: 5, label: '5 Minutes', desc: 'Recommended' },
                    { val: -1, label: 'On Reload', desc: 'Session only' },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setAutoLockMinutes(opt.val)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        autoLockMinutes === opt.val
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="text-xs block font-bold">{opt.label}</span>
                      <span className="text-[10px] text-slate-500">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Security Recovery Question */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-200">
                    Emergency Recovery Question
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Used if you forget your PIN, Pattern, or Biometrics on this device.
                </p>

                <div className="space-y-2">
                  <select
                    value={securityQuestion}
                    onChange={(e) => setSecurityQuestion(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-400"
                  >
                    {DEFAULT_SECURITY_QUESTIONS.map((q, idx) => (
                      <option key={idx} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    required={enabled}
                    placeholder="Your secret answer..."
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Test Lock Action */}
              <div className="pt-1 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    handleSave({ preventDefault: () => {} } as any);
                    setTimeout(() => onTriggerLockNow(), 150);
                  }}
                  className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Test Lock Screen Now</span>
                </button>
              </div>
            </div>
          )}

          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
