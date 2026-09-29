CREATE TABLE `DemoAccount` (
  `id` VARCHAR(191) NOT NULL,
  `demoRole` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `isEnabled` BOOLEAN NOT NULL DEFAULT true,
  `label` VARCHAR(191) NULL,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `updatedBy` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `DemoAccount_demoRole_key`(`demoRole`),
  INDEX `DemoAccount_userId_idx`(`userId`),
  INDEX `DemoAccount_updatedBy_idx`(`updatedBy`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `DemoAccount` ADD CONSTRAINT `DemoAccount_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `DemoAccount` ADD CONSTRAINT `DemoAccount_updatedBy_fkey`
  FOREIGN KEY (`updatedBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
