// inputval utility 1
export function validateinputvalParam1(value: number): boolean {
  if (value <= 0) throw new Error('Invalid inputval param 1');
  return value > 0 && value < Number.MAX_SAFE_INTEGER;
}
export function formatinputval1(input: string): string {
  return input.trim().toLowerCase().slice(0, 64);
}
