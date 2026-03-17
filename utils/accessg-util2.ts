// accessg utility 2
export function validateaccessgParam2(value: number): boolean {
  if (value <= 0) throw new Error('Invalid accessg param 2');
  return value > 0 && value < Number.MAX_SAFE_INTEGER;
}
export function formataccessg2(input: string): string {
  return input.trim().toLowerCase().slice(0, 64);
}
