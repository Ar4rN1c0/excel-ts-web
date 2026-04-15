export const mins = (n: number) => n * 60 * 1000



export function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export function randomInt(min: number, max: number): number {
  // Ensure min is less than max
  if (min > max) {
    throw new Error("Minimum value must be less than maximum value.");
  }

  // Generate a random integer between min (inclusive) and max (inclusive)
  return Math.floor(Math.random() * (max - min + 1)) + min;
}



export function mapObject<T, U>(
  obj: Record<string, T>,
  fn: (key: string, value: T) => U
): Record<string, U> {
  const res: Record<string, U> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      res[key] = fn(key, obj[key]);
    }
  }
  return res;
}

export function camelize(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase()
    )
    .replace(/\s+/g, '')
    .replace(/[^\w]/g, '');
}
