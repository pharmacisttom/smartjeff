-- SmartOP DEMO controlled recovery: sync_schema phase 1
-- REVIEW ONLY. Do not run against production.
-- Creates only structures owned by 20260927120000_sync_schema.

DELIMITER $$

DROP PROCEDURE IF EXISTS smartop_add_column_if_missing$$
DROP PROCEDURE IF EXISTS smartop_add_index_if_missing$$

CREATE PROCEDURE smartop_add_column_if_missing(
  IN p_table VARCHAR(64),
  IN p_column VARCHAR(64),
  IN p_ddl TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND BINARY TABLE_NAME = BINARY p_table
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Required phase-1 table is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND BINARY TABLE_NAME = BINARY p_table
      AND BINARY COLUMN_NAME = BINARY p_column
  ) THEN
    SET @smartop_ddl = p_ddl;
    PREPARE smartop_stmt FROM @smartop_ddl;
    EXECUTE smartop_stmt;
    DEALLOCATE PREPARE smartop_stmt;
  END IF;
END$$

CREATE PROCEDURE smartop_add_index_if_missing(
  IN p_table VARCHAR(64),
  IN p_index VARCHAR(128),
  IN p_ddl TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND BINARY TABLE_NAME = BINARY p_table
      AND BINARY INDEX_NAME = BINARY p_index
  ) THEN
    SET @smartop_ddl = p_ddl;
    PREPARE smartop_stmt FROM @smartop_ddl;
    EXECUTE smartop_stmt;
    DEALLOCATE PREPARE smartop_stmt;
  END IF;
END$$

DELIMITER ;

