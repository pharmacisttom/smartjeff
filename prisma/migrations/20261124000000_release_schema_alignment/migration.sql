-- Complete the migration chain without changing authentication behavior or dropping data.
-- The schema has mapped these four models to lowercase names since the RBAC bridge.
-- Windows lower_case_table_names=1 already stores them that way; Linux case-sensitive
-- servers still have the original uppercase names from the sync-schema migration.
SET @smartop_case_sql = IF(
  @@lower_case_table_names = 0,
  'RENAME TABLE `Role` TO `role`, `RolePermission` TO `rolepermission`, `ApprovalAuthority` TO `approvalauthority`, `AccessRequest` TO `accessrequest`',
  'DO 0'
);
PREPARE smartop_case_stmt FROM @smartop_case_sql;
EXECUTE smartop_case_stmt;
DEALLOCATE PREPARE smartop_case_stmt;

-- The model was present in application code but missing from the historical chain.
-- Existing reviewed baselines may already contain it. The post-migration schema gate
-- must reject an existing table with incompatible columns, indexes or foreign keys.
CREATE TABLE IF NOT EXISTS `PasswordHistory` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `passwordHash` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `PasswordHistory_userId_createdAt_idx` (`userId`, `createdAt`),
  PRIMARY KEY (`id`),
  CONSTRAINT `PasswordHistory_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
