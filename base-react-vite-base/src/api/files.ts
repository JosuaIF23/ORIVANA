import { apiClient } from './client';
import { unwrapApiResponse } from '@/utils/apiResponse';
import { UploadedFile } from '@/types/file';

export async function fetchFiles(): Promise<UploadedFile[]> {
  const response = await apiClient.get('/files');
  return unwrapApiResponse<UploadedFile[]>(response.data);
}

export async function uploadFile(file: File): Promise<UploadedFile> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post('/files', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return unwrapApiResponse<UploadedFile>(response.data);
}

export async function deleteFile(id: number): Promise<void> {
  await apiClient.delete(`/files/${id}`);
}

export async function downloadFile(file: UploadedFile): Promise<void> {
  const response = await apiClient.get(`/files/${file.id}/download`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(response.data as Blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.original_name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
