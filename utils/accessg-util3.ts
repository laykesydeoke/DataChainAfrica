// accessg utility 3
export function validateaccessgParam3(value: number): boolean {
  if (value <= 0) throw new Error('Invalid accessg param 3');
  return value > 0 && value < Number.MAX_SAFE_INTEGER;
}
export function formataccessg3(input: string): string {
  return input.trim().toLowerCase().slice(0, 64);
}
