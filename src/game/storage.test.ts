import { afterEach, describe, expect, it, mock } from 'bun:test';

const originalStorage = Object.getOwnPropertyDescriptor(
  globalThis,
  'localStorage',
);
function stubStorage(value: unknown) {
  Object.defineProperty(globalThis, 'localStorage', {
    value,
    configurable: true,
  });
}
import { readProgress, saveProgress } from './storage';

afterEach(() => {
  if (originalStorage)
    Object.defineProperty(globalThis, 'localStorage', originalStorage);
  else Reflect.deleteProperty(globalThis, 'localStorage');
});

describe('local progress', () => {
  it('validates and deduplicates saved chapters', () => {
    stubStorage({
      getItem: () =>
        JSON.stringify({ completed: [0, 0, 3, 5, -1, '1', null], sound: true }),
    });
    expect(readProgress()).toEqual({ completed: [0, 3], sound: true });
  });
  it.each(['broken JSON', 'null', '{}', '[]'])(
    'recovers from invalid data: %s',
    (data) => {
      stubStorage({ getItem: () => data });
      expect(readProgress()).toEqual({ completed: [], sound: false });
    },
  );
  it('keeps gameplay available when storage is blocked', () => {
    stubStorage({
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
    const setItem = mock();
    stubStorage({ setItem });
    const progress = { completed: [0, 1], sound: true };
    expect(saveProgress(progress)).toBe(true);
    expect(setItem).toHaveBeenCalledWith(
      'subtraction-forest:v1',
      JSON.stringify(progress),
    );
  });
});
