export interface errstdConfig3 {
  enabled: boolean;
  maxRetries: number;
  timeout: number;
  threshold: number;
}
export type errstdStatus3 = 'active' | 'inactive' | 'pending' | 'error';
export type errstdResult3 = { success: boolean; data?: unknown; error?: string };
