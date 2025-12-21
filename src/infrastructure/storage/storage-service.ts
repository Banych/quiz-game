/**
 * Storage Service Interface
 * Abstraction for file uploads to support different storage providers
 */

export interface UploadOptions {
  /**
   * File to upload
   */
  file: File;

  /**
   * Bucket name
   */
  bucket: string;

  /**
   * Optional path prefix (e.g., 'quizzes/123/')
   */
  path?: string;

  /**
   * Whether to make the file publicly accessible
   */
  public?: boolean;
}

export interface UploadResult {
  /**
   * Public URL to access the uploaded file
   */
  url: string;

  /**
   * Storage path (key) of the uploaded file
   */
  path: string;

  /**
   * Size of the uploaded file in bytes
   */
  size: number;
}

export interface DeleteOptions {
  /**
   * Bucket name
   */
  bucket: string;

  /**
   * File path to delete
   */
  path: string;
}

/**
 * Storage Service for file uploads/downloads
 */
export interface IStorageService {
  /**
   * Upload a file to storage
   */
  upload(options: UploadOptions): Promise<UploadResult>;

  /**
   * Delete a file from storage
   */
  delete(options: DeleteOptions): Promise<void>;

  /**
   * Get public URL for a file
   */
  getPublicUrl(bucket: string, path: string): string;
}
