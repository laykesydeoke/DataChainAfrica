export interface accessgConfig1 {
  enabled: boolean;
  maxRetries: number;
  timeout: number;
  threshold: number;
}
export type accessgStatus1 = 'active' | 'inactive' | 'pending' | 'error';
export type accessgResult1 = { success: boolean; data?: unknown; error?: string };
