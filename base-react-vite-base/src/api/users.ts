import { apiClient } from './client';
import { z } from 'zod';
import type { User } from '@/types/user';
import { unwrapApiResponse } from '@/utils/apiResponse';

const membershipRoleSchema = z.object({
  id: z.number(),
  key: z.string(),
  name: z.string(),
  client_id: z.number().nullable().optional().default(null),
});

const userResponseSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((val) => String(val)),
  name: z.string(),
  email: z.string().email(),
  role: z.string().nullable().optional(),
  roles: z.array(membershipRoleSchema).optional().default([]),
  primary_role: membershipRoleSchema.nullable().optional().default(null),
  client_id: z.number().nullable().optional().default(null),
  branch_id: z.number().nullable().optional(),
  client: z.object({
    id: z.number(),
    name: z.string(),
    code: z.string(),
  }).nullable().optional(),
  branch: z.object({
    id: z.number(),
    name: z.string(),
    code: z.string(),
  }).nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  temporary_password: z.string().nullable().optional(),
  must_change_password: z.boolean().nullable().optional(),
});

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.string().nullable().optional(),
  roles: z.array(membershipRoleSchema).optional(),
  primary_role: membershipRoleSchema.nullable().optional().default(null),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters').nullable().optional(),
  role_ids: z.array(z.number().int().positive()).min(1, 'At least one role is required'),
  primary_role_id: z.number().int().positive().nullable().optional(),
  client_id: z.number().int().positive('Client ID is required'),
  branch_id: z.number().int().positive().nullable().optional(),
  must_change_password: z.boolean().nullable().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  email: z.string().email('Invalid email format').optional(),
  password: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().min(6, 'Password must be at least 6 characters').nullable().optional()
  ),
  role_ids: z.array(z.number().int().positive()).min(1, 'At least one role is required').optional(),
  primary_role_id: z.number().int().positive().nullable().optional(),
  branch_id: z.number().int().positive().nullable().optional(),
  must_change_password: z.boolean().nullable().optional(),
});

export type { User };

function toUser(parsed: z.infer<typeof userResponseSchema>): User {
  return {
    id: parsed.id,
    name: parsed.name,
    email: parsed.email,
    role: parsed.role,
    roles: parsed.roles,
    primary_role: parsed.primary_role ?? null,
    client_id: parsed.client_id,
    branch_id: parsed.branch_id,
    client: parsed.client,
    branch: parsed.branch,
    createdAt: parsed.created_at,
    updatedAt: parsed.updated_at,
    must_change_password: parsed.must_change_password,
  };
}

export async function fetchUser(userId: string): Promise<User> {
  const response = await apiClient.get(`/users/${userId}`);
  const unwrapped = unwrapApiResponse<unknown>(response.data);
  return toUser(userResponseSchema.parse(unwrapped));
}

export async function fetchUsers(): Promise<User[]> {
  const response = await apiClient.get('/users');
  const unwrapped = unwrapApiResponse<unknown>(response.data);
  return z.array(userResponseSchema).parse(unwrapped).map(toUser);
}

export interface CreateUserResult {
  user: User;
  temporaryPassword?: string | null;
}

export async function createUser(data: z.infer<typeof createUserSchema>): Promise<CreateUserResult> {
  const validated = createUserSchema.parse(data);
  const response = await apiClient.post('/users', validated);
  const unwrapped = unwrapApiResponse<unknown>(response.data);
  const parsed = userResponseSchema.parse(unwrapped);
  return {
    user: toUser(parsed),
    temporaryPassword: parsed.temporary_password ?? null,
  };
}

export async function updateUser(userId: string, data: Partial<z.infer<typeof updateUserSchema>>): Promise<User> {
  const response = await apiClient.put(`/users/${userId}`, data);
  const unwrapped = unwrapApiResponse<unknown>(response.data);
  return toUser(userResponseSchema.parse(unwrapped));
}

export async function deleteUser(userId: string): Promise<void> {
  await apiClient.delete(`/users/${userId}`);
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  password_confirmation: string;
}

export async function changeUserPassword(userId: string | number, payload: ChangePasswordPayload): Promise<void> {
  await apiClient.put(`/users/${userId}/password`, payload);
}

