-- Synthetic reference fixtures only. No accounts, password hashes or personal data.
-- Import only into an isolated empty demo database after schema creation.
-- Account creation and seed safety checks are provided by npm run db:seed.
START TRANSACTION;
INSERT INTO `Site` (`id`, `code`, `name`, `location`, `lat`, `lng`, `createdAt`)
VALUES ('demo-site-a', 'DEMO-A', 'Demo Site A', 'Synthetic location', 0, 0, '2026-09-01 00:00:00')
ON DUPLICATE KEY UPDATE `id` = `id`;
INSERT INTO `Employee` (`id`, `code`, `firstName`, `lastName`, `position`, `siteId`, `baseSalary`, `dailyRate`, `createdAt`, `updatedAt`)
VALUES
('demo-employee-1', 'DEMO-1', 'Demo', 'User 1', 'Demo employee', 'demo-site-a', 15000, 500, '2026-09-01 00:00:00', '2026-09-01 00:00:00'),
('demo-employee-2', 'DEMO-2', 'Demo', 'User 2', 'Demo employee', 'demo-site-a', 15000, 500, '2026-09-01 00:00:00', '2026-09-01 00:00:00'),
('demo-employee-3', 'DEMO-3', 'Demo', 'User 3', 'Demo employee', 'demo-site-a', 15000, 500, '2026-09-01 00:00:00', '2026-09-01 00:00:00')
ON DUPLICATE KEY UPDATE `id` = `id`;
COMMIT;
