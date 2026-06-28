# Notification Improvements Design

**Date:** 2026-06-28  
**Branch:** feature/notification-improvements

## Goals

1. Increase alert cooldown from 1h to 8h (per alert type)
2. Add per-type mute toggle via tray right-click menu
3. Persist both cooldown timestamps and mute state across app restarts

---

## New Service: `NotificationPreferences`

**File:** `src/main/services/NotificationPreferences.js`

Single source of truth for notification preferences and cooldown tracking. Injected into both `AlertService` and `TrayController` callbacks.

**Constructor:** `{ store, cooldownMs = 28_800_000 }`  
`store` is a `CacheStore` instance.

**CacheStore keys:**
- `notifications.muted` → `{ STRONG_BUY: false, OVERHEATED: false }`
- `notifications.lastFired` → `{ STRONG_BUY: 0, OVERHEATED: 0 }`

**Public API:**

| Method | Behavior |
|---|---|
| `toggleMute(type)` | Inverts mute for type; persists to cache |
| `isMuted(type)` | Returns boolean |
| `getLastFired(type)` | Returns timestamp (ms) or 0 |
| `setLastFired(type, ts)` | Persists timestamp to cache |
| `isOnCooldown(type)` | `Date.now() - getLastFired(type) < cooldownMs` |

Initializes from cache on construction; missing keys default to `false` / `0`.

---

## `AlertService` Changes

**Constructor:** `{ notify, prefs }` — removes `cooldownMs` and `_lastFired`.

`trigger(type)` logic:
1. Return if type invalid or not in `ALERT_MESSAGES`
2. Return if `prefs.isMuted(type)`
3. Return if `prefs.isOnCooldown(type)`
4. `prefs.setLastFired(type, Date.now())`
5. `this._notify({ type, ...ALERT_MESSAGES[type] })`

---

## `TrayController` Changes

**Constructor additions:** `{ onToggleMute, getMuted }`

`_buildMenu()` adds a "Notifications" submenu before the separator:

```
Show Widget
Start at login         [checkbox]
──────────────────────
Notifications ▶
  Strong Buy Alert     [checkbox]  checked = !getMuted('STRONG_BUY')
  Overheated Alert     [checkbox]  checked = !getMuted('OVERHEATED')
──────────────────────
Check for Updates
Quit
```

Each submenu item click: calls `onToggleMute(type)` then `this._buildMenu()`.

---

## `index.js` Changes

```js
const prefs = new NotificationPreferences({ store: cache });

const alertService = new AlertService({ notify: ..., prefs });

const tray = new TrayController({
  // existing...
  onToggleMute: (type) => prefs.toggleMute(type),
  getMuted: (type) => prefs.isMuted(type),
});
```

---

## Tests

### `NotificationPreferences.test.js` (new)
- `isMuted` returns false by default
- `toggleMute` flips and persists
- `getLastFired` returns 0 by default
- `setLastFired` persists and `isOnCooldown` reflects it
- Restores state from cache on construction

### `AlertService.test.js` (updated)
- Fires when not muted and not on cooldown
- Suppressed when `prefs.isMuted()` returns true
- Suppressed when `prefs.isOnCooldown()` returns true
- Calls `prefs.setLastFired` on successful fire
- Different types independent (existing behavior preserved)

### `TrayController.test.js` (updated)
- Notifications submenu present with two checkbox items
- `getMuted` drives `checked` state
- Click calls `onToggleMute` with correct type and rebuilds menu
