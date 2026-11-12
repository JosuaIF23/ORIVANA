export interface Invoice {
  id: number;
  client_id: number;
  subscription_id: number;
  plan_id: number;
  doku_invoice_id: string | null;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'expired';
  payment_url: string | null;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CheckoutResult {
  invoice: Invoice;
  payment_url: string | null;
}
