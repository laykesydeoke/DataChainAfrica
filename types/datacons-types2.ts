export interface dataconsConfig2 {
  enabled: boolean;
  maxRetries: number;
  timeout: number;
  threshold: number;
}
export type dataconsStatus2 = 'active' | 'inactive' | 'pending' | 'error';
export type dataconsResult2 = { success: boolean; data?: unknown; error?: string };
