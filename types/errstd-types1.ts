export interface errstdConfig1 {
  enabled: boolean;
  maxRetries: number;
  timeout: number;
  threshold: number;
}
export type errstdStatus1 = 'active' | 'inactive' | 'pending' | 'error';
export type errstdResult1 = { success: boolean; data?: unknown; error?: string };
