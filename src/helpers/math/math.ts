export const mins = (n: number) => n * 60 * 1000



export function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
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
