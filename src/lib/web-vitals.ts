import { onCLS, onFCP, onLCP, onTTFB, onINP, type Metric } from 'web-vitals';

function reportMetric(metric: Metric) {
  // Send to Sentry as a custom measurement
  import('@sentry/react').then((Sentry) => {
    Sentry.captureMessage(`Web Vital: ${metric.name}`, {
      level: 'info',
      tags: {
        'web-vital': metric.name,
        'web-vital-rating': metric.rating, // 'good' | 'needs-improvement' | 'poor'
      },
      extra: {
        value: metric.value,
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType,
      },
    });
  }).catch(() => {
    // Sentry not available
  });

  // Also log in dev
  if (import.meta.env.DEV) {
    console.log(`[Web Vital] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`);
  }
}

export function initWebVitals() {
  onCLS(reportMetric);
  onFCP(reportMetric);
  onLCP(reportMetric);
  onTTFB(reportMetric);
  onINP(reportMetric);
}
