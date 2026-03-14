/**
 * Supabase Storage Service Implementation
 * Handles file uploads to Supabase Storage buckets
 */

import { createBrowserClient } from '@infrastructure/auth/supabase-auth-client';
import type {
  IStorageService,
  UploadOptions,
  UploadResult,
  DeleteOptions,
  ListFilesOptions,
  StorageFile,
} from './storage-service';

export class SupabaseStorageService implements IStorageService {
  private client = createBrowserClient();

  /**
   * Upload a file to Supabase Storage
   */
  async upload(options: UploadOptions): Promise<UploadResult> {
    const { file, bucket, path = '' } = options;

    // Generate unique filename to prevent collisions
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop();
    const filename = `${timestamp}-${randomStr}.${extension}`;
    const normalizedPath = path ? (path.endsWith('/') ? path : `${path}/`) : '';
    const fullPath = `${normalizedPath}${filename}`;

    // Upload file
    const { data, error } = await this.client.storage
      .from(bucket)
      .upload(fullPath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    if (!data) {
      throw new Error('Upload succeeded but no data returned');
    }

    // Get public URL
    const url = this.getPublicUrl(bucket, data.path);

    return {
      url,
      path: data.path,
      size: file.size,
    };
  }

  /**
   * Delete a file from Supabase Storage
   */
  async delete(options: DeleteOptions): Promise<void> {
    const { bucket, path } = options;

    const { error } = await this.client.storage.from(bucket).remove([path]);

    if (error) {
      console.error('Storage delete error:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(bucket: string, path: string): string {
    const { data } = this.client.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  /**
   * List files in a bucket/path
   */
  async listFiles(options: ListFilesOptions): Promise<StorageFile[]> {
    const { bucket, path = '' } = options;
    const normalizedPath = path ? (path.endsWith('/') ? path : `${path}/`) : '';
    const { data, error } = await this.client.storage
      .from(bucket)
      .list(normalizedPath, {
        limit: 200,
        sortBy: { column: 'created_at', order: 'desc' },
      });
    if (error) throw new Error(`Failed to list files: ${error.message}`);
    return (data ?? [])
      .filter((f) => f.name !== '.emptyFolderPlaceholder')
      .map((f) => ({
        name: f.name,
        path: normalizedPath ? `${normalizedPath}${f.name}` : f.name,
        size: f.metadata?.size ?? 0,
        createdAt: f.created_at ?? new Date().toISOString(),
      }));
  }
}

/**
 * Create a storage service instance
 */
export const createStorageService = (): IStorageService => {
  return new SupabaseStorageService();
};
