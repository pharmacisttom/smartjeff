-- One-time activation PINs are stored as hashes and expire after a short period.
ALTER TABLE `User`
  ADD COLUMN `activationPinHash` VARCHAR(191) NULL,
  ADD COLUMN `activationPinExpiresAt` DATETIME(3) NULL,
  ADD COLUMN `activationPinUsedAt` DATETIME(3) NULL,
  ADD COLUMN `activationPinAttempts` INTEGER NOT NULL DEFAULT 0;
