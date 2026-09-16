export interface SyncRecordPayload {
  localId: string;
  employeeId: string;
  photoHash?: string;
  timestamp: number;
  type: string;
}

export type ConflictResolutionAction = "CREATE" | "SKIP_DUPLICATE" | "UPDATE_EXISTING";

/**
 * Resolve potential conflicts or duplicate check-in submissions
 */
export function resolveAttendanceConflict(
  incoming: SyncRecordPayload,
  existingRecords: Array<{ localId?: string | null; photoHash?: string | null; timestamp: Date | number; type: string }>
): { action: ConflictResolutionAction; matchedRecord?: any } {
  // 1. Check Exact LocalId or PhotoHash duplicate (Idempotency)
  const exactMatch = existingRecords.find(
    (rec) =>
      (incoming.localId && rec.localId === incoming.localId) ||
      (incoming.photoHash && rec.photoHash && rec.photoHash === incoming.photoHash)
  );

  if (exactMatch) {
    return { action: "SKIP_DUPLICATE", matchedRecord: exactMatch };
  }

  // 2. Check if a record with same type exists within 60 seconds (Last-Write-Wins update window)
  const incomingTime = new Date(incoming.timestamp).getTime();
  const timeWindowMatch = existingRecords.find((rec) => {
    const recTime = new Date(rec.timestamp).getTime();
    return rec.type === incoming.type && Math.abs(incomingTime - recTime) < 60000;
  });

  if (timeWindowMatch) {
    return { action: "UPDATE_EXISTING", matchedRecord: timeWindowMatch };
  }

  // 3. Otherwise create new record
  return { action: "CREATE" };
}
