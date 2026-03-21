export function validatepaglim1(v: number): boolean { return v > 0 && v < 1e12; }
export function formatpaglim1(s: string): string { return s.trim().slice(0,64); }
