# Supabase database infrastructure

The migration in `migrations/20260714093000_initial_csc_schema.sql` creates the
complete initial CSC schema. It intentionally contains no seed data and no
PostgreSQL schema managed with Supabase migrations.

## Apply later

After linking the repository to a Supabase project:

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

For a local Supabase CLI environment:

```bash
npx supabase start
npx supabase db reset
```

Generate application types only after the migration has been applied:

```bash
npx supabase gen types typescript --linked > src/types/database.types.ts
```

Do not run the generated-type command until the placeholder file can safely be
replaced and the frontend migration begins.
