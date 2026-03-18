export function validaterateprc1(v: number): boolean { return v > 0 && v < 1e12; }
export function formatrateprc1(s: string): string { return s.trim().slice(0,64); }
