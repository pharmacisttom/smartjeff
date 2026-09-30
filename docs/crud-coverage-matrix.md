# SmartOP CRUD Coverage Matrix

| Model | Create | Read | Update | Delete / Deactivate | RBAC | Audit | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **User** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `FULL_CRUD` |
| **Role** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `FULL_CRUD` |
| **UserRoleAssignment** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `FULL_CRUD` |
| **Employee** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `FULL_CRUD` |
| **Attendance** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | `PARTIAL` |
| **Leave** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | `PARTIAL` |
| **PayrollRun** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | `PARTIAL` |
| **Payslip** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | `PARTIAL` |
| **Site** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `FULL_CRUD` |
| **Project** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `FULL_CRUD` |
| **Client** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `FULL_CRUD` |
| **ShiftTemplate** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `FULL_CRUD` |
| **AuditLog** | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | `READ_ONLY` |
