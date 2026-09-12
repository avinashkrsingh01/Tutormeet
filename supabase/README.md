# TutorMeet — Supabase Setup

## Running migrations

### Option A — Supabase Cloud (recommended for production)

1. Go to your Supabase project → **SQL Editor**
2. Run the migrations in order:
   - `migrations/001_initial_schema.sql`
   - `migrations/002_rls_policies.sql`
   - `migrations/003_storage_buckets.sql`

### Option B — Local development with Supabase CLI

```bash
supabase init
supabase start
supabase db push
```

## Creating the first admin user

1. Register via the TutorMeet UI as any user (parent or tutor)
2. In the Supabase Dashboard → Table Editor → `profiles`
3. Find the user and set `role = 'admin'`

Or run via SQL:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'admin@tutormeet.in';
```

## Storage buckets

Two buckets are created by `003_storage_buckets.sql`:

| Bucket | Public | Purpose |
|--------|--------|---------|
| `avatars` | Yes | Profile pictures |
| `tutor-documents` | No | ID + education docs |
