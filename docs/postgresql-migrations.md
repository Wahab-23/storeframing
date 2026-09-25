# PostgreSQL migration setup

StoreFraming now uses PostgreSQL. The active migration history is
`prisma/migrations`, starting with `0_postgresql_baseline`. This migration creates
the complete schema from `prisma/schema.prisma`, including enums, indexes, and
foreign keys.

The former MySQL history is preserved in `prisma/legacy-migrations/mysql` for
reference. Prisma does not execute that directory. The PostgreSQL baseline
replaces the MySQL history; it does not transfer existing MySQL data.

## Empty PostgreSQL database

Set `DATABASE_URL` to the intended PostgreSQL database, then run:

```sh
pnpm exec prisma generate
pnpm exec prisma migrate deploy
pnpm exec prisma migrate status
```

Seeding is separate and optional. `pnpm exec prisma db seed` creates demo data;
review `prisma/seed.ts` before using it outside development.

## PostgreSQL database already created with `db push`

Back up the database and confirm `DATABASE_URL` points to the intended database.
First verify that its schema matches the committed Prisma schema:

```sh
pnpm exec prisma migrate diff \
  --from-config-datasource \
  --to-schema prisma/schema.prisma \
  --exit-code
```

An exit code of `0` means the schemas match. An exit code of `2` means there are
differences; review and reconcile those differences before continuing. An exit
code of `1` means the comparison failed and must be resolved first.

Once the schemas match, record the baseline as already applied. This records
migration history without running the table-creation SQL or deleting data:

```sh
pnpm exec prisma migrate resolve --applied 0_postgresql_baseline
pnpm exec prisma migrate deploy
pnpm exec prisma migrate status
```

Do not run the baseline SQL against a populated schema or reset the database to
adopt this history. If the database already has migration records from a
different history, inspect and reconcile that history before proceeding.

## Future schema changes

Use a development PostgreSQL database to generate and test incremental migrations:

```sh
pnpm exec prisma migrate dev --name describe_the_change
pnpm exec prisma generate
```

Commit the schema and generated migration SQL together. Apply reviewed migrations
to other environments with `pnpm exec prisma migrate deploy`.

## Baseline generation

The baseline was generated from the PostgreSQL schema with:

```sh
pnpm exec prisma migrate diff \
  --from-empty \
  --to-schema prisma/schema.prisma \
  --script
```

After the baseline has been applied, add incremental migrations instead of
regenerating or editing it.
