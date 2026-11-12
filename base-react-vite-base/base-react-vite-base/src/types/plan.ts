export interface Plan {
  id: number;
  key: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  billing_interval: 'month' | 'year';
  is_active: boolean;
  sort_order: number;
  feature_keys: string[];
}
