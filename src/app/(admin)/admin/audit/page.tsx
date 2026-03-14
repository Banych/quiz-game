import { AuditLogTable } from '@components/admin/audit-log-table';

export default function AdminAuditPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground">
          Quiz lifecycle events — quiz created, started, question advanced and
          locked
        </p>
      </div>
      <AuditLogTable />
    </div>
  );
}
