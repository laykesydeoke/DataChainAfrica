export interface dataconsConfig3 {
  enabled: boolean;
  maxRetries: number;
  timeout: number;
  threshold: number;
}
export type dataconsStatus3 = 'active' | 'inactive' | 'pending' | 'error';
export type dataconsResult3 = { success: boolean; data?: unknown; error?: string };
