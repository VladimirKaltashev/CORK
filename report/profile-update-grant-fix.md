# Profile bio save — DB permissions fix

## 1. Migration file created

`supabase/migrations/20260617000003_profiles_update_grant.sql`

## 2. Exact SQL

```sql
GRANT UPDATE ON public.profiles TO authenticated;
```

## 3. Why this fixes profile save

The existing migration `20260614000000_profiles_grants.sql`:

1. Grants `SELECT` to `anon, authenticated` ✅
2. Creates the RLS policy `profiles_update_own` (allows update where `id = auth.uid()`) ✅
3. But **never grants `UPDATE` at the table level** ❌

PostgreSQL requires **both** layers:
- **Table-level privilege** (`GRANT UPDATE`) — allows the `authenticated` role to attempt UPDATE statements
- **Row-level security policy** — decides *which rows* the user can update

Without the table-level grant, Supabase rejects the `.update()` call with a permission error before the RLS policy ever evaluates. The store's `updateProfile` in `src/entities/profile/store.ts` correctly caught this error and showed it in a toast (`"Не удалось сохранить профиль"`), but the operation could never succeed.

Adding `GRANT UPDATE ON public.profiles TO authenticated` allows authenticated users to pass the table-level check, after which the existing `profiles_update_own` RLS policy limits updates to rows matching `auth.uid()`.

## 4. Why RLS still protects profiles

- The `profiles_update_own` policy (unchanged) uses `USING (id = auth.uid()) WITH CHECK (id = auth.uid())`
- An anonymous user (`anon` role) is **not** granted UPDATE
- Authenticated users can only update their own row — trying to update another user's profile is rejected by RLS
- No RLS was disabled; no policies were broadened

## 5. Tests/checks results

| Command | Result |
|---|---|
| `npx tsc --noEmit` | Clean |
| `npm run test` | 53 files, 367 passed |
| `npm run lint` | Clean |
| `npm run build` | Success |

No test changes needed — the fix is a database-level SQL grant; all existing store tests pass with mocked Supabase.

## 6. Scope confirmation

- ✅ No UI changes
- ✅ No store logic changes
- ✅ No economy/XP/rank changes
- ✅ No mascot changes
- ✅ No post-moderation changes
- ✅ No RLS policy changes
- ✅ No grants to anon
- ✅ Only the missing `GRANT UPDATE` was added

## 7. Manual verification

Not verified in browser — the migration has not been applied to any database. Verification requires running the migration against a Supabase instance (local or production) and testing the profile bio save flow. The fix is safe: it mirrors the same grant pattern already used for SELECT, and the existing RLS policy is unchanged.
