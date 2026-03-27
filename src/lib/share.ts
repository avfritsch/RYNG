import QRCode from 'qrcode';
import type { TimerConfig } from '../types/timer.ts';

interface ShareableWorkout {
  v: 1;
  n: string; // name
  r: number; // rounds
  rp: number; // roundPause
  s: { n: string; w: number; p: number; wu: boolean }[]; // stations (compact)
}

/**
 * Compress a TimerConfig + name into a minimal shareable format.
 */
export function encodeWorkout(name: string, config: TimerConfig): string {
  const data: ShareableWorkout = {
    v: 1,
    n: name,
    r: config.rounds,
    rp: config.roundPause,
    s: config.stations.map((s) => ({
      n: s.name,
      w: s.workSeconds,
      p: s.pauseSeconds,
      wu: s.isWarmup,
    })),
  };
  return btoa(encodeURIComponent(JSON.stringify(data)));
}

/**
 * Decode a shared workout string back into a TimerConfig.
 */
export function decodeWorkout(encoded: string): { name: string; config: TimerConfig } {
  const json = decodeURIComponent(atob(encoded));
  const data: ShareableWorkout = JSON.parse(json);

  if (data.v !== 1) throw new Error('Unbekanntes Share-Format');

  return {
    name: data.n,
    config: {
      rounds: data.r,
      roundPause: data.rp,
      stations: data.s.map((s) => ({
        name: s.n,
        workSeconds: s.w,
        pauseSeconds: s.p,
        isWarmup: s.wu,
        howto: '',
      })),
    },
  };
}

/**
 * Generate a QR code as data URL (PNG).
 */
export async function generateQRCode(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    width: 280,
    margin: 2,
    color: {
      dark: '#FFFFFF',
      light: '#0A0A0A',
    },
    errorCorrectionLevel: 'M',
  });
}