CREATE TABLE IF NOT EXISTS `Permission` (
  `id` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `module` VARCHAR(191) NOT NULL,
  `action` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `sensitivity` VARCHAR(191) NOT NULL DEFAULT 'NORMAL',
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `Permission_code_key`(`code`),
  INDEX `Permission_code_idx`(`code`),
  INDEX `Permission_module_idx`(`module`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `UserRoleAssignment` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `roleId` VARCHAR(191) NOT NULL,
  `scopeType` VARCHAR(191) NOT NULL DEFAULT 'GLOBAL',
  `scopeId` VARCHAR(191) NULL,
  `startAt` DATETIME(3) NULL,
  `endAt` DATETIME(3) NULL,
  `assignedBy` VARCHAR(191) NULL,
  `reason` TEXT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `UserRoleAssignment_userId_status_idx`(`userId`, `status`),
  INDEX `UserRoleAssignment_roleId_idx`(`roleId`),
  INDEX `UserRoleAssignment_scopeType_scopeId_idx`(`scopeType`, `scopeId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `UserSession` (
  `id` VARCHAR(191) NOT NULL,
  `sessionId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `tokenHash` VARCHAR(191) NULL,
  `deviceInfo` VARCHAR(191) NULL,
  `ipAddress` VARCHAR(191) NULL,
  `userAgent` TEXT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
  `authStrength` VARCHAR(191) NOT NULL DEFAULT 'PASSWORD',
  `authzVersion` INTEGER NOT NULL DEFAULT 1,
  `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expiresAt` DATETIME(3) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `UserSession_sessionId_key`(`sessionId`),
  INDEX `UserSession_userId_status_idx`(`userId`, `status`),
  INDEX `UserSession_sessionId_idx`(`sessionId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CALL smartop_add_column_if_missing('Payslip', 'coordAllow', 'ALTER TABLE `Payslip` ADD COLUMN `coordAllow` DECIMAL(18, 2) NULL DEFAULT 0');
CALL smartop_add_column_if_missing('Payslip', 'dailyAmount', 'ALTER TABLE `Payslip` ADD COLUMN `dailyAmount` DECIMAL(18, 2) NULL DEFAULT 0');
CALL smartop_add_column_if_missing('Payslip', 'dailyRate', 'ALTER TABLE `Payslip` ADD COLUMN `dailyRate` DECIMAL(18, 2) NULL DEFAULT 0');
CALL smartop_add_column_if_missing('Payslip', 'dishwashAllow', 'ALTER TABLE `Payslip` ADD COLUMN `dishwashAllow` DECIMAL(18, 2) NULL DEFAULT 0');
CALL smartop_add_column_if_missing('Payslip', 'grossIncome', 'ALTER TABLE `Payslip` ADD COLUMN `grossIncome` DECIMAL(18, 2) NULL DEFAULT 0');
CALL smartop_add_column_if_missing('Payslip', 'heatAllow', 'ALTER TABLE `Payslip` ADD COLUMN `heatAllow` DECIMAL(18, 2) NULL DEFAULT 0');
CALL smartop_add_column_if_missing('Payslip', 'holidayPay', 'ALTER TABLE `Payslip` ADD COLUMN `holidayPay` DECIMAL(18, 2) NULL DEFAULT 0');
CALL smartop_add_column_if_missing('Payslip', 'housingAllow', 'ALTER TABLE `Payslip` ADD COLUMN `housingAllow` DECIMAL(18, 2) NULL DEFAULT 0');
CALL smartop_add_column_if_missing('Payslip', 'incentive', 'ALTER TABLE `Payslip` ADD COLUMN `incentive` DECIMAL(18, 2) NULL DEFAULT 0');
CALL smartop_add_column_if_missing('Payslip', 'itemizedJson', 'ALTER TABLE `Payslip` ADD COLUMN `itemizedJson` VARCHAR(191) NULL');
CALL smartop_add_column_if_missing('Payslip', 'leavePay', 'ALTER TABLE `Payslip` ADD COLUMN `leavePay` DECIMAL(18, 2) NULL DEFAULT 0');
CALL smartop_add_column_if_missing('Payslip', 'mealAllow', 'ALTER TABLE `Payslip` ADD COLUMN `mealAllow` DECIMAL(18, 2) NULL DEFAULT 0');
CALL smartop_add_column_if_missing('Payslip', 'ot15Amount', 'ALTER TABLE `Payslip` ADD COLUMN `ot15Amount` DECIMAL(18, 2) NULL DEFAULT 0');
CALL smartop_add_column_if_missing('Payslip', 'ot15Hours', 'ALTER TABLE `Payslip` ADD COLUMN `ot15Hours` DOUBLE NULL DEFAULT 0');
CALL smartop_add_column_if_missing('Payslip', 'ot1Amount', 'ALTER TABLE `Payslip` ADD COLUMN `ot1Amount` DECIMAL(18, 2) NULL DEFAULT 0');
CALL smartop_add_column_if_missing('Payslip', 'ot1Hours', 'ALTER TABLE `Payslip` ADD COLUMN `ot1Hours` DOUBLE NULL DEFAULT 0');
CALL smartop_add_column_if_missing('Payslip', 'ot2Amount', 'ALTER TABLE `Payslip` ADD COLUMN `ot2Amount` DECIMAL(18, 2) NULL DEFAULT 0');
CALL smartop_add_column_if_missing('Payslip', 'ot2Hours', 'ALTER TABLE `Payslip` ADD COLUMN `ot2Hours` DOUBLE NULL DEFAULT 0');
CALL smartop_add_column_if_missing('Payslip', 'ot3Amount', 'ALTER TABLE `Payslip` ADD COLUMN `ot3Amount` DECIMAL(18, 2) NULL DEFAULT 0');
CALL smartop_add_column_if_missing('Payslip', 'ot3Hours', 'ALTER TABLE `Payslip` ADD COLUMN `ot3Hours` DOUBLE NULL DEFAULT 0');
CALL smartop_add_column_if_missing('Payslip', 'otMealAllow', 'ALTER TABLE `Payslip` ADD COLUMN `otMealAllow` DECIMAL(18, 2) NULL DEFAULT 0');
CALL smartop_add_column_if_missing('Payslip', 'phoneAllow', 'ALTER TABLE `Payslip` ADD COLUMN `phoneAllow` DECIMAL(18, 2) NULL DEFAULT 0');
CALL smartop_add_column_if_missing('Payslip', 'positionAllow', 'ALTER TABLE `Payslip` ADD COLUMN `positionAllow` DECIMAL(18, 2) NULL DEFAULT 0');
CALL smartop_add_column_if_missing('Payslip', 'shiftAllow', 'ALTER TABLE `Payslip` ADD COLUMN `shiftAllow` DECIMAL(18, 2) NULL DEFAULT 0');
CALL smartop_add_column_if_missing('Payslip', 'skillAllow', 'ALTER TABLE `Payslip` ADD COLUMN `skillAllow` DECIMAL(18, 2) NULL DEFAULT 0');
CALL smartop_add_column_if_missing('Payslip', 'totalDeduct', 'ALTER TABLE `Payslip` ADD COLUMN `totalDeduct` DECIMAL(18, 2) NULL DEFAULT 0');
CALL smartop_add_column_if_missing('Payslip', 'welfareDeduct', 'ALTER TABLE `Payslip` ADD COLUMN `welfareDeduct` DECIMAL(18, 2) NULL DEFAULT 0');
CALL smartop_add_column_if_missing('Payslip', 'workedDays', 'ALTER TABLE `Payslip` ADD COLUMN `workedDays` INTEGER NULL DEFAULT 0');

CALL smartop_add_column_if_missing('ShiftAssignment', 'homeSiteId', 'ALTER TABLE `ShiftAssignment` ADD COLUMN `homeSiteId` VARCHAR(191) NULL');
CALL smartop_add_column_if_missing('ShiftAssignment', 'isRelief', 'ALTER TABLE `ShiftAssignment` ADD COLUMN `isRelief` BOOLEAN NOT NULL DEFAULT false');
CALL smartop_add_column_if_missing('ShiftAssignment', 'otHours', 'ALTER TABLE `ShiftAssignment` ADD COLUMN `otHours` DOUBLE NOT NULL DEFAULT 0');
CALL smartop_add_column_if_missing('ShiftAssignment', 'shiftType', 'ALTER TABLE `ShiftAssignment` ADD COLUMN `shiftType` VARCHAR(191) NOT NULL DEFAULT ''DAY''');
CALL smartop_add_column_if_missing('ShiftAssignment', 'siteId', 'ALTER TABLE `ShiftAssignment` ADD COLUMN `siteId` VARCHAR(191) NULL');
CALL smartop_add_column_if_missing('ShiftAssignment', 'workHours', 'ALTER TABLE `ShiftAssignment` ADD COLUMN `workHours` DOUBLE NOT NULL DEFAULT 8');

CALL smartop_add_column_if_missing('Site', 'contactEmail', 'ALTER TABLE `Site` ADD COLUMN `contactEmail` VARCHAR(191) NULL');
CALL smartop_add_column_if_missing('Site', 'contactName', 'ALTER TABLE `Site` ADD COLUMN `contactName` VARCHAR(191) NULL');
CALL smartop_add_column_if_missing('Site', 'contactPhone', 'ALTER TABLE `Site` ADD COLUMN `contactPhone` VARCHAR(191) NULL');
CALL smartop_add_column_if_missing('Site', 'estateName', 'ALTER TABLE `Site` ADD COLUMN `estateName` VARCHAR(191) NULL');

CALL smartop_add_column_if_missing('User', 'assignedSiteCode', 'ALTER TABLE `User` ADD COLUMN `assignedSiteCode` VARCHAR(191) NULL');
CALL smartop_add_column_if_missing('User', 'authMethod', 'ALTER TABLE `User` ADD COLUMN `authMethod` VARCHAR(191) NOT NULL DEFAULT ''LOCAL''');
CALL smartop_add_column_if_missing('User', 'authzVersion', 'ALTER TABLE `User` ADD COLUMN `authzVersion` INTEGER NOT NULL DEFAULT 1');
CALL smartop_add_column_if_missing('User', 'lastPasswordReminderAt', 'ALTER TABLE `User` ADD COLUMN `lastPasswordReminderAt` DATETIME(3) NULL');
CALL smartop_add_column_if_missing('User', 'passwordChangedAt', 'ALTER TABLE `User` ADD COLUMN `passwordChangedAt` DATETIME(3) NULL');
CALL smartop_add_column_if_missing('User', 'passwordExpiresAt', 'ALTER TABLE `User` ADD COLUMN `passwordExpiresAt` DATETIME(3) NULL');
CALL smartop_add_column_if_missing('User', 'permissions', 'ALTER TABLE `User` ADD COLUMN `permissions` TEXT NULL');

CALL smartop_add_index_if_missing('ShiftAssignment', 'ShiftAssignment_siteId_date_idx', 'CREATE INDEX `ShiftAssignment_siteId_date_idx` ON `ShiftAssignment`(`siteId`, `date`)');

DROP PROCEDURE smartop_add_index_if_missing;
DROP PROCEDURE smartop_add_column_if_missing;
