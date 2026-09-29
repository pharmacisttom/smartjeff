-- Migration: 20261001000000_deprecate_plaintext_password
--
-- This migration is intentionally safe for databases where either deprecated
-- column has already been removed. Table and column existence are checked with
-- case-sensitive comparisons because Linux uses lower_case_table_names = 0.
--
-- `User`.`passwordHash` and the `PasswordHistory` table are never touched.
-- Column comments are intentionally not changed: dynamically reconstructing a
-- legacy column definition could accidentally change its type, nullability,
-- default, character set, or collation.

-- Nullify deprecated plaintext passwords only when the exact `User`.`password`
-- column exists. DO 0 is the safe no-op for databases where it is absent.
SET @smartop_password_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND BINARY TABLE_NAME = BINARY 'User'
    AND BINARY COLUMN_NAME = BINARY 'password'
);

SET @smartop_password_sql = IF(
  @smartop_password_exists > 0,
  'UPDATE `User` SET `password` = NULL WHERE `password` IS NOT NULL',
  'DO 0'
);

PREPARE smartop_password_stmt FROM @smartop_password_sql;
EXECUTE smartop_password_stmt;
DEALLOCATE PREPARE smartop_password_stmt;

-- Nullify the deprecated permissions blob only when the exact
-- `User`.`permissions` column exists. RBAC tables remain untouched.
SET @smartop_permissions_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND BINARY TABLE_NAME = BINARY 'User'
    AND BINARY COLUMN_NAME = BINARY 'permissions'
);

SET @smartop_permissions_sql = IF(
  @smartop_permissions_exists > 0,
  'UPDATE `User` SET `permissions` = NULL WHERE `permissions` IS NOT NULL',
  'DO 0'
);

PREPARE smartop_permissions_stmt FROM @smartop_permissions_sql;
EXECUTE smartop_permissions_stmt;
DEALLOCATE PREPARE smartop_permissions_stmt;
