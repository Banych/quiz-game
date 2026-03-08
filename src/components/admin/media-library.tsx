'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { Button } from '@ui/button';
import { SupabaseStorageService } from '@infrastructure/storage/supabase-storage';
import { formatFileSize } from '@lib/image-utils';
import type { MediaFileDTO } from '@application/dtos/media.dto';

const storageService = new SupabaseStorageService();
const BUCKET = 'quiz-media';

export function MediaLibrary() {
  const queryClient = useQueryClient();

  const {
    data: files,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin', 'media'],
    queryFn: async (): Promise<MediaFileDTO[]> => {
      const raw = await storageService.listFiles({ bucket: BUCKET });
      return raw.map((f) => ({
        name: f.name,
        path: f.path,
        url: storageService.getPublicUrl(BUCKET, f.path),
        size: f.size,
        createdAt: f.createdAt,
      }));
    },
  });

  const handleDelete = async (file: MediaFileDTO) => {
    if (!confirm(`Delete "${file.name}"?`)) return;
    await storageService.delete({ bucket: BUCKET, path: file.path });
    queryClient.invalidateQueries({ queryKey: ['admin', 'media'] });
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        Loading media...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-sm text-destructive">
        Failed to load media. Please try again.
      </div>
    );
  }

  if (!files || files.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No media files found. Upload images when creating or editing questions.
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {files.map((file) => (
        <div
          key={file.path}
          className="group relative rounded-lg border bg-card overflow-hidden"
        >
          <div className="aspect-square bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={file.url}
              alt={file.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="p-2">
            <p className="truncate text-xs font-medium" title={file.name}>
              {file.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(file.size)}
            </p>
          </div>
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Delete"
            aria-label={`Delete ${file.name}`}
            onClick={() => handleDelete(file)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}
