-- Widen existing metadata columns for atomic inventory posting evidence.
-- No values are deleted or rewritten; the previous app remains compatible.
ALTER TABLE `AuditLog` MODIFY `metadata` TEXT NULL;
ALTER TABLE `EventOutbox` MODIFY `payload` TEXT NOT NULL;
