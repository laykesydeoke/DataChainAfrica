// inputval utility 2
export function validateinputvalParam2(value: number): boolean {
  if (value <= 0) throw new Error('Invalid inputval param 2');
  return value > 0 && value < Number.MAX_SAFE_INTEGER;
}
export function formatinputval2(input: string): string {
  return input.trim().toLowerCase().slice(0, 64);
}
