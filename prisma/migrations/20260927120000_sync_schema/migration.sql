-- AlterTable
ALTER TABLE `Payslip` ADD COLUMN `coordAllow` DECIMAL(18, 2) NULL DEFAULT 0,
    ADD COLUMN `dailyAmount` DECIMAL(18, 2) NULL DEFAULT 0,
    ADD COLUMN `dailyRate` DECIMAL(18, 2) NULL DEFAULT 0,
    ADD COLUMN `dishwashAllow` DECIMAL(18, 2) NULL DEFAULT 0,
    ADD COLUMN `grossIncome` DECIMAL(18, 2) NULL DEFAULT 0,
    ADD COLUMN `heatAllow` DECIMAL(18, 2) NULL DEFAULT 0,
    ADD COLUMN `holidayPay` DECIMAL(18, 2) NULL DEFAULT 0,
    ADD COLUMN `housingAllow` DECIMAL(18, 2) NULL DEFAULT 0,
    ADD COLUMN `incentive` DECIMAL(18, 2) NULL DEFAULT 0,
    ADD COLUMN `itemizedJson` VARCHAR(191) NULL,
    ADD COLUMN `leavePay` DECIMAL(18, 2) NULL DEFAULT 0,
    ADD COLUMN `mealAllow` DECIMAL(18, 2) NULL DEFAULT 0,
    ADD COLUMN `ot15Amount` DECIMAL(18, 2) NULL DEFAULT 0,
    ADD COLUMN `ot15Hours` DOUBLE NULL DEFAULT 0,
    ADD COLUMN `ot1Amount` DECIMAL(18, 2) NULL DEFAULT 0,
    ADD COLUMN `ot1Hours` DOUBLE NULL DEFAULT 0,
    ADD COLUMN `ot2Amount` DECIMAL(18, 2) NULL DEFAULT 0,
    ADD COLUMN `ot2Hours` DOUBLE NULL DEFAULT 0,
    ADD COLUMN `ot3Amount` DECIMAL(18, 2) NULL DEFAULT 0,
    ADD COLUMN `ot3Hours` DOUBLE NULL DEFAULT 0,
    ADD COLUMN `otMealAllow` DECIMAL(18, 2) NULL DEFAULT 0,
    ADD COLUMN `phoneAllow` DECIMAL(18, 2) NULL DEFAULT 0,
    ADD COLUMN `positionAllow` DECIMAL(18, 2) NULL DEFAULT 0,
    ADD COLUMN `shiftAllow` DECIMAL(18, 2) NULL DEFAULT 0,
    ADD COLUMN `skillAllow` DECIMAL(18, 2) NULL DEFAULT 0,
    ADD COLUMN `totalDeduct` DECIMAL(18, 2) NULL DEFAULT 0,
    ADD COLUMN `welfareDeduct` DECIMAL(18, 2) NULL DEFAULT 0,
    ADD COLUMN `workedDays` INTEGER NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `ShiftAssignment` ADD COLUMN `homeSiteId` VARCHAR(191) NULL,
    ADD COLUMN `isRelief` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `otHours` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `shiftType` VARCHAR(191) NOT NULL DEFAULT 'DAY',
    ADD COLUMN `siteId` VARCHAR(191) NULL,
    ADD COLUMN `workHours` DOUBLE NOT NULL DEFAULT 8;

-- AlterTable
ALTER TABLE `Site` ADD COLUMN `contactEmail` VARCHAR(191) NULL,
    ADD COLUMN `contactName` VARCHAR(191) NULL,
    ADD COLUMN `contactPhone` VARCHAR(191) NULL,
    ADD COLUMN `estateName` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `assignedSiteCode` VARCHAR(191) NULL,
    ADD COLUMN `authMethod` VARCHAR(191) NOT NULL DEFAULT 'LOCAL',
    ADD COLUMN `authzVersion` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `lastPasswordReminderAt` DATETIME(3) NULL,
    ADD COLUMN `password` VARCHAR(191) NULL,
    ADD COLUMN `passwordChangedAt` DATETIME(3) NULL,
    ADD COLUMN `passwordExpiresAt` DATETIME(3) NULL,
    ADD COLUMN `permissions` TEXT NULL;

-- CreateTable
CREATE TABLE `Role` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `nameTh` VARCHAR(191) NOT NULL,
    `nameEn` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `level` INTEGER NOT NULL DEFAULT 1,
    `departmentType` VARCHAR(191) NULL,
    `isSystem` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Role_code_key`(`code`),
    INDEX `Role_code_idx`(`code`),
    INDEX `Role_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Permission` (
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

-- CreateTable
CREATE TABLE `RolePermission` (
    `id` VARCHAR(191) NOT NULL,
    `roleId` VARCHAR(191) NOT NULL,
    `permissionId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RolePermission_roleId_idx`(`roleId`),
    INDEX `RolePermission_permissionId_idx`(`permissionId`),
    UNIQUE INDEX `RolePermission_roleId_permissionId_key`(`roleId`, `permissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserRoleAssignment` (
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

-- CreateTable
CREATE TABLE `ApprovalAuthority` (
    `id` VARCHAR(191) NOT NULL,
    `roleId` VARCHAR(191) NOT NULL,
    `module` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `level` VARCHAR(191) NOT NULL,
    `minAmount` DECIMAL(18, 2) NULL DEFAULT 0,
    `maxAmount` DECIMAL(18, 2) NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ApprovalAuthority_roleId_module_idx`(`roleId`, `module`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserSession` (
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

-- CreateTable
CREATE TABLE `AccessRequest` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `targetRoleId` VARCHAR(191) NULL,
    `permissionCode` VARCHAR(191) NULL,
    `scopeType` VARCHAR(191) NULL,
    `scopeId` VARCHAR(191) NULL,
    `reason` TEXT NOT NULL,
    `durationDays` INTEGER NULL DEFAULT 30,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `reviewedBy` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `reviewNote` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AccessRequest_userId_status_idx`(`userId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `ShiftAssignment_siteId_date_idx` ON `ShiftAssignment`(`siteId`, `date`);

-- AddForeignKey
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `Permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserRoleAssignment` ADD CONSTRAINT `UserRoleAssignment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserRoleAssignment` ADD CONSTRAINT `UserRoleAssignment_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ApprovalAuthority` ADD CONSTRAINT `ApprovalAuthority_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserSession` ADD CONSTRAINT `UserSession_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AccessRequest` ADD CONSTRAINT `AccessRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ShiftAssignment` ADD CONSTRAINT `ShiftAssignment_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
