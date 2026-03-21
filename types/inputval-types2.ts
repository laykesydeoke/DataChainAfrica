export interface inputvalConfig2 {
  enabled: boolean;
  maxRetries: number;
  timeout: number;
  threshold: number;
}
export type inputvalStatus2 = 'active' | 'inactive' | 'pending' | 'error';
export type inputvalResult2 = { success: boolean; data?: unknown; error?: string };
