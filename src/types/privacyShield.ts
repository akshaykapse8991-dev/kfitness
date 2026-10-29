export type LockType = 'pin' | 'pattern' | 'biometric';

export interface PrivacyShieldConfig {
  enabled: boolean;
  lockType: LockType;
  pinCode?: string; // 4-digit PIN string e.g. "1234"
  patternPath?: number[]; // array of node indices 0 to 8
  biometricEnabled?: boolean; // Enable fingerprint or facial recognition unlock
  biometricType?: 'fingerprint' | 'face' | 'both';
  autoLockMinutes: number; // 0 = Immediate (on blur/tab switch), 1 = 1m, 5 = 5m, 15 = 15m, -1 = On Reload Only
  securityQuestion?: string;
  securityAnswer?: string;
  lastUnlockedAt?: number;
}

export const DEFAULT_SECURITY_QUESTIONS = [
  'What is your pet or favorite workout partner name?',
  'What is your primary fitness goal (e.g., Six Pack, Marathon)?',
  'What city were you born in?',
  'What is your favorite cheat meal or Indian dish?',
  'What was the name of your first gym or school?',
];
