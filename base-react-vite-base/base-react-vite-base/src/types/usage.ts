export interface UsageStatus {
  metric_key: string;
  name: string;
  unit: string | null;
  current_value: number;
  max_value: number | null;
  is_unlimited: boolean;
  is_at_limit: boolean;
}
