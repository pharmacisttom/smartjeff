-- Customer import foundation. Business formulas are intentionally not encoded here.
ALTER TABLE `Employee`
  ADD COLUMN `employmentStatus` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN `preferredLanguage` VARCHAR(191) NOT NULL DEFAULT 'th',
  ADD COLUMN `departmentId` VARCHAR(191) NULL;

ALTER TABLE `Site`
  ADD COLUMN `shortName` VARCHAR(191) NULL,
  ADD COLUMN `clientId` VARCHAR(191) NULL,
  ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE `ShiftTemplate`
  ADD COLUMN `siteId` VARCHAR(191) NULL,
  ADD COLUMN `positionType` VARCHAR(191) NULL,
  ADD COLUMN `otStartTime` VARCHAR(191) NULL,
  ADD COLUMN `otEndTime` VARCHAR(191) NULL,
  ADD COLUMN `crossMidnight` BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE `PayrollRun` ADD COLUMN `payrollPeriodId` VARCHAR(191) NULL;

CREATE TABLE `ImportJob` (
  `id` VARCHAR(191) NOT NULL,
  `fileName` VARCHAR(191) NOT NULL,
  `fileHash` VARCHAR(191) NOT NULL,
  `importType` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'UPLOADED',
  `uploadedById` VARCHAR(191) NOT NULL,
  `totalRows` INTEGER NOT NULL DEFAULT 0,
  `validRows` INTEGER NOT NULL DEFAULT 0,
  `invalidRows` INTEGER NOT NULL DEFAULT 0,
  `createdRows` INTEGER NOT NULL DEFAULT 0,
  `updatedRows` INTEGER NOT NULL DEFAULT 0,
  `skippedRows` INTEGER NOT NULL DEFAULT 0,
  `errorRows` INTEGER NOT NULL DEFAULT 0,
  `mapping` JSON NULL,
  `report` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `completedAt` DATETIME(3) NULL,
  UNIQUE INDEX `ImportJob_fileHash_importType_key`(`fileHash`, `importType`),
  INDEX `ImportJob_uploadedById_createdAt_idx`(`uploadedById`, `createdAt`),
  INDEX `ImportJob_status_createdAt_idx`(`status`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ClientContact` (
  `id` VARCHAR(191) NOT NULL,
  `clientId` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `position` VARCHAR(191) NULL,
  `email` VARCHAR(191) NULL,
  `phone` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `ClientContact_clientId_idx`(`clientId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `EmployeeDeployment` (
  `id` VARCHAR(191) NOT NULL,
  `employeeId` VARCHAR(191) NOT NULL,
  `siteId` VARCHAR(191) NOT NULL,
  `effectiveDate` DATETIME(3) NOT NULL,
  `position` VARCHAR(191) NOT NULL,
  `supervisorId` VARCHAR(191) NULL,
  `documentRefs` JSON NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
  `approvedById` VARCHAR(191) NULL,
  `approvedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `EmployeeDeployment_employeeId_siteId_effectiveDate_key`(`employeeId`, `siteId`, `effectiveDate`),
  INDEX `EmployeeDeployment_siteId_effectiveDate_idx`(`siteId`, `effectiveDate`),
  INDEX `EmployeeDeployment_status_effectiveDate_idx`(`status`, `effectiveDate`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PayrollPeriod` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `startDate` DATETIME(3) NOT NULL,
  `endDate` DATETIME(3) NOT NULL,
  `month` INTEGER NOT NULL,
  `year` INTEGER NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `PayrollPeriod_startDate_endDate_key`(`startDate`, `endDate`),
  INDEX `PayrollPeriod_year_month_idx`(`year`, `month`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PayrollComponent` (
  `id` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `type` VARCHAR(191) NOT NULL,
  `calculationType` VARCHAR(191) NOT NULL,
  `rate` DECIMAL(18,4) NULL,
  `multiplier` DECIMAL(10,4) NULL,
  `taxable` BOOLEAN NOT NULL DEFAULT false,
  `socialSecurityBase` BOOLEAN NOT NULL DEFAULT false,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `PayrollComponent_code_key`(`code`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PayrollPolicy` (
  `id` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
  `effectiveFrom` DATETIME(3) NULL,
  `effectiveTo` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `PayrollPolicy_code_key`(`code`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PayrollPolicyComponent` (
  `id` VARCHAR(191) NOT NULL,
  `policyId` VARCHAR(191) NOT NULL,
  `componentId` VARCHAR(191) NOT NULL,
  `config` JSON NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  UNIQUE INDEX `PayrollPolicyComponent_policyId_componentId_key`(`policyId`, `componentId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `SitePayrollPolicy` (
  `id` VARCHAR(191) NOT NULL,
  `siteId` VARCHAR(191) NOT NULL,
  `policyId` VARCHAR(191) NOT NULL,
  `startDate` DATETIME(3) NOT NULL,
  `endDate` DATETIME(3) NULL,
  UNIQUE INDEX `SitePayrollPolicy_siteId_policyId_startDate_key`(`siteId`, `policyId`, `startDate`),
  INDEX `SitePayrollPolicy_siteId_startDate_idx`(`siteId`, `startDate`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `Employee_departmentId_idx` ON `Employee`(`departmentId`);
CREATE INDEX `Site_clientId_idx` ON `Site`(`clientId`);
CREATE INDEX `ShiftTemplate_siteId_isActive_idx` ON `ShiftTemplate`(`siteId`, `isActive`);
CREATE INDEX `PayrollRun_payrollPeriodId_idx` ON `PayrollRun`(`payrollPeriodId`);

ALTER TABLE `Employee` ADD CONSTRAINT `Employee_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Site` ADD CONSTRAINT `Site_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `ShiftTemplate` ADD CONSTRAINT `ShiftTemplate_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `PayrollRun` ADD CONSTRAINT `PayrollRun_payrollPeriodId_fkey` FOREIGN KEY (`payrollPeriodId`) REFERENCES `PayrollPeriod`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `ClientContact` ADD CONSTRAINT `ClientContact_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `EmployeeDeployment` ADD CONSTRAINT `EmployeeDeployment_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `EmployeeDeployment` ADD CONSTRAINT `EmployeeDeployment_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `PayrollPolicyComponent` ADD CONSTRAINT `PayrollPolicyComponent_policyId_fkey` FOREIGN KEY (`policyId`) REFERENCES `PayrollPolicy`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `PayrollPolicyComponent` ADD CONSTRAINT `PayrollPolicyComponent_componentId_fkey` FOREIGN KEY (`componentId`) REFERENCES `PayrollComponent`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `SitePayrollPolicy` ADD CONSTRAINT `SitePayrollPolicy_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `SitePayrollPolicy` ADD CONSTRAINT `SitePayrollPolicy_policyId_fkey` FOREIGN KEY (`policyId`) REFERENCES `PayrollPolicy`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
