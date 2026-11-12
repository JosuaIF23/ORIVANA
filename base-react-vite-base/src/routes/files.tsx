import { createFileRoute } from '@tanstack/react-router';
import { requirePermissionBeforeLoad } from '@/utils/route_guards';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchFiles, uploadFile, deleteFile, downloadFile } from '@/api/files';
import type { UploadedFile } from '@/types/file';
import { Button } from '@/components/button';
import { DateDisplay } from '@/components/date_display';
import { ConfirmationDialog } from '@/components/confirmation_dialog';
import { PageSkeleton } from '@/components/loading_skeleton';
import { PageTransition } from '@/components/page_transition';
import { useNotificationStore } from '@/stores/notificationStore';
import { useUserStore } from '@/stores/userStore';
import { hasPermission } from '@/utils/permissions';
import { DataTable, type DataTableColumn, type RowAction } from '@/components/datatable';
import { Download, Trash2, Upload } from 'lucide-react';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${exponent === 0 ? value : value.toFixed(1)} ${units[exponent]}`;
}

function FilesPage() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((state) => state.addNotification);
  const { user: currentUser } = useUserStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<UploadedFile | null>(null);

  const { data: files = [], isLoading } = useQuery({
    queryKey: ['files'],
    queryFn: fetchFiles,
  });

  const uploadMutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      addNotification({
        type: 'success',
        title: 'File uploaded',
        message: 'The file has been uploaded successfully.',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Upload failed',
        message: error?.response?.data?.error || 'Failed to upload the file. Please try again.',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      setShowDeleteConfirm(false);
      setFileToDelete(null);
      addNotification({
        type: 'success',
        title: 'File deleted',
        message: 'The file has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Delete failed',
        message: error?.response?.data?.error || 'Failed to delete the file. Please try again.',
      });
    },
  });

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const handleDownload = useCallback(
    async (file: UploadedFile) => {
      try {
        await downloadFile(file);
      } catch {
        addNotification({
          type: 'error',
          title: 'Download failed',
          message: 'Failed to download the file. Please try again.',
        });
      }
    },
    [addNotification]
  );

  const canCreate = hasPermission(currentUser, 'admin.files:create');
  const canDelete = hasPermission(currentUser, 'admin.files:delete');

  const columns: DataTableColumn<UploadedFile>[] = useMemo(
    () => [
      {
        id: 'original_name',
        header: 'Name',
        accessorKey: 'original_name',
        sortable: true,
        filterable: true,
        filterType: 'text',
        cell: (file) => <span className="font-medium text-gray-900">{file.original_name}</span>,
      },
      {
        id: 'mime_type',
        header: 'Type',
        accessorKey: 'mime_type',
        sortable: true,
        filterable: true,
        filterType: 'text',
      },
      {
        id: 'size_bytes',
        header: 'Size',
        accessorKey: 'size_bytes',
        sortable: true,
        cell: (file) => <span className="text-sm text-gray-700">{formatBytes(file.size_bytes)}</span>,
      },
      {
        id: 'storage_provider',
        header: 'Storage',
        accessorKey: 'storage_provider',
        sortable: true,
        filterable: true,
        filterType: 'select',
        filterOptions: [
          { label: 'S3', value: 's3' },
          { label: 'Local', value: 'local' },
        ],
        cell: (file) => (
          <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 uppercase">
            {file.storage_provider}
          </span>
        ),
      },
      {
        id: 'created_at',
        header: 'Uploaded At',
        accessorKey: 'created_at',
        sortable: true,
        filterable: true,
        filterType: 'date',
        cell: (file) => <DateDisplay date={file.created_at} />,
      },
    ],
    []
  );

  const rowActions: RowAction<UploadedFile>[] = useMemo(() => {
    const actions: RowAction<UploadedFile>[] = [
      {
        id: 'download',
        label: 'Download',
        icon: <Download className="w-4 h-4" />,
        onClick: (file) => handleDownload(file),
      },
    ];

    if (canDelete) {
      actions.push({
        id: 'delete',
        label: 'Delete',
        icon: <Trash2 className="w-4 h-4" />,
        variant: 'danger',
        onClick: (file) => {
          setFileToDelete(file);
          setShowDeleteConfirm(true);
        },
      });
    }

    return actions;
  }, [canDelete, handleDownload]);

  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <PageTransition>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Files</h1>
          {canCreate && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelected}
              />
              <Button
                variant="primary"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadMutation.isPending}
                isLoading={uploadMutation.isPending}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {uploadMutation.isPending ? 'Uploading...' : 'Upload File'}
              </Button>
            </>
          )}
        </div>

        <DataTable
          data={files}
          columns={columns}
          rowActions={rowActions}
          isLoading={isLoading}
          rowIdAccessor="id"
          exportable
          exportFilename="files"
          tableId="files-table"
          emptyState={
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">No files uploaded yet</p>
              {canCreate && (
                <Button variant="primary" onClick={() => fileInputRef.current?.click()}>
                  Upload your first file
                </Button>
              )}
            </div>
          }
        />

        <ConfirmationDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title="Delete File"
          description={`Are you sure you want to delete "${fileToDelete?.original_name}"? This action cannot be undone.`}
          confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          variant="danger"
          isLoading={deleteMutation.isPending}
          onConfirm={() => {
            if (fileToDelete) {
              deleteMutation.mutate(fileToDelete.id);
            }
          }}
        />
      </div>
    </PageTransition>
  );
}

export const Route = createFileRoute('/files')({
  beforeLoad: requirePermissionBeforeLoad('admin.files:read'),
  component: FilesPage,
});
