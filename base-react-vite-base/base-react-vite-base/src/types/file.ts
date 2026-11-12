export interface UploadedFile {
  id: number;
  client_id: number;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  storage_provider: 'local' | 's3';
  created_at: string;
  updated_at: string;
}
