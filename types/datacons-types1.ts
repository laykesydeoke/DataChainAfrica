export interface dataconsConfig1 {
  enabled: boolean;
  maxRetries: number;
  timeout: number;
  threshold: number;
}
export type dataconsStatus1 = 'active' | 'inactive' | 'pending' | 'error';
export type dataconsResult1 = { success: boolean; data?: unknown; error?: string };
