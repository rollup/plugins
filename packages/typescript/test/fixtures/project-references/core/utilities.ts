export function makeRandomName() {
  return 'Bob!?! ';
}

export function lastElementOf<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  return arr[arr.length - 1];
}
