import { afterEach, describe, expect, it, vi } from 'vitest';
import { readProgress, saveProgress } from './storage';

afterEach(() => vi.unstubAllGlobals());

describe('local progress', () => {
  it('validates and deduplicates saved chapters', () => {
    vi.stubGlobal('localStorage', {
      getItem: () =>
        JSON.stringify({ completed: [0, 0, 3, 5, -1, '1', null], sound: true }),
    });
    expect(readProgress()).toEqual({ completed: [0, 3], sound: true });
  });
  it.each(['broken JSON', 'null', '{}', '[]'])(
    'recovers from invalid data: %s',
    (data) => {
      vi.stubGlobal('localStorage', { getItem: () => data });
      expect(readProgress()).toEqual({ completed: [], sound: false });
    },
  );
  it('keeps gameplay available when storage is blocked', () => {
    vi.stubGlobal('localStorage', {
      getItem() {
        throw new Error('Access denied');
      },
      setItem() {
        throw new Error('Quota exceeded');
      },
    });
    expect(readProgress()).toEqual({ completed: [], sound: false });
    expect(saveProgress({ completed: [1], sound: false })).toBe(false);
  });
  it('writes a versioned record', () => {
    const setItem = vi.fn();
    vi.stubGlobal('localStorage', { setItem });
    const progress = { completed: [0, 1], sound: true };
    expect(saveProgress(progress)).toBe(true);
    expect(setItem).toHaveBeenCalledWith(
      'subtraction-forest:v1',
      JSON.stringify(progress),
    );
  });
});
