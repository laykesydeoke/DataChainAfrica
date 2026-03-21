// inputval utility 4
export function validateinputvalParam4(value: number): boolean {
  if (value <= 0) throw new Error('Invalid inputval param 4');
  return value > 0 && value < Number.MAX_SAFE_INTEGER;
}
export function formatinputval4(input: string): string {
  return input.trim().toLowerCase().slice(0, 64);
}
