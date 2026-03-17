// datacons utility 3
export function validatedataconsParam3(value: number): boolean {
  if (value <= 0) throw new Error('Invalid datacons param 3');
  return value > 0 && value < Number.MAX_SAFE_INTEGER;
}
export function formatdatacons3(input: string): string {
  return input.trim().toLowerCase().slice(0, 64);
}
