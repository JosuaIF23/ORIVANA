import { createFileRoute } from '@tanstack/react-router';
import { Card } from '@/components/card';
import { PageTransition } from '@/components/page_transition';
import { requirePermissionBeforeLoad } from '@/utils/route_guards';

function DashboardPage() {
  return (
    <PageTransition>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">Module status</p>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        </div>

        <Card className="p-6 rounded-xl border-gray-200 bg-white shadow-sm">
          <p className="text-base font-medium text-gray-900">Placeholder page</p>
          <p className="mt-2 text-sm text-gray-600">
            Dashboard services are temporarily unavailable after the latest update.
          </p>
        </Card>
      </div>
    </PageTransition>
  );
}

export const Route = createFileRoute('/dashboard')({
  beforeLoad: requirePermissionBeforeLoad('dashboard:read'),
  component: DashboardPage,
});
