# Mini Rugby Lineup Planner

Mobile-first React/Vite planner for mini-rugby squad management, training eligibility, per-half attendance, fair bench rotation, position allocation and coach collaboration.

## Local development

1. Copy environment values for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
2. Run `npm ci`.
3. Run `npm run dev`.
4. Before pushing, run `npm run check`.

## R8 stabilization

R8 fixes active-field edit resets caused by nested component remounting, adds optimistic concurrency, per-half availability overrides, dynamic benches, cascading schedule cleanup, IndexedDB offline snapshots, complete settings persistence, shared assignment validation, tests/type checking and an authentication gate.

### Security migration

The code now expects authenticated coaches. Before merging R8 to production, configure Supabase email authentication and review/apply `migrations/20260917_r8_security_rls.sql`. Bootstrap at least one admin in `team_members` before switching from the existing public policies. The migration is not automatically executed by GitHub Pages.

## Data model transition

The repository still keeps the legacy JSONB planner document for compatibility while using `players` / `team_players` for the shared player library. R8 keeps these paths compatible; a later migration should make the relational roster authoritative and remove the duplicated JSON roster.

## Deployment

Pushes to `main` run lint, TypeScript domain checks, unit tests and the Vite production build before GitHub Pages deployment.
