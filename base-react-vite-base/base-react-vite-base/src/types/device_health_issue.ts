export interface DeviceHealthIssue {
  id: number;
  device_id: number;
  device_name?: string | null;
  issue_type: string;
  severity: 'warning' | 'critical' | string;
  message: string;
  created_at: string;
  resolved_at?: string | null;
}
