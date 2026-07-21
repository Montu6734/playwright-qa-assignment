import { config } from '../config/env';

export const SAUCE_PASSWORD = config.defaultPassword;

export const SauceUsers = {
  standard: 'standard_user',
  lockedOut: 'locked_out_user',
  problem: 'problem_user',
  performanceGlitch: 'performance_glitch_user',
  error: 'error_user',
  visual: 'visual_user',
} as const;

export const emptyCredentialsCases: { label: string; username: string; password: string }[] = [
  { label: 'empty username', username: '', password: SAUCE_PASSWORD },
  { label: 'empty password', username: SauceUsers.standard, password: '' },
  { label: 'empty username and password', username: '', password: '' },
];
