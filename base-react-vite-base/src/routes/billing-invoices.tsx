import { createFileRoute } from '@tanstack/react-router';
import { requirePermissionBeforeLoad } from '@/utils/route_guards';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchInvoices } from '@/api/billing';
import type { Invoice } from '@/types/invoice';
import { Card } from '@/components/card';
import { DateDisplay } from '@/components/date_display';
import { PageSkeleton } from '@/components/loading_skeleton';
import { PageTransition } from '@/components/page_transition';
import { DataTable, type DataTableColumn } from '@/components/datatable';
import { Receipt } from 'lucide-react';

function getStatusBadge(status: Invoice['status']) {
  const styles: Record<Invoice['status'], string> = {
    paid: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    failed: 'bg-red-100 text-red-800',
    expired: 'bg-gray-100 text-gray-800',
  };
  return <span className={`px-2 py-1 text-xs font-medium rounded capitalize ${styles[status]}`}>{status}</span>;
}

function BillingInvoicesPage() {
  const { data: invoices = [], isLoading, error } = useQuery({
    queryKey: ['invoices'],
    queryFn: fetchInvoices,
  });

  const columns: DataTableColumn<Invoice>[] = useMemo(
    () => [
      {
        id: 'id',
        header: 'Invoice',
        accessorFn: (invoice) => `INV-${invoice.id}`,
        sortable: true,
      },
      {
        id: 'amount',
        header: 'Amount',
        accessorFn: (invoice) =>
          new Intl.NumberFormat('id-ID', { style: 'currency', currency: invoice.currency, maximumFractionDigits: 0 }).format(
            invoice.amount
          ),
        sortable: true,
      },
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        sortable: true,
        filterable: true,
        filterType: 'select',
        filterOptions: [
          { label: 'Paid', value: 'paid' },
          { label: 'Pending', value: 'pending' },
          { label: 'Failed', value: 'failed' },
          { label: 'Expired', value: 'expired' },
        ],
        cell: (invoice) => getStatusBadge(invoice.status),
      },
      {
        id: 'due_date',
        header: 'Due',
        accessorKey: 'due_date',
        sortable: true,
        filterable: true,
        filterType: 'date',
        cell: (invoice) => (invoice.due_date ? <DateDisplay date={invoice.due_date} /> : <span className="text-gray-500">—</span>),
      },
      {
        id: 'paid_at',
        header: 'Paid',
        accessorKey: 'paid_at',
        sortable: true,
        filterable: true,
        filterType: 'date',
        cell: (invoice) => (invoice.paid_at ? <DateDisplay date={invoice.paid_at} /> : <span className="text-gray-500">—</span>),
      },
      {
        id: 'created_at',
        header: 'Created',
        accessorKey: 'created_at',
        sortable: true,
        filterable: true,
        filterType: 'date',
        cell: (invoice) => <DateDisplay date={invoice.created_at} />,
      },
    ],
    []
  );

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error) {
    return (
      <PageTransition>
        <Card>
          <p className="text-red-600">Failed to load invoices</p>
        </Card>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <p className="text-sm text-gray-600">Billing</p>
          <h1 className="text-2xl font-bold text-gray-900">Invoice History</h1>
        </div>

        <DataTable
          data={invoices}
          columns={columns}
          isLoading={isLoading}
          rowIdAccessor="id"
          exportable
          exportFilename="invoices"
          tableId="invoices-table"
          emptyState={
            <div className="py-8 text-center text-gray-500">
              <Receipt className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p>No invoices yet.</p>
            </div>
          }
        />
      </div>
    </PageTransition>
  );
}

export const Route = createFileRoute('/billing-invoices')({
  beforeLoad: requirePermissionBeforeLoad('admin.invoices:read'),
  component: BillingInvoicesPage,
});
