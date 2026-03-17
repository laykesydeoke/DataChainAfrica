export interface accessgConfig3 {
  enabled: boolean;
  maxRetries: number;
  timeout: number;
  threshold: number;
}
export type accessgStatus3 = 'active' | 'inactive' | 'pending' | 'error';
export type accessgResult3 = { success: boolean; data?: unknown; error?: string };
