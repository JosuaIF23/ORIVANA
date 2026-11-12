import { z } from 'zod';

export const checkoutSchema = z.object({
  plan_id: z.number().int().positive('Please select a plan'),
});
