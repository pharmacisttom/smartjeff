-- SmartOP DEMO RBAC bridge for Linux MySQL with lower_case_table_names = 0.
-- REVIEW ONLY. This removes only the obsolete permissionId foreign key that
-- references legacy lowercase `permission`. It never changes table data.

DELIMITER $$

DROP PROCEDURE IF EXISTS smartop_apply_rbac_bridge$$

CREATE PROCEDURE smartop_apply_rbac_bridge()
BEGIN
  DECLARE v_database VARCHAR(64);
  DECLARE v_backup_exists INTEGER DEFAULT 0;
  DECLARE v_backup_count BIGINT DEFAULT 0;
  DECLARE v_rolepermission_exists INTEGER DEFAULT 0;
  DECLARE v_fk_count INTEGER DEFAULT 0;
  DECLARE v_constraint_name VARCHAR(128);
  DECLARE v_referenced_table VARCHAR(64);

  SELECT DATABASE() INTO v_database;
  IF BINARY v_database <> BINARY 'smartop_demo' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'RBAC bridge is restricted to smartop_demo';
  END IF;

  SELECT COUNT(*) INTO v_backup_exists
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE()
    AND BINARY TABLE_NAME = BINARY 'rolepermission_backup_20260929';
  IF v_backup_exists <> 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Required RolePermission backup table is missing';
  END IF;

  SELECT COUNT(*) INTO v_backup_count FROM `rolepermission_backup_20260929`;
  IF v_backup_count <> 246 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'RolePermission backup must contain exactly 246 rows';
  END IF;

  SELECT COUNT(*) INTO v_rolepermission_exists
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE()
    AND BINARY TABLE_NAME = BINARY 'rolepermission';
  IF v_rolepermission_exists <> 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Required rolepermission table is missing';
  END IF;

  SELECT COUNT(*), MAX(CONSTRAINT_NAME), MAX(REFERENCED_TABLE_NAME)
    INTO v_fk_count, v_constraint_name, v_referenced_table
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND BINARY TABLE_NAME = BINARY 'rolepermission'
    AND BINARY COLUMN_NAME = BINARY 'permissionId'
    AND REFERENCED_TABLE_NAME IS NOT NULL;

  IF v_fk_count = 0 THEN
    SELECT 'RBAC bridge already applied: permissionId foreign key is absent' AS bridge_status;
  ELSEIF v_fk_count > 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unexpected multiple permissionId foreign keys';
  ELSEIF BINARY v_referenced_table = BINARY 'Permission' THEN
    SELECT 'RBAC bridge not required: permissionId already references Permission' AS bridge_status;
  ELSEIF BINARY v_referenced_table = BINARY 'permission' THEN
    IF BINARY v_constraint_name <> BINARY 'RolePermission_permissionId_fkey' THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Legacy permissionId FK has an unexpected constraint name';
    END IF;
    ALTER TABLE `rolepermission` DROP FOREIGN KEY `RolePermission_permissionId_fkey`;
    SELECT 'RBAC bridge applied: obsolete lowercase permission FK removed' AS bridge_status;
  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'permissionId FK references an unexpected table';
  END IF;
END$$

DELIMITER ;

CALL smartop_apply_rbac_bridge();
DROP PROCEDURE smartop_apply_rbac_bridge;
