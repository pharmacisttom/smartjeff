export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  before?: any;
  after?: any;
  timestamp: string;
}

const auditLogs: AuditLogEntry[] = [];

export async function logAudit(params: {
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  before?: any;
  after?: any;
}) {
  const entry: AuditLogEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId: params.userId,
    action: params.action,
    entity: params.entity,
    entityId: params.entityId,
    before: params.before,
    after: params.after,
    timestamp: new Date().toISOString(),
  };

  auditLogs.unshift(entry);
  if (auditLogs.length > 500) auditLogs.pop();
  return entry;
}

export function getAuditLogs(): AuditLogEntry[] {
  return auditLogs;
}
