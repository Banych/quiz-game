import { MediaLibrary } from '@components/admin/media-library';

export default function AdminMediaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
        <p className="text-muted-foreground">
          Browse and manage uploaded images
        </p>
      </div>
      <MediaLibrary />
    </div>
  );
}
