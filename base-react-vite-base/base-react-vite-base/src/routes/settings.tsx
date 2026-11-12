import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { ArrowLeft, CreditCard, Receipt, Settings } from 'lucide-react';
import { useUserStore } from '@/stores/userStore';
import { hasPermission, type Permission } from '@/utils/permissions';
import { ADMIN_NAV_GROUP } from '@/config/navigation';
import { PageTransition } from '@/components/page_transition';

function SettingsPage() {
  const { user, activeClientId } = useUserStore();
  const groups = [
    ADMIN_NAV_GROUP,
    {
      id: 'billing' as const,
      label: 'Billing & Usage',
      icon: CreditCard,
      items: [
        { href: '/billing', label: 'Plans & Subscription', icon: CreditCard, permission: 'admin.subscriptions:read' as Permission },
        { href: '/billing-invoices', label: 'Invoices', icon: Receipt, permission: 'admin.invoices:read' as Permission },
      ],
    },
  ].map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.permission || (user && hasPermission(user, item.permission, activeClientId))),
  })).filter((group) => group.items.length > 0);

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <div className="mt-5 flex items-center gap-3">
            <div className="rounded-xl bg-[#e8eff3] p-3 text-[#545f73]"><Settings className="h-6 w-6" /></div>
            <div>
              <p className="text-sm text-slate-500">Workspace</p>
              <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
            </div>
          </div>
          <p className="mt-2 text-sm text-slate-500">Manage administration, billing, and usage for the active client.</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {groups.map((group) => {
            const GroupIcon = group.icon;
            return (
              <section key={group.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <GroupIcon className="h-5 w-5 text-slate-500" />
                  <h2 className="font-bold text-slate-900">{group.label}</h2>
                </div>
                <div className="mt-3 space-y-1">
                  {group.items.map((item) => {
                    const ItemIcon = item.icon;
                    return <Link key={item.href} to={item.href} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-slate-600 hover:bg-[#e8eff3] hover:text-slate-900"><ItemIcon className="h-4 w-4 text-slate-400" />{item.label}</Link>;
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </PageTransition>
  );
}

export const Route = createFileRoute('/settings')({
  beforeLoad: () => {
    const { token, user } = useUserStore.getState();
    if (!token || !user) throw redirect({ to: '/login', replace: true });
  },
  component: SettingsPage,
});