const KEY = 'subtraction-forest:v1';
export type Progress = { completed: number[]; sound: boolean };
export function readProgress(): Progress {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return {
      completed: Array.isArray(raw.completed)
        ? [
            ...new Set<number>(
              raw.completed.filter(
                (n: unknown) =>
                  Number.isInteger(n) && Number(n) >= 0 && Number(n) < 4,
              ),
            ),
          ]
        : [],
      sound: raw.sound === true,
    };
  } catch {
    return { completed: [], sound: false };
  }
}
export function saveProgress(progress: Progress): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}
