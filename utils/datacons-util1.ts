// datacons utility 1
export function validatedataconsParam1(value: number): boolean {
  if (value <= 0) throw new Error('Invalid datacons param 1');
  return value > 0 && value < Number.MAX_SAFE_INTEGER;
}
export function formatdatacons1(input: string): string {
  return input.trim().toLowerCase().slice(0, 64);
}
