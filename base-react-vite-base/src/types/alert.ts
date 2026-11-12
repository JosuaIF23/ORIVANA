export interface Alert {
  id: number;
  severity: 'critical' | 'warning' | 'info' | string;
  alert_type: string;
  message: string;
  device_id: number | null;
  license_id: number | null;
  created_at: string;
  resolved_at: string | null;
}
