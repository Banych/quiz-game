# Debug Workflow

Systematic debugging for this Next.js + Prisma v7 + Supabase realtime stack.

## Usage
```
/debug [description of the problem]
```

## Step 1: Identify the Layer

Before diving in, determine where the failure originates:

| Symptom | Likely Layer | Start Here |
|---------|-------------|------------|
| API returns 500 / unexpected JSON | Application/Infrastructure | Step 2 |
| UI shows stale data / no update | Realtime / TanStack Query | Step 3 |
| Auth redirect loops / 401 | Auth / Middleware | Step 4 |
| DB constraint errors / data corrupt | Infrastructure / Schema | Step 5 |
| Test failures only | Domain / Use case logic | Step 6 |

## Step 2: API & Server Errors

```bash
# Check Postgres logs for DB-level errors
mcp__supabase__get_logs(service: 'postgres')

# Check Next.js server output (look for error stack traces)
# The dev server terminal will show these
```

Inspect the failing API route:
1. Read `src/app/api/[route]/route.ts`
2. Verify: zod validation → `getServices()` → use case → error mapping
3. Check `/not found/i` → 404 mapping is present

## Step 3: Realtime / State Issues

```bash
# Check realtime service logs
mcp__supabase__get_logs(service: 'realtime')

# Snapshot the UI to see current rendered state
mcp__playwright__navigate(url: 'http://localhost:3000')
mcp__playwright__snapshot()
```

Realtime checklist:
- [ ] Supabase channel name matches between publisher and subscriber
- [ ] TanStack Query invalidation fires after mutation
- [ ] Component re-renders on query data change (no stale closures)
- [ ] Check `src/infrastructure/realtime/` for channel setup

## Step 4: Auth / Middleware

```bash
# Check auth service logs
mcp__supabase__get_logs(service: 'auth')

# Inspect current session in browser
mcp__playwright__navigate(url: 'http://localhost:3000/api/session')
mcp__playwright__snapshot()
```

Auth checklist:
- [ ] `src/middleware.ts` matcher covers the failing route
- [ ] JWT not expired (check `supabase.auth.getSession()`)
- [ ] RLS policies allow the operation:
  ```
  mcp__supabase__get_advisors(type: 'security')
  ```

## Step 5: Database / Schema Issues

```bash
# Inspect actual DB state
mcp__supabase__execute_sql(query: 'SELECT * FROM "Quiz" ORDER BY "createdAt" DESC LIMIT 5')

# Check migration status
yarn prisma:migrate -- --dry-run

# Verify generated client is up-to-date
yarn prisma:generate
```

Schema checklist:
- [ ] Ran `yarn prisma:generate` after last schema change
- [ ] Import uses `@infrastructure/database/prisma/generated-client` (not `@prisma/client`)
- [ ] RLS policies updated after adding new tables/columns
- [ ] Mapper in `src/infrastructure/repositories/mappers/` handles new fields

## Step 6: Test Failures

```bash
# Run just the failing test with verbose output
yarn test [file-or-pattern] --reporter=verbose

# Watch mode for TDD loop
yarn test:watch [pattern]
```

Test debugging checklist:
- [ ] `vi.clearAllMocks()` in `beforeEach` (stale mock state between tests)
- [ ] `resetServices({ force: true })` for infrastructure tests
- [ ] Mock returns match the shape the use case expects
- [ ] Domain entity invariants match what the test is asserting

## Step 7: Build / Type Errors

```bash
# Full type check
yarn build

# Lint check
yarn lint
```

Type error checklist:
- [ ] No `any` types introduced
- [ ] DTOs used in presentation layer (not raw entities or Prisma types)
- [ ] Async route handlers `await params` before use (Next.js 15)

## Common "It Worked Yesterday" Causes

1. **Prisma client stale** → `yarn prisma:generate`
2. **Missing env var** → check `.env.local` against `.env.example`
3. **RLS blocking** → `mcp__supabase__get_advisors(type: 'security')`
4. **TanStack Query cache stale** → hard refresh or `queryClient.invalidateQueries()`
5. **Realtime channel conflict** → check for duplicate channel names in `src/infrastructure/realtime/`
