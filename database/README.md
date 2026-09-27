# Database distribution

`schema.sql` is generated from Prisma metadata, not a database dump. It contains DDL only and is an alternative for an empty disposable database. Normal installations should use `npx prisma migrate deploy`, which records migration history.

`demo-data.sql` contains hand-authored synthetic site and employee fixtures, with no accounts or hashes. It is optional; `npm run db:seed` creates the same reference data plus three accounts, attendance, leave and a payslip. Rerunning the seed preserves existing demo records and credentials. The SQL file does not have the TypeScript seed's environment guard; import it only into an empty isolated demo database.

Do not import schema.sql on top of an existing database or combine it blindly with migrate deploy. Review [DATABASE](../docs/DATABASE.md) for recovery and drift handling and [SECURITY](SECURITY.md) for release restrictions.

Regenerate structure with Prisma 5:

```sh
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script --output database/schema.sql
```
