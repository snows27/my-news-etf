type Level = 'info' | 'warn' | 'error';

const REDACTED_KEYS = ['key', 'secret', 'webhook', 'token', 'password', 'authorization'];

function redact(msg: string): string {
  let safe = msg;
  for (const key of REDACTED_KEYS) {
    const pattern = new RegExp(`(${key}[^=]*=\\s*)\\S+`, 'gi');
    safe = safe.replace(pattern, '$1[REDACTED]');
  }
  return safe;
}

function log(level: Level, message: string, meta?: Record<string, unknown>): void {
  const ts = new Date().toISOString();
  const safeMsg = redact(message);
  const safeMeta = meta ? JSON.stringify(meta) : '';
  console[level === 'info' ? 'log' : level](`[${ts}] [${level.toUpperCase()}] ${safeMsg}${safeMeta ? ' ' + safeMeta : ''}`);
}

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => log('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log('error', msg, meta),
};
