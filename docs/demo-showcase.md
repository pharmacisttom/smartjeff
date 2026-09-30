# SmartOP Demo Showcase Architecture & Overview

## 1. Overview
SmartOP Enterprise Operations Platform provides a realistic **Demo Showcase Environment** designed for enterprise customers to test modules, roles, workflows, dashboards, and Longdo Map GIS command capabilities safely without impacting production data.

## 2. Core Safety & Isolation Principles
- **Feature Flag Control**: Enabled when `DEMO_MODE=true` (or `NEXT_PUBLIC_DEMO_MODE=true`).
- **Data Isolation**: All demo data is strictly identified via `DEMO-` code markers or `isDemo` flags.
- **Security Integrity**: No security bypasses. All logins use full Argon2id password verification, session tokens, and strict RBAC authorization via `UserRoleAssignment`.

## 3. Demo Showcase Features
- **App-like Login UI**: Mobile-first responsive login UI with 6 standard Demo Account cards.
- **6 Standard Demo Accounts**: Standardized accounts across Admin, Executive, HR, Coordinator, Supervisor, and Employee.
- **Module Showcase**: Interactively accessible at `/demo/features`.
- **Product Roadmap**: Viewable at `/demo/roadmap`.
- **Customer Feedback System**: Embedded feedback modal and admin dashboard at `/admin/demo-feedback`.
- **Guided Demo Tour**: Walkthrough overlay for prospective customers.

## 4. Maintenance Scripts
- **Provision Users**: `DEMO_MODE=true npx tsx scripts/provision-demo-users.ts`
- **Set Passwords**: `DEMO_MODE=true npx tsx scripts/set-demo-passwords.ts`
- **Seed Dataset**: `DEMO_MODE=true npx tsx scripts/seed-demo-showcase.ts`
- **Reset Showcase**: `DEMO_MODE=true npx tsx scripts/reset-demo-showcase.ts`
- **Route Audit**: `npx tsx scripts/audit-demo-routes.ts`
- **Smoke Test**: `npx tsx scripts/demo-smoke-test.ts`
