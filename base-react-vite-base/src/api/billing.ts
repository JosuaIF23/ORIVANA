import { apiClient } from './client';
import { unwrapApiResponse } from '@/utils/apiResponse';
import type { Plan } from '@/types/plan';
import type { Subscription } from '@/types/subscription';
import type { CheckoutResult, Invoice } from '@/types/invoice';
import type { UsageStatus } from '@/types/usage';

export async function fetchPlans(): Promise<Plan[]> {
  const response = await apiClient.get('/plans');
  return unwrapApiResponse<Plan[]>(response.data);
}

export async function fetchCurrentSubscription(): Promise<Subscription> {
  const response = await apiClient.get('/subscriptions/current');
  return unwrapApiResponse<Subscription>(response.data);
}

export async function createCheckout(planId: number): Promise<CheckoutResult> {
  const response = await apiClient.post('/subscriptions/checkout', { plan_id: planId });
  return unwrapApiResponse<CheckoutResult>(response.data);
}

export async function fetchInvoices(): Promise<Invoice[]> {
  const response = await apiClient.get('/invoices');
  return unwrapApiResponse<Invoice[]>(response.data);
}

export async function fetchUsageSummary(): Promise<UsageStatus[]> {
  const response = await apiClient.get('/usage');
  return unwrapApiResponse<UsageStatus[]>(response.data);
}
