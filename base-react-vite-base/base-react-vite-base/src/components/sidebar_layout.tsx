import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  ArrowLeft,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  LogOut,
  Menu,
  Receipt,
  Settings,
  X,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Navbar } from '@/components/navbar';
import { useUserStore } from '@/stores/userStore';
import { hasPermission } from '@/utils/permissions';
import { ADMIN_NAV_GROUP, TOP_NAV_ITEMS, type NavGroup, type NavItem } from '@/config/navigation';
import { logout } from '@/api/auth';
import type { Permission } from '@/utils/permissions';


interface SidebarLayoutProps {
  children: React.ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const router = useRouterState();
  const navigate = useNavigate();
  const { user, activeClientId } = useUserStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const currentPath = router.location.pathname;
  const isSettingsArea = currentPath === '/settings' || ADMIN_NAV_GROUP.items.some((item) => currentPath === item.href || currentPath.startsWith(`${item.href}/`));

  const visibleTopItems = useMemo(() => {
    return TOP_NAV_ITEMS.filter((item) => !item.permission || (user && hasPermission(user, item.permission, activeClientId)));
  }, [user, activeClientId]);

  const visibleGroups = useMemo(() => {
    if (!user) return [];
    const billingGroup: NavGroup = {
      id: 'billing',
      label: 'Billing & Usage',
      icon: CreditCard,
      items: [
        { href: '/billing', label: 'Plans & Subscription', icon: CreditCard, permission: 'admin.subscriptions:read' as Permission },
        { href: '/billing-invoices', label: 'Invoices', icon: Receipt, permission: 'admin.invoices:read' as Permission },
      ],
    };
    return [ADMIN_NAV_GROUP, billingGroup].map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.permission || hasPermission(user, item.permission, activeClientId)),
    })).filter((group) => group.items.length > 0);
  }, [user, activeClientId]);


  if (!user) {
    return <>{children}</>;
  }

  const renderNavItem = (item: NavItem, inset = false) => {
    const Icon = item.icon;
    const isActive = currentPath === item.href || currentPath.startsWith(`${item.href}/`);

    return (
      <Link
        key={item.href}
        to={item.href}
        title={sidebarCollapsed ? item.label : undefined}
        className={cn(
          'group flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors',
          sidebarCollapsed ? 'lg:justify-center lg:px-3' : '',
          inset && !sidebarCollapsed ? 'ml-3' : '',
          isActive
            ? 'border-r-2 border-slate-700 bg-[#e8eff3] text-slate-900 shadow-sm'
            : 'text-slate-500 hover:bg-[#e8eff3]/70 hover:text-slate-800'
        )}
        onClick={() => setSidebarOpen(false)}
      >
        <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-[#545f73]' : 'text-slate-400 group-hover:text-slate-600')} />
        <span className={cn(sidebarCollapsed ? 'lg:hidden' : '')}>{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#2a3439] antialiased">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />

      <aside
        className={cn(
          'fixed left-0 top-16 z-40 flex h-[calc(100vh-4rem)] flex-col border-r border-slate-200/70 bg-slate-100 px-4 py-6 transition-all duration-300',
          sidebarCollapsed ? 'w-64 lg:w-20' : 'w-64',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className={cn('mb-8 px-4', sidebarCollapsed ? 'lg:px-0' : '')}>
          <div className={cn('flex items-center gap-3', sidebarCollapsed ? 'lg:justify-center' : 'lg:justify-between')}>
            <button
              type="button"
              onClick={() => setSidebarCollapsed((current) => !current)}
              className="hidden rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-200/70 lg:block"
              aria-label={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
              title={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            >
              {sidebarCollapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-y-1 overflow-y-auto pr-1">
          {!isSettingsArea && visibleTopItems.map((item) => renderNavItem(item))}
          {isSettingsArea && (
            <>
              <Link to="/dashboard" title={sidebarCollapsed ? 'Back to dashboard' : undefined} className={cn('group mb-2 flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-500 transition-colors hover:bg-[#e8eff3]/70 hover:text-slate-800', sidebarCollapsed ? 'lg:justify-center lg:px-3' : '')} onClick={() => setSidebarOpen(false)}>
                <ArrowLeft className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-slate-600" />
                <span className={cn(sidebarCollapsed ? 'lg:hidden' : '')}>Back to dashboard</span>
              </Link>
              {visibleGroups.map((group) => (
                <div key={group.id} className="mt-3 space-y-1">
                  {!sidebarCollapsed && <p className="px-4 pb-1 text-xs font-bold uppercase tracking-wider text-slate-400">{group.label}</p>}
                  {group.items.map((item) => renderNavItem(item))}
                </div>
              ))}
            </>
          )}
        </nav>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button type="button" className={cn('mt-4 flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left transition-colors hover:bg-[#e8eff3] focus:outline-none focus:ring-2 focus:ring-[#545f73]/30', sidebarCollapsed ? 'lg:justify-center lg:px-2' : '')} aria-label="Open account menu">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d8e3fb] text-sm font-bold text-[#475266]">{user.name?.slice(0, 1).toUpperCase() || 'U'}</div>
              <div className={cn('min-w-0 flex-1', sidebarCollapsed ? 'lg:hidden' : '')}>
                <p className="truncate text-sm font-bold text-slate-800">{user.name}</p>
                <p className="truncate text-xs font-medium text-slate-500">Account</p>
              </div>
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content side="right" align="end" sideOffset={8} className="z-[60] min-w-48 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
              <DropdownMenu.Item onSelect={() => navigate({ to: '/settings' })} className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-slate-700 outline-none hover:bg-[#e8eff3] focus:bg-[#e8eff3]"><Settings className="h-4 w-4 text-slate-500" />Settings</DropdownMenu.Item>
              <DropdownMenu.Item onSelect={() => { logout(); useUserStore.getState().clearUser(); navigate({ to: '/login' }); }} className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-slate-700 outline-none hover:bg-[#e8eff3] focus:bg-[#e8eff3]"><LogOut className="h-4 w-4 text-slate-500" />Logout</DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className={cn('min-h-screen bg-[#f7f9fb] pt-16 transition-all duration-300', sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64')}>
        <div className="relative min-h-[calc(100vh-4rem)] overflow-y-auto bg-[radial-gradient(#a9b4b9_1px,transparent_1px)] [background-size:24px_24px]">
          <div className="min-h-[calc(100vh-4rem)] bg-[#f7f9fb]/95 p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </div>
      </main>

      <button
        type="button"
        className="fixed bottom-4 left-4 z-50 rounded-lg bg-[#545f73] p-3 text-white shadow-lg transition-colors hover:bg-[#485367] lg:hidden"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
    </div>
  );
}
