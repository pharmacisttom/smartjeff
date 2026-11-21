-- AlterTable
ALTER TABLE `GoodsReceipt` ADD COLUMN `inventoryStatus` ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'POSTED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN `inventoryVersion` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `organizationId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `MaterialCategory` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `nameTh` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MaterialCategory_organizationId_code_key`(`organizationId`, `code`),
    UNIQUE INDEX `MaterialCategory_organizationId_id_key`(`organizationId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UnitOfMeasure` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `nameTh` VARCHAR(191) NOT NULL,
    `decimalPlaces` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `UnitOfMeasure_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Material` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `nameTh` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `baseUnitId` VARCHAR(191) NOT NULL,
    `reorderPoint` DECIMAL(18, 6) NOT NULL DEFAULT 0,
    `isStockItem` BOOLEAN NOT NULL DEFAULT true,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Material_code_key`(`code`),
    INDEX `Material_organizationId_categoryId_isActive_idx`(`organizationId`, `categoryId`, `isActive`),
    UNIQUE INDEX `Material_organizationId_id_key`(`organizationId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MaterialLegacyMapping` (
    `id` VARCHAR(191) NOT NULL,
    `materialId` VARCHAR(191) NOT NULL,
    `legacyItemId` VARCHAR(191) NOT NULL,
    `variantKey` VARCHAR(191) NOT NULL,
    `reason` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MaterialLegacyMapping_materialId_idx`(`materialId`),
    UNIQUE INDEX `MaterialLegacyMapping_legacyItemId_variantKey_key`(`legacyItemId`, `variantKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MaterialUnitConversion` (
    `id` VARCHAR(191) NOT NULL,
    `materialId` VARCHAR(191) NOT NULL,
    `fromUnitId` VARCHAR(191) NOT NULL,
    `toUnitId` VARCHAR(191) NOT NULL,
    `factor` DECIMAL(18, 6) NOT NULL,
    `effectiveFrom` DATETIME(3) NOT NULL,
    `effectiveTo` DATETIME(3) NULL,

    UNIQUE INDEX `MaterialUnitConversion_materialId_fromUnitId_toUnitId_effect_key`(`materialId`, `fromUnitId`, `toUnitId`, `effectiveFrom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MaterialPriceHistory` (
    `id` VARCHAR(191) NOT NULL,
    `materialId` VARCHAR(191) NOT NULL,
    `supplierId` VARCHAR(191) NULL,
    `currency` CHAR(3) NOT NULL DEFAULT 'THB',
    `unitPrice` DECIMAL(18, 6) NOT NULL,
    `taxRate` DECIMAL(10, 6) NOT NULL DEFAULT 0,
    `effectiveFrom` DATETIME(3) NOT NULL,
    `effectiveTo` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MaterialPriceHistory_materialId_effectiveFrom_idx`(`materialId`, `effectiveFrom`),
    INDEX `MaterialPriceHistory_supplierId_idx`(`supplierId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Warehouse` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `nameTh` VARCHAR(191) NOT NULL,
    `siteId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Warehouse_siteId_idx`(`siteId`),
    UNIQUE INDEX `Warehouse_organizationId_code_key`(`organizationId`, `code`),
    UNIQUE INDEX `Warehouse_organizationId_id_key`(`organizationId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WarehouseLocation` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `warehouseId` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `nameTh` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `WarehouseLocation_warehouseId_code_key`(`warehouseId`, `code`),
    UNIQUE INDEX `WarehouseLocation_organizationId_id_key`(`organizationId`, `id`),
    UNIQUE INDEX `WarehouseLocation_organizationId_warehouseId_id_key`(`organizationId`, `warehouseId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InventoryBalance` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `materialId` VARCHAR(191) NOT NULL,
    `locationId` VARCHAR(191) NOT NULL,
    `quantity` DECIMAL(18, 6) NOT NULL DEFAULT 0,
    `carryingValue` DECIMAL(24, 6) NOT NULL DEFAULT 0,
    `version` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `InventoryBalance_organizationId_locationId_idx`(`organizationId`, `locationId`),
    UNIQUE INDEX `InventoryBalance_materialId_locationId_key`(`materialId`, `locationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InventoryOperation` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `requestKey` VARCHAR(191) NOT NULL,
    `requestHash` CHAR(64) NOT NULL,
    `sourceType` VARCHAR(191) NOT NULL,
    `sourceId` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NOT NULL,
    `siteId` VARCHAR(191) NULL,
    `projectId` VARCHAR(191) NULL,
    `costCenterId` VARCHAR(191) NULL,
    `reason` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `clientContactId` VARCHAR(191) NULL,

    INDEX `InventoryOperation_sourceType_sourceId_idx`(`sourceType`, `sourceId`),
    INDEX `InventoryOperation_siteId_createdAt_idx`(`siteId`, `createdAt`),
    INDEX `InventoryOperation_projectId_createdAt_idx`(`projectId`, `createdAt`),
    INDEX `InventoryOperation_actorId_idx`(`actorId`),
    INDEX `InventoryOperation_costCenterId_idx`(`costCenterId`),
    UNIQUE INDEX `InventoryOperation_organizationId_requestKey_key`(`organizationId`, `requestKey`),
    UNIQUE INDEX `InventoryOperation_organizationId_id_key`(`organizationId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InventoryMovement` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `operationId` VARCHAR(191) NOT NULL,
    `lineKey` VARCHAR(191) NOT NULL,
    `materialId` VARCHAR(191) NOT NULL,
    `locationId` VARCHAR(191) NOT NULL,
    `type` ENUM('PURCHASE_RECEIPT', 'ISSUE', 'RETURN', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT', 'PROJECT_CONSUMPTION') NOT NULL,
    `quantityDelta` DECIMAL(18, 6) NOT NULL,
    `valueDelta` DECIMAL(24, 6) NOT NULL,
    `unitCostSnapshot` DECIMAL(18, 6) NOT NULL,
    `balanceAfter` DECIMAL(18, 6) NOT NULL,
    `valueAfter` DECIMAL(24, 6) NOT NULL,
    `balanceVersion` INTEGER NOT NULL,
    `requisitionLineId` VARCHAR(191) NULL,
    `receiptLineId` VARCHAR(191) NULL,
    `transferLineId` VARCHAR(191) NULL,
    `adjustmentLineId` VARCHAR(191) NULL,
    `returnOfId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `InventoryMovement_ledger_idx`(`organizationId`, `materialId`, `locationId`, `createdAt`, `id`),
    INDEX `InventoryMovement_requisitionLineId_idx`(`requisitionLineId`),
    INDEX `InventoryMovement_receiptLineId_idx`(`receiptLineId`),
    INDEX `InventoryMovement_transferLineId_idx`(`transferLineId`),
    INDEX `InventoryMovement_adjustmentLineId_idx`(`adjustmentLineId`),
    INDEX `InventoryMovement_returnOfId_idx`(`returnOfId`),
    UNIQUE INDEX `InventoryMovement_operationId_lineKey_key`(`operationId`, `lineKey`),
    UNIQUE INDEX `InventoryMovement_materialId_locationId_balanceVersion_key`(`materialId`, `locationId`, `balanceVersion`),
    UNIQUE INDEX `InventoryMovement_organizationId_materialId_id_key`(`organizationId`, `materialId`, `id`),
    UNIQUE INDEX `InventoryMovement_organizationId_id_key`(`organizationId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MaterialRequisition` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `refNo` VARCHAR(191) NOT NULL,
    `siteId` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NULL,
    `requestedDate` DATE NOT NULL,
    `periodStart` DATE NULL,
    `periodEnd` DATE NULL,
    `status` ENUM('DRAFT', 'SUBMITTED', 'REVIEW', 'APPROVED', 'PARTIALLY_ISSUED', 'ISSUED', 'RECEIVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `requestedById` VARCHAR(191) NOT NULL,
    `finalApprovedById` VARCHAR(191) NULL,
    `finalApprovedAt` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `version` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `MaterialRequisition_siteId_status_requestedDate_idx`(`siteId`, `status`, `requestedDate`),
    INDEX `MaterialRequisition_requestedById_idx`(`requestedById`),
    INDEX `MaterialRequisition_finalApprovedById_idx`(`finalApprovedById`),
    INDEX `MaterialRequisition_projectId_idx`(`projectId`),
    UNIQUE INDEX `MaterialRequisition_organizationId_refNo_key`(`organizationId`, `refNo`),
    UNIQUE INDEX `MaterialRequisition_organizationId_id_key`(`organizationId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MaterialRequisitionLine` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `requisitionId` VARCHAR(191) NOT NULL,
    `lineNo` INTEGER NOT NULL,
    `materialId` VARCHAR(191) NOT NULL,
    `unitId` VARCHAR(191) NOT NULL,
    `conversionFactor` DECIMAL(18, 6) NOT NULL DEFAULT 1,
    `requestedQty` DECIMAL(18, 6) NOT NULL,
    `approvedQty` DECIMAL(18, 6) NOT NULL DEFAULT 0,
    `issuedQty` DECIMAL(18, 6) NOT NULL DEFAULT 0,
    `receivedQty` DECIMAL(18, 6) NOT NULL DEFAULT 0,
    `notes` TEXT NULL,

    INDEX `MaterialRequisitionLine_unitId_idx`(`unitId`),
    UNIQUE INDEX `MaterialRequisitionLine_requisitionId_lineNo_key`(`requisitionId`, `lineNo`),
    UNIQUE INDEX `MaterialRequisitionLine_organizationId_materialId_id_key`(`organizationId`, `materialId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MaterialAcknowledgement` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `movementId` VARCHAR(191) NOT NULL,
    `requestKey` VARCHAR(191) NOT NULL,
    `quantity` DECIMAL(18, 6) NOT NULL,
    `receivedById` VARCHAR(191) NOT NULL,
    `receivedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notes` TEXT NULL,

    INDEX `MaterialAcknowledgement_movementId_idx`(`movementId`),
    INDEX `MaterialAcknowledgement_receivedById_idx`(`receivedById`),
    UNIQUE INDEX `MaterialAcknowledgement_organizationId_requestKey_key`(`organizationId`, `requestKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GoodsReceiptLine` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `receiptId` VARCHAR(191) NOT NULL,
    `lineNo` INTEGER NOT NULL,
    `poLineId` VARCHAR(191) NOT NULL,
    `materialId` VARCHAR(191) NOT NULL,
    `locationId` VARCHAR(191) NOT NULL,
    `acceptedQty` DECIMAL(18, 6) NOT NULL,
    `rejectedQty` DECIMAL(18, 6) NOT NULL DEFAULT 0,
    `unitCostSnapshot` DECIMAL(18, 6) NOT NULL,
    `currency` CHAR(3) NOT NULL DEFAULT 'THB',

    INDEX `GoodsReceiptLine_poLineId_idx`(`poLineId`),
    UNIQUE INDEX `GoodsReceiptLine_receiptId_lineNo_key`(`receiptId`, `lineNo`),
    UNIQUE INDEX `GoodsReceiptLine_scope_key`(`organizationId`, `materialId`, `locationId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StockTransfer` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `refNo` VARCHAR(191) NOT NULL,
    `fromWarehouseId` VARCHAR(191) NOT NULL,
    `toWarehouseId` VARCHAR(191) NOT NULL,
    `status` ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'POSTED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `createdById` VARCHAR(191) NOT NULL,
    `approvedById` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `postedAt` DATETIME(3) NULL,
    `reason` TEXT NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StockTransfer_createdById_idx`(`createdById`),
    INDEX `StockTransfer_approvedById_idx`(`approvedById`),
    INDEX `StockTransfer_organizationId_status_createdAt_idx`(`organizationId`, `status`, `createdAt`),
    UNIQUE INDEX `StockTransfer_organizationId_refNo_key`(`organizationId`, `refNo`),
    UNIQUE INDEX `StockTransfer_scope_key`(`organizationId`, `fromWarehouseId`, `toWarehouseId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StockTransferLine` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `transferId` VARCHAR(191) NOT NULL,
    `fromWarehouseId` VARCHAR(191) NOT NULL,
    `toWarehouseId` VARCHAR(191) NOT NULL,
    `lineNo` INTEGER NOT NULL,
    `materialId` VARCHAR(191) NOT NULL,
    `fromLocationId` VARCHAR(191) NOT NULL,
    `toLocationId` VARCHAR(191) NOT NULL,
    `quantity` DECIMAL(18, 6) NOT NULL,
    `unitCostSnapshot` DECIMAL(18, 6) NULL,

    UNIQUE INDEX `StockTransferLine_transferId_lineNo_key`(`transferId`, `lineNo`),
    UNIQUE INDEX `StockTransferLine_organizationId_materialId_id_key`(`organizationId`, `materialId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StockAdjustment` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `refNo` VARCHAR(191) NOT NULL,
    `warehouseId` VARCHAR(191) NOT NULL,
    `status` ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'POSTED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `reason` TEXT NOT NULL,
    `isOpening` BOOLEAN NOT NULL DEFAULT false,
    `createdById` VARCHAR(191) NOT NULL,
    `approvedById` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `postedAt` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StockAdjustment_createdById_idx`(`createdById`),
    INDEX `StockAdjustment_approvedById_idx`(`approvedById`),
    INDEX `StockAdjustment_organizationId_status_createdAt_idx`(`organizationId`, `status`, `createdAt`),
    UNIQUE INDEX `StockAdjustment_organizationId_refNo_key`(`organizationId`, `refNo`),
    UNIQUE INDEX `StockAdjustment_organizationId_warehouseId_id_key`(`organizationId`, `warehouseId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StockAdjustmentLine` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `adjustmentId` VARCHAR(191) NOT NULL,
    `warehouseId` VARCHAR(191) NOT NULL,
    `lineNo` INTEGER NOT NULL,
    `materialId` VARCHAR(191) NOT NULL,
    `locationId` VARCHAR(191) NOT NULL,
    `countedQty` DECIMAL(18, 6) NOT NULL,
    `expectedQtySnapshot` DECIMAL(18, 6) NOT NULL,
    `expectedBalanceVersion` INTEGER NOT NULL,
    `quantityDelta` DECIMAL(18, 6) NOT NULL,
    `valueDelta` DECIMAL(24, 6) NOT NULL,

    UNIQUE INDEX `StockAdjustmentLine_adjustmentId_lineNo_key`(`adjustmentId`, `lineNo`),
    UNIQUE INDEX `StockAdjustmentLine_item_key`(`adjustmentId`, `materialId`, `locationId`),
    UNIQUE INDEX `StockAdjustmentLine_scope_key`(`organizationId`, `materialId`, `locationId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `GoodsReceipt_organizationId_inventoryStatus_idx` ON `GoodsReceipt`(`organizationId`, `inventoryStatus`);

-- CreateIndex
CREATE UNIQUE INDEX `GoodsReceipt_organizationId_id_key` ON `GoodsReceipt`(`organizationId`, `id`);

-- AddForeignKey
ALTER TABLE `GoodsReceipt` ADD CONSTRAINT `GoodsReceipt_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaterialCategory` ADD CONSTRAINT `MaterialCategory_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Material` ADD CONSTRAINT `Material_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Material` ADD CONSTRAINT `Material_organizationId_categoryId_fkey` FOREIGN KEY (`organizationId`, `categoryId`) REFERENCES `MaterialCategory`(`organizationId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Material` ADD CONSTRAINT `Material_baseUnitId_fkey` FOREIGN KEY (`baseUnitId`) REFERENCES `UnitOfMeasure`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaterialLegacyMapping` ADD CONSTRAINT `MaterialLegacyMapping_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `Material`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaterialLegacyMapping` ADD CONSTRAINT `MaterialLegacyMapping_legacyItemId_fkey` FOREIGN KEY (`legacyItemId`) REFERENCES `InventoryItem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaterialUnitConversion` ADD CONSTRAINT `MaterialUnitConversion_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `Material`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaterialUnitConversion` ADD CONSTRAINT `MaterialUnitConversion_fromUnitId_fkey` FOREIGN KEY (`fromUnitId`) REFERENCES `UnitOfMeasure`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaterialUnitConversion` ADD CONSTRAINT `MaterialUnitConversion_toUnitId_fkey` FOREIGN KEY (`toUnitId`) REFERENCES `UnitOfMeasure`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaterialPriceHistory` ADD CONSTRAINT `MaterialPriceHistory_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `Material`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaterialPriceHistory` ADD CONSTRAINT `MaterialPriceHistory_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `Supplier`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Warehouse` ADD CONSTRAINT `Warehouse_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Warehouse` ADD CONSTRAINT `Warehouse_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WarehouseLocation` ADD CONSTRAINT `WarehouseLocation_organizationId_warehouseId_fkey` FOREIGN KEY (`organizationId`, `warehouseId`) REFERENCES `Warehouse`(`organizationId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryBalance` ADD CONSTRAINT `InventoryBalance_organizationId_materialId_fkey` FOREIGN KEY (`organizationId`, `materialId`) REFERENCES `Material`(`organizationId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryBalance` ADD CONSTRAINT `InventoryBalance_organizationId_locationId_fkey` FOREIGN KEY (`organizationId`, `locationId`) REFERENCES `WarehouseLocation`(`organizationId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryOperation` ADD CONSTRAINT `InventoryOperation_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryOperation` ADD CONSTRAINT `InventoryOperation_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryOperation` ADD CONSTRAINT `InventoryOperation_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryOperation` ADD CONSTRAINT `InventoryOperation_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryOperation` ADD CONSTRAINT `InventoryOperation_costCenterId_fkey` FOREIGN KEY (`costCenterId`) REFERENCES `CostCenter`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryOperation` ADD CONSTRAINT `InventoryOperation_clientContactId_fkey` FOREIGN KEY (`clientContactId`) REFERENCES `ClientContact`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryMovement` ADD CONSTRAINT `InventoryMovement_organizationId_operationId_fkey` FOREIGN KEY (`organizationId`, `operationId`) REFERENCES `InventoryOperation`(`organizationId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryMovement` ADD CONSTRAINT `InventoryMovement_organizationId_materialId_fkey` FOREIGN KEY (`organizationId`, `materialId`) REFERENCES `Material`(`organizationId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryMovement` ADD CONSTRAINT `InventoryMovement_organizationId_locationId_fkey` FOREIGN KEY (`organizationId`, `locationId`) REFERENCES `WarehouseLocation`(`organizationId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryMovement` ADD CONSTRAINT `InventoryMovement_organizationId_materialId_requisitionLine_fkey` FOREIGN KEY (`organizationId`, `materialId`, `requisitionLineId`) REFERENCES `MaterialRequisitionLine`(`organizationId`, `materialId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryMovement` ADD CONSTRAINT `InventoryMovement_organizationId_materialId_locationId_rece_fkey` FOREIGN KEY (`organizationId`, `materialId`, `locationId`, `receiptLineId`) REFERENCES `GoodsReceiptLine`(`organizationId`, `materialId`, `locationId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryMovement` ADD CONSTRAINT `InventoryMovement_organizationId_materialId_transferLineId_fkey` FOREIGN KEY (`organizationId`, `materialId`, `transferLineId`) REFERENCES `StockTransferLine`(`organizationId`, `materialId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryMovement` ADD CONSTRAINT `InventoryMovement_organizationId_materialId_locationId_adju_fkey` FOREIGN KEY (`organizationId`, `materialId`, `locationId`, `adjustmentLineId`) REFERENCES `StockAdjustmentLine`(`organizationId`, `materialId`, `locationId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryMovement` ADD CONSTRAINT `InventoryMovement_organizationId_materialId_returnOfId_fkey` FOREIGN KEY (`organizationId`, `materialId`, `returnOfId`) REFERENCES `InventoryMovement`(`organizationId`, `materialId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaterialRequisition` ADD CONSTRAINT `MaterialRequisition_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaterialRequisition` ADD CONSTRAINT `MaterialRequisition_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaterialRequisition` ADD CONSTRAINT `MaterialRequisition_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaterialRequisition` ADD CONSTRAINT `MaterialRequisition_requestedById_fkey` FOREIGN KEY (`requestedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaterialRequisition` ADD CONSTRAINT `MaterialRequisition_finalApprovedById_fkey` FOREIGN KEY (`finalApprovedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaterialRequisitionLine` ADD CONSTRAINT `MaterialRequisitionLine_organizationId_requisitionId_fkey` FOREIGN KEY (`organizationId`, `requisitionId`) REFERENCES `MaterialRequisition`(`organizationId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaterialRequisitionLine` ADD CONSTRAINT `MaterialRequisitionLine_organizationId_materialId_fkey` FOREIGN KEY (`organizationId`, `materialId`) REFERENCES `Material`(`organizationId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaterialRequisitionLine` ADD CONSTRAINT `MaterialRequisitionLine_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `UnitOfMeasure`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaterialAcknowledgement` ADD CONSTRAINT `MaterialAcknowledgement_organizationId_movementId_fkey` FOREIGN KEY (`organizationId`, `movementId`) REFERENCES `InventoryMovement`(`organizationId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaterialAcknowledgement` ADD CONSTRAINT `MaterialAcknowledgement_receivedById_fkey` FOREIGN KEY (`receivedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GoodsReceiptLine` ADD CONSTRAINT `GoodsReceiptLine_organizationId_receiptId_fkey` FOREIGN KEY (`organizationId`, `receiptId`) REFERENCES `GoodsReceipt`(`organizationId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GoodsReceiptLine` ADD CONSTRAINT `GoodsReceiptLine_poLineId_fkey` FOREIGN KEY (`poLineId`) REFERENCES `POItem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GoodsReceiptLine` ADD CONSTRAINT `GoodsReceiptLine_organizationId_materialId_fkey` FOREIGN KEY (`organizationId`, `materialId`) REFERENCES `Material`(`organizationId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GoodsReceiptLine` ADD CONSTRAINT `GoodsReceiptLine_organizationId_locationId_fkey` FOREIGN KEY (`organizationId`, `locationId`) REFERENCES `WarehouseLocation`(`organizationId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockTransfer` ADD CONSTRAINT `StockTransfer_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockTransfer` ADD CONSTRAINT `StockTransfer_organizationId_fromWarehouseId_fkey` FOREIGN KEY (`organizationId`, `fromWarehouseId`) REFERENCES `Warehouse`(`organizationId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockTransfer` ADD CONSTRAINT `StockTransfer_organizationId_toWarehouseId_fkey` FOREIGN KEY (`organizationId`, `toWarehouseId`) REFERENCES `Warehouse`(`organizationId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockTransfer` ADD CONSTRAINT `StockTransfer_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockTransfer` ADD CONSTRAINT `StockTransfer_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockTransferLine` ADD CONSTRAINT `StockTransferLine_organizationId_fromWarehouseId_toWarehous_fkey` FOREIGN KEY (`organizationId`, `fromWarehouseId`, `toWarehouseId`, `transferId`) REFERENCES `StockTransfer`(`organizationId`, `fromWarehouseId`, `toWarehouseId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockTransferLine` ADD CONSTRAINT `StockTransferLine_organizationId_materialId_fkey` FOREIGN KEY (`organizationId`, `materialId`) REFERENCES `Material`(`organizationId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockTransferLine` ADD CONSTRAINT `StockTransferLine_organizationId_fromWarehouseId_fromLocati_fkey` FOREIGN KEY (`organizationId`, `fromWarehouseId`, `fromLocationId`) REFERENCES `WarehouseLocation`(`organizationId`, `warehouseId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockTransferLine` ADD CONSTRAINT `StockTransferLine_organizationId_toWarehouseId_toLocationId_fkey` FOREIGN KEY (`organizationId`, `toWarehouseId`, `toLocationId`) REFERENCES `WarehouseLocation`(`organizationId`, `warehouseId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockAdjustment` ADD CONSTRAINT `StockAdjustment_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockAdjustment` ADD CONSTRAINT `StockAdjustment_organizationId_warehouseId_fkey` FOREIGN KEY (`organizationId`, `warehouseId`) REFERENCES `Warehouse`(`organizationId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockAdjustment` ADD CONSTRAINT `StockAdjustment_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockAdjustment` ADD CONSTRAINT `StockAdjustment_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockAdjustmentLine` ADD CONSTRAINT `StockAdjustmentLine_organizationId_warehouseId_adjustmentId_fkey` FOREIGN KEY (`organizationId`, `warehouseId`, `adjustmentId`) REFERENCES `StockAdjustment`(`organizationId`, `warehouseId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockAdjustmentLine` ADD CONSTRAINT `StockAdjustmentLine_organizationId_materialId_fkey` FOREIGN KEY (`organizationId`, `materialId`) REFERENCES `Material`(`organizationId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockAdjustmentLine` ADD CONSTRAINT `StockAdjustmentLine_organizationId_warehouseId_locationId_fkey` FOREIGN KEY (`organizationId`, `warehouseId`, `locationId`) REFERENCES `WarehouseLocation`(`organizationId`, `warehouseId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- P3 constraints and append-only guards (not represented by Prisma schema).
-- Source for the additional P3 CHECK constraints in the migration.
-- Do not run this file against an existing database independently of migrations.
ALTER TABLE `UnitOfMeasure` ADD CONSTRAINT `uom_decimal_places_check` CHECK (`decimalPlaces` BETWEEN 0 AND 6);
ALTER TABLE `Material` ADD CONSTRAINT `material_reorder_check` CHECK (`reorderPoint` >= 0);
ALTER TABLE `MaterialUnitConversion` ADD CONSTRAINT `material_conversion_check` CHECK (`factor` > 0 AND `fromUnitId` <> `toUnitId` AND (`effectiveTo` IS NULL OR `effectiveTo` > `effectiveFrom`));
ALTER TABLE `MaterialPriceHistory` ADD CONSTRAINT `material_price_check` CHECK (`unitPrice` >= 0 AND `taxRate` >= 0 AND `taxRate` <= 1 AND (`effectiveTo` IS NULL OR `effectiveTo` > `effectiveFrom`));
ALTER TABLE `InventoryBalance` ADD CONSTRAINT `inventory_balance_check` CHECK (`quantity` >= 0 AND `carryingValue` >= 0 AND `version` >= 0 AND (`quantity` <> 0 OR `carryingValue` = 0));
ALTER TABLE `MaterialRequisition` ADD CONSTRAINT `material_requisition_sod_check` CHECK (`finalApprovedById` IS NULL OR `finalApprovedById` <> `requestedById`);
ALTER TABLE `MaterialRequisition` ADD CONSTRAINT `material_requisition_state_check` CHECK (
  `version` >= 0 AND
  ((`periodStart` IS NULL AND `periodEnd` IS NULL) OR (`periodStart` IS NOT NULL AND `periodEnd` IS NOT NULL AND `periodEnd` >= `periodStart`)) AND
  (`status` NOT IN ('APPROVED', 'PARTIALLY_ISSUED', 'ISSUED', 'RECEIVED') OR (`finalApprovedById` IS NOT NULL AND `finalApprovedAt` IS NOT NULL))
);
ALTER TABLE `MaterialRequisitionLine` ADD CONSTRAINT `material_requisition_quantities_check` CHECK (
  `lineNo` > 0 AND `conversionFactor` > 0 AND `requestedQty` > 0 AND
  `approvedQty` >= 0 AND `approvedQty` <= `requestedQty` AND
  `issuedQty` >= 0 AND `issuedQty` <= `approvedQty` AND
  `receivedQty` >= 0 AND `receivedQty` <= `issuedQty`
);
ALTER TABLE `MaterialAcknowledgement` ADD CONSTRAINT `material_ack_quantity_check` CHECK (`quantity` > 0);
ALTER TABLE `GoodsReceipt` ADD CONSTRAINT `material_receipt_scope_check` CHECK (`inventoryVersion` >= 0 AND (`inventoryStatus` = 'DRAFT' OR `organizationId` IS NOT NULL));
ALTER TABLE `GoodsReceiptLine` ADD CONSTRAINT `material_receipt_quantities_check` CHECK (`lineNo` > 0 AND `acceptedQty` >= 0 AND `rejectedQty` >= 0 AND (`acceptedQty` + `rejectedQty`) > 0 AND `unitCostSnapshot` >= 0);
ALTER TABLE `StockTransfer` ADD CONSTRAINT `stock_transfer_state_check` CHECK (
  `version` >= 0 AND `fromWarehouseId` <> `toWarehouseId` AND
  (`approvedById` IS NULL OR `createdById` <> `approvedById`) AND
  (`status` NOT IN ('APPROVED', 'POSTED') OR (`approvedById` IS NOT NULL AND `approvedAt` IS NOT NULL)) AND
  (`status` <> 'POSTED' OR `postedAt` IS NOT NULL)
);
ALTER TABLE `StockTransferLine` ADD CONSTRAINT `stock_transfer_quantity_check` CHECK (`lineNo` > 0 AND `quantity` > 0 AND (`unitCostSnapshot` IS NULL OR `unitCostSnapshot` >= 0));
ALTER TABLE `StockAdjustment` ADD CONSTRAINT `stock_adjustment_state_check` CHECK (
  `version` >= 0 AND (`approvedById` IS NULL OR `createdById` <> `approvedById`) AND
  (`status` NOT IN ('APPROVED', 'POSTED') OR (`approvedById` IS NOT NULL AND `approvedAt` IS NOT NULL)) AND
  (`status` <> 'POSTED' OR `postedAt` IS NOT NULL)
);
ALTER TABLE `StockAdjustmentLine` ADD CONSTRAINT `stock_adjustment_quantities_check` CHECK (
  `lineNo` > 0 AND `countedQty` >= 0 AND `expectedQtySnapshot` >= 0 AND `expectedBalanceVersion` >= 0 AND
  `quantityDelta` = `countedQty` - `expectedQtySnapshot`
);
ALTER TABLE `InventoryMovement` ADD CONSTRAINT `inventory_movement_values_check` CHECK (
  (`quantityDelta` <> 0 OR `valueDelta` <> 0) AND `unitCostSnapshot` >= 0 AND
  `balanceAfter` >= 0 AND `valueAfter` >= 0 AND `balanceVersion` > 0 AND
  (`balanceAfter` <> 0 OR `valueAfter` = 0) AND
  (`returnOfId` IS NULL OR `returnOfId` <> `id`) AND
  (`type` NOT IN ('PURCHASE_RECEIPT', 'RETURN', 'TRANSFER_IN') OR (`quantityDelta` > 0 AND `valueDelta` >= 0)) AND
  (`type` NOT IN ('ISSUE', 'TRANSFER_OUT', 'PROJECT_CONSUMPTION') OR (`quantityDelta` < 0 AND `valueDelta` <= 0))
);
ALTER TABLE `InventoryMovement` ADD CONSTRAINT `inventory_movement_source_check` CHECK (
  (`type` = 'PURCHASE_RECEIPT' AND `receiptLineId` IS NOT NULL AND `requisitionLineId` IS NULL AND `transferLineId` IS NULL AND `adjustmentLineId` IS NULL AND `returnOfId` IS NULL) OR
  (`type` IN ('ISSUE', 'PROJECT_CONSUMPTION') AND `requisitionLineId` IS NOT NULL AND `receiptLineId` IS NULL AND `transferLineId` IS NULL AND `adjustmentLineId` IS NULL AND `returnOfId` IS NULL) OR
  (`type` = 'RETURN' AND `returnOfId` IS NOT NULL AND `requisitionLineId` IS NULL AND `receiptLineId` IS NULL AND `transferLineId` IS NULL AND `adjustmentLineId` IS NULL) OR
  (`type` IN ('TRANSFER_IN', 'TRANSFER_OUT') AND `transferLineId` IS NOT NULL AND `receiptLineId` IS NULL AND `requisitionLineId` IS NULL AND `adjustmentLineId` IS NULL AND `returnOfId` IS NULL) OR
  (`type` = 'ADJUSTMENT' AND `adjustmentLineId` IS NOT NULL AND `receiptLineId` IS NULL AND `requisitionLineId` IS NULL AND `transferLineId` IS NULL AND `returnOfId` IS NULL)
);

-- Append-only evidence; reversals are new movements, not edits/deletes.
CREATE TRIGGER `p3_movement_no_update` BEFORE UPDATE ON `InventoryMovement` FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'InventoryMovement is append-only';
CREATE TRIGGER `p3_movement_no_delete` BEFORE DELETE ON `InventoryMovement` FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'InventoryMovement is append-only';
CREATE TRIGGER `p3_operation_no_update` BEFORE UPDATE ON `InventoryOperation` FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'InventoryOperation is append-only';
CREATE TRIGGER `p3_operation_no_delete` BEFORE DELETE ON `InventoryOperation` FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'InventoryOperation is append-only';
