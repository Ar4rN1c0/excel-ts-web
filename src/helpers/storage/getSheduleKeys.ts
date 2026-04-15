export function getScheduleKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("Schedule: ")) {
      keys.push(key);
    }
  }
  return keys;
}

