import { test } from '@playwright/test';

export interface Logger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  step<T>(title: string, body: () => Promise<T> | T): Promise<T>;
}

export function createLogger(scope: string): Logger {
  const prefix = `[${scope}]`;
  return {
    info: (message: string) => console.log(`${prefix} INFO: ${message}`),
    warn: (message: string) => console.warn(`${prefix} WARN: ${message}`),
    error: (message: string) => console.error(`${prefix} ERROR: ${message}`),
    step: <T>(title: string, body: () => Promise<T> | T) => test.step(title, async () => body()),
  };
}
