function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const prev = new Array<number>(n + 1);
  const curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

function fuzzyThreshold(targetLength: number): number {
  if (targetLength <= 4) return 0;
  if (targetLength <= 7) return 1;
  return 2;
}

export function isFuzzyMatch(input: string, target: string): boolean {
  const threshold = fuzzyThreshold(target.length);
  if (Math.abs(input.length - target.length) > threshold) return false;
  return levenshtein(input, target) <= threshold;
}

export function fuzzyDistance(input: string, target: string): number {
  return levenshtein(input, target);
}
