export interface errstdConfig2 {
  enabled: boolean;
  maxRetries: number;
  timeout: number;
  threshold: number;
}
export type errstdStatus2 = 'active' | 'inactive' | 'pending' | 'error';
export type errstdResult2 = { success: boolean; data?: unknown; error?: string };
