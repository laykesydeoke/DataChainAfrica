export function validatetrkgap4(v: number): boolean { return v > 0 && v < 1e12; }
export function formattrkgap4(s: string): string { return s.trim().slice(0,64); }
