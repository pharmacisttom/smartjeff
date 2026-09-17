ALTER TABLE `Attendance` ADD COLUMN `approvalStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING';
UPDATE `Attendance` SET `approvalStatus` = CASE WHEN `isApproved` = true THEN 'APPROVED' ELSE 'PENDING' END;
CREATE INDEX `Attendance_approvalStatus_timestamp_idx` ON `Attendance`(`approvalStatus`, `timestamp`);
