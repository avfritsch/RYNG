type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function log(level: LogLevel, message: string, data?: Record<string, unknown>) {

  // Console output
  const consoleFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  if (data) {
    consoleFn(`[${level.toUpperCase()}] ${message}`, data);
  } else {
    consoleFn(`[${level.toUpperCase()}] ${message}`);
  }

  // Sentry breadcrumb (non-blocking)
  if (level === 'warn' || level === 'error') {
    import('@sentry/react').then((Sentry) => {
      Sentry.addBreadcrumb({
        category: 'app',
        message,
        level: level === 'error' ? 'error' : 'warning',
        data,
      });

      // Capture errors directly to Sentry
      if (level === 'error') {
        Sentry.captureMessage(message, { level: 'error', extra: data });
      }
    }).catch(() => {});
  }
}

export const logger = {
  debug: (msg: string, data?: Record<string, unknown>) => log('debug', msg, data),
  info: (msg: string, data?: Record<string, unknown>) => log('info', msg, data),
  warn: (msg: string, data?: Record<string, unknown>) => log('warn', msg, data),
  error: (msg: string, data?: Record<string, unknown>) => log('error', msg, data),
};
