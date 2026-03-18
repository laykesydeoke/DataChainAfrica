export function validaterateprc3(v: number): boolean { return v > 0 && v < 1e12; }
export function formatrateprc3(s: string): string { return s.trim().slice(0,64); }
