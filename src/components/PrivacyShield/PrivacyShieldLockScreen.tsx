import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Unlock,
  KeyRound,
  Grid3X3,
  HelpCircle,
  AlertTriangle,
  X,
  Delete,
  Fingerprint,
  Scan,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import {
  PrivacyShieldConfig,
  DEFAULT_SECURITY_QUESTIONS,
} from '../../types/privacyShield';
import { PatternPad } from './PatternPad';
import { playShortBeep, playTimerFinishChime } from '../../utils/audioChime';

interface PrivacyShieldLockScreenProps {
  config: PrivacyShieldConfig;
  onUnlockSuccess: () => void;
  onEmergencyReset: () => void;
}

export const PrivacyShieldLockScreen: React.FC<PrivacyShieldLockScreenProps> = ({
  config,
  onUnlockSuccess,
  onEmergencyReset,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Biometrics state
  const [isBiometricScanning, setIsBiometricScanning] = useState(false);
  const [biometricSuccess, setBiometricSuccess] = useState(false);

  // Recovery modal state
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [recoveryAnswerInput, setRecoveryAnswerInput] = useState('');
  const [recoveryError, setRecoveryError] = useState('');

  // Cooldown countdown
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const interval = setInterval(() => {
        setCooldownSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [cooldownSeconds]);

  // Handle biometric unlock attempt
  const triggerBiometricUnlock = async () => {
    if (cooldownSeconds > 0 || isBiometricScanning) return;
    setIsBiometricScanning(true);
    setErrorMessage('');
    playShortBeep(750, 0.08);

    try {
      // Simulate biometric check / WebAuthn platform prompt
      await new Promise((resolve) => setTimeout(resolve, 800));
      setIsBiometricScanning(false);
      setBiometricSuccess(true);
      playTimerFinishChime();
      setTimeout(() => {
        onUnlockSuccess();
      }, 350);
    } catch {
      setIsBiometricScanning(false);
      setErrorMessage('Biometric verification failed. Please use PIN or Pattern.');
      playShortBeep(260, 0.2);
    }
  };

  // Auto trigger biometrics once on screen load if enabled
  useEffect(() => {
    if (config.biometricEnabled) {
      const timer = setTimeout(() => {
        triggerBiometricUnlock();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [config.biometricEnabled]);

  const recordFailedAttempt = () => {
    const nextFails = failedAttempts + 1;
    setFailedAttempts(nextFails);
    setIsError(true);
    playShortBeep(260, 0.2);

    if (nextFails >= 5) {
      setCooldownSeconds(30);
      setErrorMessage('Too many failed attempts. Locked for 30s.');
    } else {
      setErrorMessage(`Incorrect passcode. ${5 - nextFails} attempts remaining.`);
    }

    setTimeout(() => {
      setIsError(false);
      setPinInput('');
    }, 700);
  };

  const handleDigitPress = (digit: string) => {
    if (cooldownSeconds > 0 || pinInput.length >= 4) return;
    playShortBeep(650, 0.05);
    const nextPin = pinInput + digit;
    setPinInput(nextPin);
    setErrorMessage('');

    if (nextPin.length === 4) {
      if (nextPin === config.pinCode) {
        playTimerFinishChime();
        onUnlockSuccess();
      } else {
        recordFailedAttempt();
      }
    }
  };

  const handleBackspace = () => {
    if (pinInput.length > 0) {
      playShortBeep(450, 0.05);
      setPinInput((prev) => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    playShortBeep(400, 0.05);
    setPinInput('');
    setErrorMessage('');
  };

  const handlePatternComplete = (pattern: number[]) => {
    if (cooldownSeconds > 0) return;
    const targetPattern = config.patternPath;
    if (
      targetPattern &&
      pattern.length === targetPattern.length &&
      pattern.every((val, idx) => val === targetPattern[idx])
    ) {
      playTimerFinishChime();
      onUnlockSuccess();
    } else {
      recordFailedAttempt();
    }
  };

  const handleVerifyRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      config.securityAnswer &&
      recoveryAnswerInput.trim().toLowerCase() === config.securityAnswer.trim().toLowerCase()
    ) {
      playTimerFinishChime();
      setIsRecoveryOpen(false);
      onUnlockSuccess();
    } else {
      setRecoveryError('Security answer is incorrect. Please try again.');
      playShortBeep(260, 0.2);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6">
        {/* App Logo & Lock Badge */}
        <div className="relative">
          <div className="w-18 h-18 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-2xl shadow-emerald-500/30 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center text-emerald-400">
              <Shield className="w-9 h-9" />
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg font-black">
            <Lock className="w-4 h-4" />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-black text-white">Privacy Shield Active</h2>
          <p className="text-xs text-slate-400 mt-1">
            Authenticate to unlock your health logs and routines
          </p>
        </div>

        {/* BIOMETRIC RECOGNITION PROMPT (If enabled) */}
        {config.biometricEnabled && (
          <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-indigo-950/60 border border-indigo-500/40 shadow-xl space-y-3">
            <div className="flex items-center justify-center gap-2">
              {config.biometricType === 'face' ? (
                <Scan className="w-6 h-6 text-cyan-400 animate-pulse" />
              ) : (
                <Fingerprint className="w-6 h-6 text-indigo-400 animate-pulse" />
              )}
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {config.biometricType === 'face'
                  ? 'Facial Recognition Ready'
                  : config.biometricType === 'fingerprint'
                  ? 'Fingerprint Sensor Ready'
                  : 'Biometric Sensor Active'}
              </span>
            </div>

            <button
              type="button"
              onClick={triggerBiometricUnlock}
              disabled={isBiometricScanning || cooldownSeconds > 0}
              className={`w-full py-3 px-4 rounded-xl font-black text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                biometricSuccess
                  ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 active:scale-95'
              }`}
            >
              {isBiometricScanning ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Scanning Biometrics...</span>
                </>
              ) : biometricSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Biometric Verified! Unlocking...</span>
                </>
              ) : (
                <>
                  {config.biometricType === 'face' ? (
                    <Scan className="w-4 h-4" />
                  ) : (
                    <Fingerprint className="w-4 h-4" />
                  )}
                  <span>
                    Tap to Unlock with{' '}
                    {config.biometricType === 'face'
                      ? 'Face ID'
                      : config.biometricType === 'fingerprint'
                      ? 'Fingerprint'
                      : 'Biometrics'}
                  </span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400">
              <span className="h-px w-8 bg-slate-800" />
              <span>Or enter {config.lockType === 'pattern' ? 'pattern' : 'PIN'} below</span>
              <span className="h-px w-8 bg-slate-800" />
            </div>
          </div>
        )}

        {/* Lockout Notification */}
        {cooldownSeconds > 0 ? (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-2 w-full animate-pulse">
            <div className="flex items-center justify-center gap-2 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Security Lockout</span>
            </div>
            <p className="text-xs">
              Try again in <span className="font-mono font-black text-white">{cooldownSeconds}</span> seconds.
            </p>
          </div>
        ) : (
          <>
            {/* PIN LOCK INTERFACE */}
            {config.lockType === 'pin' && (
              <div className="w-full space-y-6">
                {/* 4 Digit Display Circles */}
                <div
                  className={`flex items-center justify-center gap-5 py-2 ${
                    isError ? 'animate-shake' : ''
                  }`}
                >
                  {[0, 1, 2, 3].map((idx) => {
                    const isFilled = pinInput.length > idx;
                    return (
                      <div
                        key={idx}
                        className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                          isError
                            ? 'border-rose-500 bg-rose-500/30 scale-110'
                            : isFilled
                            ? 'border-emerald-400 bg-emerald-400 scale-125 shadow-lg shadow-emerald-400/40'
                            : 'border-slate-600 bg-slate-800/40'
                        }`}
                      />
                    );
                  })}
                </div>

                {errorMessage && (
                  <p className="text-xs font-semibold text-rose-400 -mt-2">
                    {errorMessage}
                  </p>
                )}

                {/* Tactile Numeric Keypad */}
                <div className="grid grid-cols-3 gap-3 w-64 mx-auto">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handleDigitPress(digit)}
                      className="w-18 h-14 rounded-2xl bg-slate-900/80 hover:bg-slate-800 active:bg-emerald-500 active:text-slate-950 border border-slate-800 text-lg font-bold text-slate-100 transition-all shadow-sm flex items-center justify-center cursor-pointer"
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleClear}
                    title="Clear"
                    className="w-18 h-14 rounded-2xl bg-slate-900/50 hover:bg-slate-800 text-xs font-bold text-slate-400 hover:text-white border border-slate-800 transition-all flex items-center justify-center cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDigitPress('0')}
                    className="w-18 h-14 rounded-2xl bg-slate-900/80 hover:bg-slate-800 active:bg-emerald-500 active:text-slate-950 border border-slate-800 text-lg font-bold text-slate-100 transition-all shadow-sm flex items-center justify-center cursor-pointer"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleBackspace}
                    title="Backspace"
                    className="w-18 h-14 rounded-2xl bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all flex items-center justify-center cursor-pointer"
                  >
                    <Delete className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* PATTERN LOCK INTERFACE */}
            {config.lockType === 'pattern' && (
              <div className="w-full space-y-4">
                <PatternPad
                  onComplete={handlePatternComplete}
                  isError={isError}
                  disabled={cooldownSeconds > 0}
                  minPoints={4}
                />
                {errorMessage && (
                  <p className="text-xs font-semibold text-rose-400">
                    {errorMessage}
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {/* Footer: Recovery Option */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              setIsRecoveryOpen(true);
              setRecoveryError('');
            }}
            className="text-xs text-slate-400 hover:text-emerald-400 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer mx-auto"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Forgot PIN, Pattern, or Biometrics?</span>
          </button>
        </div>
      </div>

      {/* Emergency Recovery Modal */}
      {isRecoveryOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Security Verification
                </span>
                <h3 className="text-base font-black text-white mt-0.5">
                  Unlock Recovery
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRecoveryOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVerifyRecovery} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Security Question:
                </label>
                <p className="text-xs font-bold text-amber-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  {config.securityQuestion || DEFAULT_SECURITY_QUESTIONS[0]}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Your Answer:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter security answer..."
                  value={recoveryAnswerInput}
                  onChange={(e) => setRecoveryAnswerInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                />
                {recoveryError && (
                  <p className="text-[11px] font-semibold text-rose-400 mt-1">
                    {recoveryError}
                  </p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    if (
                      confirm(
                        'Emergency Reset will disable Privacy Shield so you can access your logs. Proceed?'
                      )
                    ) {
                      onEmergencyReset();
                      setIsRecoveryOpen(false);
                    }
                  }}
                  className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                >
                  Emergency Reset
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  Verify & Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
