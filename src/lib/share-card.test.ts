import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ShareCardData } from './share-card.ts';

/**
 * Canvas and Blob APIs are limited in jsdom/happy-dom test environments.
 * We mock canvas context methods and toBlob to test the logic without
 * a real rendering engine.
 */

// Reusable mock canvas context
function createMockCtx() {
  return {
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    fillStyle: '',
    font: '',
    textAlign: '',
  };
}

function setupCanvasMock() {
  const mockCtx = createMockCtx();
  const mockCanvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => mockCtx),
    toBlob: vi.fn((cb: (blob: Blob | null) => void) => {
      cb(new Blob(['fake-png'], { type: 'image/png' }));
    }),
  };

  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
    if (tag === 'a') {
      return {
        href: '',
        download: '',
        click: vi.fn(),
      } as unknown as HTMLAnchorElement;
    }
    return document.createElementNS('http://www.w3.org/1999/xhtml', tag);
  });

  return { mockCanvas, mockCtx };
}

const sampleData: ShareCardData = {
  title: 'Morning HIIT',
  duration: '25',
  exercises: 8,
  rounds: 3,
  streak: 5,
  date: '15.01.2026',
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('share-card: ShareCardData interface', () => {
  it('accepts valid data with all fields', () => {
    const data: ShareCardData = {
      title: 'Test',
      duration: '30',
      exercises: 5,
      rounds: 4,
      streak: 10,
      date: '01.01.2026',
    };
    expect(data.title).toBe('Test');
    expect(data.streak).toBe(10);
  });

  it('accepts data without optional streak', () => {
    const data: ShareCardData = {
      title: 'No Streak',
      duration: '15',
      exercises: 3,
      rounds: 2,
      date: '01.01.2026',
    };
    expect(data.streak).toBeUndefined();
  });
});

describe('share-card: generateShareCard', () => {
  it('returns a Blob of type image/png', async () => {
    const { mockCanvas } = setupCanvasMock();

    const { generateShareCard } = await import('./share-card.ts');
    const blob = await generateShareCard(sampleData);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/png');
    expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
    expect(mockCanvas.width).toBe(1080);
    expect(mockCanvas.height).toBe(1080);
  });

  it('sets canvas dimensions to 1080x1080', async () => {
    const { mockCanvas } = setupCanvasMock();

    const { generateShareCard } = await import('./share-card.ts');
    await generateShareCard(sampleData);

    expect(mockCanvas.width).toBe(1080);
    expect(mockCanvas.height).toBe(1080);
  });

  it('draws the title text on canvas', async () => {
    const { mockCtx } = setupCanvasMock();

    const { generateShareCard } = await import('./share-card.ts');
    await generateShareCard(sampleData);

    expect(mockCtx.fillText).toHaveBeenCalledWith('Morning HIIT', 540, 300);
  });

  it('draws the RYNG branding', async () => {
    const { mockCtx } = setupCanvasMock();

    const { generateShareCard } = await import('./share-card.ts');
    await generateShareCard(sampleData);

    expect(mockCtx.fillText).toHaveBeenCalledWith('RYNG', 80, 100);
  });

  it('draws the date', async () => {
    const { mockCtx } = setupCanvasMock();

    const { generateShareCard } = await import('./share-card.ts');
    await generateShareCard(sampleData);

    expect(mockCtx.fillText).toHaveBeenCalledWith('15.01.2026', 1000, 100);
  });

  it('includes streak in stats when streak > 1', async () => {
    const { mockCtx } = setupCanvasMock();

    const { generateShareCard } = await import('./share-card.ts');
    await generateShareCard({ ...sampleData, streak: 5 });

    // With streak, 3 stats columns are drawn
    const fillTextCalls = mockCtx.fillText.mock.calls.map((c: unknown[]) => c[0]);
    expect(fillTextCalls).toContain('🔥 5');
    expect(fillTextCalls).toContain('Streak');
  });

  it('omits streak from stats when streak <= 1', async () => {
    const { mockCtx } = setupCanvasMock();

    const { generateShareCard } = await import('./share-card.ts');
    await generateShareCard({ ...sampleData, streak: 1 });

    const fillTextCalls = mockCtx.fillText.mock.calls.map((c: unknown[]) => c[0]);
    expect(fillTextCalls).not.toContain('Streak');
  });

  it('omits streak from stats when streak is undefined', async () => {
    const { mockCtx } = setupCanvasMock();

    const { generateShareCard } = await import('./share-card.ts');
    const dataNoStreak = { ...sampleData };
    delete dataNoStreak.streak;
    await generateShareCard(dataNoStreak);

    const fillTextCalls = mockCtx.fillText.mock.calls.map((c: unknown[]) => c[0]);
    expect(fillTextCalls).not.toContain('Streak');
  });
});

describe('share-card: shareWorkoutCard', () => {
  it('uses Web Share API when canShare returns true', async () => {
    setupCanvasMock();

    const shareFn = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'canShare', {
      value: vi.fn(() => true),
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'share', {
      value: shareFn,
      writable: true,
      configurable: true,
    });

    const { shareWorkoutCard } = await import('./share-card.ts');
    await shareWorkoutCard(sampleData);

    expect(shareFn).toHaveBeenCalledTimes(1);
    const shareArg = shareFn.mock.calls[0][0];
    expect(shareArg.title).toBe('RYNG Workout');
    expect(shareArg.files).toHaveLength(1);
    expect(shareArg.files[0].name).toBe('ryng-workout.png');
  });

  it('falls back to download when canShare is not available', async () => {
    setupCanvasMock();

    // Remove canShare
    Object.defineProperty(navigator, 'canShare', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const revokeObjectURL = vi.fn();
    const createObjectURL = vi.fn(() => 'blob:http://localhost/fake');
    Object.defineProperty(URL, 'createObjectURL', {
      value: createObjectURL,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: revokeObjectURL,
      writable: true,
      configurable: true,
    });

    const { shareWorkoutCard } = await import('./share-card.ts');
    await shareWorkoutCard(sampleData);

    expect(createObjectURL).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalled();
  });

  it('falls back to download when canShare returns false', async () => {
    setupCanvasMock();

    Object.defineProperty(navigator, 'canShare', {
      value: vi.fn(() => false),
      writable: true,
      configurable: true,
    });

    const revokeObjectURL = vi.fn();
    const createObjectURL = vi.fn(() => 'blob:http://localhost/fake');
    Object.defineProperty(URL, 'createObjectURL', {
      value: createObjectURL,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: revokeObjectURL,
      writable: true,
      configurable: true,
    });

    const { shareWorkoutCard } = await import('./share-card.ts');
    await shareWorkoutCard(sampleData);

    expect(createObjectURL).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalled();
  });
});
