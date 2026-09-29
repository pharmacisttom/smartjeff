-- SmartOP DEMO controlled recovery: sync_schema phase 2
-- REVIEW ONLY. Run only after successful RBAC reconciliation.
-- Every missing foreign key is preceded by an orphan check.

DELIMITER $$

DROP PROCEDURE IF EXISTS smartop_add_fk_if_safe$$
DROP PROCEDURE IF EXISTS smartop_add_permission_fk_if_safe$$

CREATE PROCEDURE smartop_add_fk_if_safe(
  IN p_child_table VARCHAR(64),
  IN p_child_column VARCHAR(64),
  IN p_parent_table VARCHAR(64),
  IN p_parent_column VARCHAR(64),
  IN p_constraint VARCHAR(128),
  IN p_ddl TEXT
)
BEGIN
  DECLARE v_semantic_fk_count INTEGER DEFAULT 0;
  DECLARE v_column_fk_count INTEGER DEFAULT 0;

  SELECT COUNT(*) INTO v_semantic_fk_count
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND BINARY TABLE_NAME = BINARY p_child_table
    AND BINARY COLUMN_NAME = BINARY p_child_column
    AND BINARY REFERENCED_TABLE_NAME = BINARY p_parent_table
    AND BINARY REFERENCED_COLUMN_NAME = BINARY p_parent_column;

  SELECT COUNT(*) INTO v_column_fk_count
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND BINARY TABLE_NAME = BINARY p_child_table
    AND BINARY COLUMN_NAME = BINARY p_child_column
    AND REFERENCED_TABLE_NAME IS NOT NULL;

  IF v_semantic_fk_count > 1 OR v_column_fk_count > 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unexpected multiple foreign keys on required column';
  ELSEIF v_semantic_fk_count = 1 THEN
    SELECT CONCAT('Foreign key already valid: ', p_child_table, '.', p_child_column) AS phase2_status;
  ELSEIF v_column_fk_count = 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Conflicting foreign key exists on required column';
  ELSE
    SET @smartop_orphan_count = 0;
    SET @smartop_orphan_sql = CONCAT(
      'SELECT COUNT(*) INTO @smartop_orphan_count FROM `', p_child_table,
      '` child_row LEFT JOIN `', p_parent_table,
      '` parent_row ON parent_row.`', p_parent_column,
      '` = child_row.`', p_child_column,
      '` WHERE child_row.`', p_child_column,
      '` IS NOT NULL AND parent_row.`', p_parent_column, '` IS NULL'
    );
    PREPARE smartop_orphan_stmt FROM @smartop_orphan_sql;
    EXECUTE smartop_orphan_stmt;
    DEALLOCATE PREPARE smartop_orphan_stmt;

    IF @smartop_orphan_count > 0 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Foreign key blocked by orphan rows';
    END IF;

    SET @smartop_ddl = p_ddl;
    PREPARE smartop_fk_stmt FROM @smartop_ddl;
    EXECUTE smartop_fk_stmt;
    DEALLOCATE PREPARE smartop_fk_stmt;
  END IF;
END$$

CREATE PROCEDURE smartop_add_permission_fk_if_safe()
BEGIN
  DECLARE v_semantic_fk_count INTEGER DEFAULT 0;
  DECLARE v_column_fk_count INTEGER DEFAULT 0;
  DECLARE v_legacy_fk_count INTEGER DEFAULT 0;

  SELECT COUNT(*) INTO v_semantic_fk_count
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND BINARY TABLE_NAME = BINARY 'rolepermission'
    AND BINARY COLUMN_NAME = BINARY 'permissionId'
    AND BINARY REFERENCED_TABLE_NAME = BINARY 'Permission'
    AND BINARY REFERENCED_COLUMN_NAME = BINARY 'id';

  SELECT COUNT(*) INTO v_column_fk_count
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND BINARY TABLE_NAME = BINARY 'rolepermission'
    AND BINARY COLUMN_NAME = BINARY 'permissionId'
    AND REFERENCED_TABLE_NAME IS NOT NULL;

  SELECT COUNT(*) INTO v_legacy_fk_count
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND BINARY TABLE_NAME = BINARY 'rolepermission'
    AND BINARY COLUMN_NAME = BINARY 'permissionId'
    AND BINARY REFERENCED_TABLE_NAME = BINARY 'permission'
    AND BINARY REFERENCED_COLUMN_NAME = BINARY 'id';

  IF v_semantic_fk_count > 1 OR v_column_fk_count > 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unexpected multiple permissionId foreign keys';
  ELSEIF v_semantic_fk_count = 1 THEN
    SELECT 'Permission foreign key already valid: rolepermission.permissionId -> Permission.id' AS phase2_status;
  ELSEIF v_legacy_fk_count = 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Run sync-schema-rbac-bridge.sql before phase 2';
  ELSEIF v_column_fk_count = 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'permissionId FK references an unexpected table';
  ELSE
    SELECT COUNT(*) INTO @smartop_orphan_count
    FROM rolepermission rp
    LEFT JOIN Permission p ON p.id = rp.permissionId
    WHERE p.id IS NULL;

    IF @smartop_orphan_count > 0 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Permission foreign key blocked by orphan rows';
    END IF;

    ALTER TABLE `rolepermission`
      ADD CONSTRAINT `rolepermission_permissionId_fkey`
      FOREIGN KEY (`permissionId`) REFERENCES `Permission`(`id`)
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$

DELIMITER ;

CALL smartop_add_fk_if_safe('rolepermission', 'roleId', 'role', 'id', 'rolepermission_roleId_fkey', 'ALTER TABLE `rolepermission` ADD CONSTRAINT `rolepermission_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE');
CALL smartop_add_permission_fk_if_safe();
CALL smartop_add_fk_if_safe('approvalauthority', 'roleId', 'role', 'id', 'approvalauthority_roleId_fkey', 'ALTER TABLE `approvalauthority` ADD CONSTRAINT `approvalauthority_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE');
CALL smartop_add_fk_if_safe('accessrequest', 'userId', 'User', 'id', 'accessrequest_userId_fkey', 'ALTER TABLE `accessrequest` ADD CONSTRAINT `accessrequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE');
CALL smartop_add_fk_if_safe('UserRoleAssignment', 'userId', 'User', 'id', 'UserRoleAssignment_userId_fkey', 'ALTER TABLE `UserRoleAssignment` ADD CONSTRAINT `UserRoleAssignment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE');
CALL smartop_add_fk_if_safe('UserRoleAssignment', 'roleId', 'role', 'id', 'UserRoleAssignment_roleId_fkey', 'ALTER TABLE `UserRoleAssignment` ADD CONSTRAINT `UserRoleAssignment_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE');
CALL smartop_add_fk_if_safe('UserSession', 'userId', 'User', 'id', 'UserSession_userId_fkey', 'ALTER TABLE `UserSession` ADD CONSTRAINT `UserSession_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE');
CALL smartop_add_fk_if_safe('ShiftAssignment', 'siteId', 'Site', 'id', 'ShiftAssignment_siteId_fkey', 'ALTER TABLE `ShiftAssignment` ADD CONSTRAINT `ShiftAssignment_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE SET NULL ON UPDATE CASCADE');

DROP PROCEDURE smartop_add_fk_if_safe;
DROP PROCEDURE smartop_add_permission_fk_if_safe;
