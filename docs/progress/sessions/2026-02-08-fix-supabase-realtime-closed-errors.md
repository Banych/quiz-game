# Fix Supabase Realtime CLOSED Errors

**Date:** 2026-02-08
**Status:** ✅ Complete
**Branch:** `feat/start-over`

## Summary

Fixed Supabase Realtime channel management to eliminate spurious `CLOSED` status errors and prevent duplicate channel creation. Applied the same channel-reuse pattern already used by `PresenceTracker` to both the client-side `SupabaseRealtimeClient` and the server-side broadcast functions.

---

## Problem

Three related issues were causing `CLOSED` errors in the browser console:

1. **No channel deduplication on client** — `SupabaseRealtimeClient.subscribe()` created a new Supabase channel on every call, even when multiple components subscribed to the same channel name (e.g., `quiz:123`). This caused duplicate channels to accumulate.

2. **`CLOSED` status treated as error** — When a channel was intentionally unsubscribed (e.g., during component unmount), the `CLOSED` status callback fired and was logged as an error, even though it was expected behavior.

3. **Ephemeral server-side channels** — Each broadcast (`broadcastQuizState`, `broadcastLeaderboard`, etc.) created a channel, subscribed, sent a message, and immediately unsubscribed. This was wasteful and could interfere with same-named client channels.

---

## Solution

### Step 1: Channel tracking in `SupabaseRealtimeClient`

Added a `Map<string, TrackedChannel>` to reuse channels, matching the pattern from `PresenceTracker`:

- **On subscribe:** If a channel for `channelName` already exists, add the event listener to it and increment `listenerCount`. Otherwise, create a new channel and store it.
- **On unsubscribe:** Decrement `listenerCount`. Only call `channel.unsubscribe()` and remove from map when count reaches 0.
- **On disconnect:** Clear the map after `removeAllChannels()`.

```typescript
type TrackedChannel = {
  channel: RealtimeChannel;
  listenerCount: number;
};

private readonly channels = new Map<string, TrackedChannel>();
```

### Step 2: Closing flag to suppress expected CLOSED errors

Added a `Set<string>` called `closingChannels`:

- Before calling `channel.unsubscribe()`, the channel name is added to the set
- In the status callback, `CLOSED` is only logged as an error if the channel is NOT in `closingChannels`
- Removed from `closingChannels` after unsubscribe completes (in `.finally()`)

### Step 3: Server-side broadcast channel pool

Created `broadcast-channel-pool.ts` — a shared pool for server-side broadcast channels:

- Maintains a `Map<string, PooledChannel>` of reused broadcast channels
- On first broadcast to a channel: create, subscribe, and store in map
- On subsequent broadcasts: reuse the existing channel (skip subscribe)
- 30-second idle timeout auto-cleans unused channels (timer resets on each send)

All 4 broadcast files were simplified to use the pool:
```typescript
// Before (each file):
const channel = client.channel(channelName, config);
try {
  await channel.subscribe();
  await channel.send({ type: 'broadcast', event, payload });
} finally {
  await channel.unsubscribe();
}

// After:
await broadcastPool.send(client, channelName, event, payload);
```

---

## What Was NOT Changed

- **PresenceTracker** — Already has proper channel management
- **`providers.tsx`** — `useMemo` already ensures single client instance per app
- **`realtime-client.ts` interface** — No changes to the contract
- **`emit()` method** — Still creates ephemeral channels (used for one-off client-side emits, not subscriptions)

---

## Tests Added

| Test File                                                            | Tests | Coverage                                                                               |
| -------------------------------------------------------------------- | ----- | -------------------------------------------------------------------------------------- |
| `src/tests/infrastructure/realtime/supabase-realtime-client.test.ts` | 9     | Channel reuse, listener counting, event delivery, cleanup, graceful double-unsubscribe |
| `src/tests/infrastructure/realtime/broadcast-channel-pool.test.ts`   | 7     | Channel reuse, idle timeout cleanup, timer reset, clear                                |

---

## Files Changed

| File                                                                 | Change Type                                                      |
| -------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `src/infrastructure/realtime/supabase-realtime-client.ts`            | Modified — channel tracking map, listener counting, closing flag |
| `src/infrastructure/realtime/broadcast-channel-pool.ts`              | Created — shared channel pool for server broadcasts              |
| `src/infrastructure/realtime/broadcast-quiz-state.ts`                | Modified — use channel pool                                      |
| `src/infrastructure/realtime/broadcast-leaderboard.ts`               | Modified — use channel pool                                      |
| `src/infrastructure/realtime/broadcast-round-summary.ts`             | Modified — use channel pool                                      |
| `src/infrastructure/realtime/broadcast-player-events.ts`             | Modified — use channel pool                                      |
| `src/tests/infrastructure/realtime/supabase-realtime-client.test.ts` | Created — 9 tests                                                |
| `src/tests/infrastructure/realtime/broadcast-channel-pool.test.ts`   | Created — 7 tests                                                |

---

## Verification

| Check                       | Result                                                                |
| --------------------------- | --------------------------------------------------------------------- |
| `yarn test`                 | ✅ 368 tests passing (1 skipped, pre-existing)                         |
| `yarn build` (lint + types) | ✅ Compilation and type-checking pass                                  |
| `yarn build` (static gen)   | ⚠️ Pre-existing `entryCSSFiles` error in static generation (unrelated) |
| New test coverage           | 16 new tests added                                                    |

---

## Next Steps

- [ ] Manual verification with Playwright MCP:
  - Host starts a quiz, player joins
  - Verify no `CLOSED` error logs in browser console
  - Verify realtime updates still work (state changes, leaderboard, answer acks)
  - Verify presence tracking still works
- [ ] Commit changes
