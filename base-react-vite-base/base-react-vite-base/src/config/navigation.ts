import {
  BarChart3,
  Building2,
  ClipboardList,
  FileText,
  Files,
  Key,
  ShieldCheck,
  UserCircle,
  Users,
} from 'lucide-react';
import type { ComponentType } from 'react';
import type { Permission } from '@/utils/permissions';

export interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  permission?: Permission;
}

export interface NavGroup {
  id: 'admin' | 'billing';
  label: string;
  icon: ComponentType<{ className?: string }>;
  items: NavItem[];
}

export const TOP_NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3, permission: 'dashboard:read' },
];

export const ADMIN_NAV_GROUP: NavGroup = {
  id: 'admin',
  label: 'Administration',
  icon: Users,
  items: [
    { href: '/clients', label: 'Clients', icon: Users, permission: 'admin.clients:read' },
    { href: '/branches', label: 'Branches', icon: Building2, permission: 'admin.branches:read' },
    { href: '/users', label: 'Users', icon: Users, permission: 'admin.users:read' },
    { href: '/employees', label: 'Employees', icon: UserCircle, permission: 'admin.employees:read' },
    { href: '/files', label: 'Files', icon: Files, permission: 'admin.files:read' },
    { href: '/api-keys', label: 'API Keys', icon: Key, permission: 'admin.api_keys:read' },
    { href: '/audit-logs', label: 'Audit Logs', icon: FileText, permission: 'admin.audit_logs:read' },
    { href: '/reports', label: 'Reports', icon: ClipboardList, permission: 'admin.reports:read' },
    { href: '/rbac', label: 'RBAC', icon: ShieldCheck, permission: 'admin.rbac:manage' },
  ],
};
