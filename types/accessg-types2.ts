export interface accessgConfig2 {
  enabled: boolean;
  maxRetries: number;
  timeout: number;
  threshold: number;
}
export type accessgStatus2 = 'active' | 'inactive' | 'pending' | 'error';
export type accessgResult2 = { success: boolean; data?: unknown; error?: string };
