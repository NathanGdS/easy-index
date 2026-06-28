# Notification Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-type notification mute toggles (via tray right-click submenu) and increase the alert cooldown to 8 hours, with both settings persisted across restarts via a new `NotificationPreferences` service.

**Architecture:** A new `NotificationPreferences` service owns all notification state (mute flags + last-fired timestamps), persists via `CacheStore`, and is injected into both `AlertService` (for gate logic) and `TrayController` (via callbacks for menu rendering).

**Tech Stack:** Electron, Node.js, Jest (--runInBand)

## Global Constraints

- All tests run with: `npm test` or `npx jest <file> --runInBand`
- Electron is fully mocked via `tests/__mocks__/electron.js` — never import real Electron in tests
- Jest fake timers are NOT needed for cooldown tests — control time via `setLastFired` + explicit `cooldownMs`
- `CacheStore` is a thin wrapper over `electron-store`; use a plain mock object in tests (`{ get: jest.fn(), set: jest.fn() }`)
- No new npm dependencies

---

### Task 1: NotificationPreferences service

**Files:**
- Create: `src/main/services/NotificationPreferences.js`
- Create: `tests/NotificationPreferences.test.js`

**Interfaces:**
- Produces: `NotificationPreferences` class with constructor `{ store, cooldownMs? }` and methods:
  - `toggleMute(type: string): void`
  - `isMuted(type: string): boolean`
  - `getLastFired(type: string): number`
  - `setLastFired(type: string, ts: number): void`
  - `isOnCooldown(type: string): boolean`

- [ ] **Step 1: Write the failing tests**

Create `tests/NotificationPreferences.test.js`:

```js
const { NotificationPreferences } = require('../src/main/services/NotificationPreferences');

function makeStore(initial = {}) {
  const data = { ...initial };
  return {
    get: jest.fn(key => data[key]),
    set: jest.fn((key, val) => { data[key] = val; }),
  };
}

describe('NotificationPreferences', () => {
  it('isMuted returns false by default', () => {
    const prefs = new NotificationPreferences({ store: makeStore() });
    expect(prefs.isMuted('STRONG_BUY')).toBe(false);
    expect(prefs.isMuted('OVERHEATED')).toBe(false);
  });

  it('toggleMute flips mute state', () => {
    const prefs = new NotificationPreferences({ store: makeStore() });
    prefs.toggleMute('STRONG_BUY');
    expect(prefs.isMuted('STRONG_BUY')).toBe(true);
    prefs.toggleMute('STRONG_BUY');
    expect(prefs.isMuted('STRONG_BUY')).toBe(false);
  });

  it('toggleMute persists to store', () => {
    const store = makeStore();
    const prefs = new NotificationPreferences({ store });
    prefs.toggleMute('STRONG_BUY');
    expect(store.set).toHaveBeenCalledWith(
      'notifications.muted',
      expect.objectContaining({ STRONG_BUY: true })
    );
  });

  it('mute state is independent per type', () => {
    const prefs = new NotificationPreferences({ store: makeStore() });
    prefs.toggleMute('STRONG_BUY');
    expect(prefs.isMuted('OVERHEATED')).toBe(false);
  });

  it('getLastFired returns 0 by default', () => {
    const prefs = new NotificationPreferences({ store: makeStore() });
    expect(prefs.getLastFired('STRONG_BUY')).toBe(0);
  });

  it('setLastFired persists to store', () => {
    const store = makeStore();
    const prefs = new NotificationPreferences({ store });
    prefs.setLastFired('STRONG_BUY', 12345);
    expect(store.set).toHaveBeenCalledWith(
      'notifications.lastFired',
      expect.objectContaining({ STRONG_BUY: 12345 })
    );
  });

  it('isOnCooldown true when within cooldown window', () => {
    const prefs = new NotificationPreferences({ store: makeStore(), cooldownMs: 1000 });
    prefs.setLastFired('STRONG_BUY', Date.now() - 500);
    expect(prefs.isOnCooldown('STRONG_BUY')).toBe(true);
  });

  it('isOnCooldown false when beyond cooldown window', () => {
    const prefs = new NotificationPreferences({ store: makeStore(), cooldownMs: 1000 });
    prefs.setLastFired('STRONG_BUY', Date.now() - 2000);
    expect(prefs.isOnCooldown('STRONG_BUY')).toBe(false);
  });

  it('isOnCooldown false when never fired', () => {
    const prefs = new NotificationPreferences({ store: makeStore(), cooldownMs: 1000 });
    expect(prefs.isOnCooldown('STRONG_BUY')).toBe(false);
  });

  it('restores muted state from cache on construction', () => {
    const store = makeStore({
      'notifications.muted': { STRONG_BUY: true, OVERHEATED: false },
    });
    const prefs = new NotificationPreferences({ store });
    expect(prefs.isMuted('STRONG_BUY')).toBe(true);
    expect(prefs.isMuted('OVERHEATED')).toBe(false);
  });

  it('restores lastFired from cache on construction', () => {
    const ts = Date.now() - 100;
    const store = makeStore({
      'notifications.lastFired': { STRONG_BUY: ts, OVERHEATED: 0 },
    });
    const prefs = new NotificationPreferences({ store });
    expect(prefs.getLastFired('STRONG_BUY')).toBe(ts);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx jest tests/NotificationPreferences.test.js --runInBand
```

Expected: FAIL — `Cannot find module '../src/main/services/NotificationPreferences'`

- [ ] **Step 3: Implement NotificationPreferences**

Create `src/main/services/NotificationPreferences.js`:

```js
const DEFAULTS = {
  muted: { STRONG_BUY: false, OVERHEATED: false },
  lastFired: { STRONG_BUY: 0, OVERHEATED: 0 },
};

class NotificationPreferences {
  constructor({ store, cooldownMs = 28_800_000 } = {}) {
    this._store = store;
    this._cooldownMs = cooldownMs;
    this._muted = { ...DEFAULTS.muted, ...(store.get('notifications.muted') || {}) };
    this._lastFired = { ...DEFAULTS.lastFired, ...(store.get('notifications.lastFired') || {}) };
  }

  toggleMute(type) {
    this._muted[type] = !this._muted[type];
    this._store.set('notifications.muted', this._muted);
  }

  isMuted(type) {
    return !!this._muted[type];
  }

  getLastFired(type) {
    return this._lastFired[type] || 0;
  }

  setLastFired(type, ts) {
    this._lastFired[type] = ts;
    this._store.set('notifications.lastFired', this._lastFired);
  }

  isOnCooldown(type) {
    return Date.now() - this.getLastFired(type) < this._cooldownMs;
  }
}

module.exports = { NotificationPreferences };
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx jest tests/NotificationPreferences.test.js --runInBand
```

Expected: PASS — 11 tests

- [ ] **Step 5: Commit**

```
git add src/main/services/NotificationPreferences.js tests/NotificationPreferences.test.js
git commit -m "feat(notifications): add NotificationPreferences service with persistence"
```

---

### Task 2: Update AlertService to use NotificationPreferences

**Files:**
- Modify: `src/main/services/AlertService.js`
- Modify: `tests/AlertService.test.js`

**Interfaces:**
- Consumes: `NotificationPreferences` from Task 1 — methods `isMuted(type)`, `isOnCooldown(type)`, `setLastFired(type, ts)`
- Produces: `AlertService` constructor now takes `{ notify, prefs }` (removes `cooldownMs`)

- [ ] **Step 1: Replace AlertService tests**

Replace the entire content of `tests/AlertService.test.js`:

```js
const { AlertService } = require('../src/main/services/AlertService');

function makePrefs({ muted = {}, onCooldown = {} } = {}) {
  return {
    isMuted: jest.fn(type => !!muted[type]),
    isOnCooldown: jest.fn(type => !!onCooldown[type]),
    setLastFired: jest.fn(),
  };
}

describe('AlertService', () => {
  let mockNotify;

  beforeEach(() => {
    mockNotify = jest.fn();
  });

  it('fires notification for STRONG_BUY alert', () => {
    const service = new AlertService({ notify: mockNotify, prefs: makePrefs() });
    service.trigger('STRONG_BUY');
    expect(mockNotify).toHaveBeenCalledTimes(1);
    expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ type: 'STRONG_BUY' }));
  });

  it('fires notification for OVERHEATED alert', () => {
    const service = new AlertService({ notify: mockNotify, prefs: makePrefs() });
    service.trigger('OVERHEATED');
    expect(mockNotify).toHaveBeenCalledTimes(1);
    expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ type: 'OVERHEATED' }));
  });

  it('suppressed when type is muted', () => {
    const service = new AlertService({
      notify: mockNotify,
      prefs: makePrefs({ muted: { STRONG_BUY: true } }),
    });
    service.trigger('STRONG_BUY');
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it('suppressed when on cooldown', () => {
    const service = new AlertService({
      notify: mockNotify,
      prefs: makePrefs({ onCooldown: { STRONG_BUY: true } }),
    });
    service.trigger('STRONG_BUY');
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it('calls setLastFired on successful fire', () => {
    const prefs = makePrefs();
    const service = new AlertService({ notify: mockNotify, prefs });
    service.trigger('STRONG_BUY');
    expect(prefs.setLastFired).toHaveBeenCalledWith('STRONG_BUY', expect.any(Number));
  });

  it('does not call setLastFired when suppressed by mute', () => {
    const prefs = makePrefs({ muted: { STRONG_BUY: true } });
    const service = new AlertService({ notify: mockNotify, prefs });
    service.trigger('STRONG_BUY');
    expect(prefs.setLastFired).not.toHaveBeenCalled();
  });

  it('does not fire for null/undefined type', () => {
    const service = new AlertService({ notify: mockNotify, prefs: makePrefs() });
    service.trigger(null);
    service.trigger(undefined);
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it('different alert types have independent cooldowns', () => {
    const prefs = makePrefs({ muted: { STRONG_BUY: true } });
    const service = new AlertService({ notify: mockNotify, prefs });
    service.trigger('STRONG_BUY');
    service.trigger('OVERHEATED');
    expect(mockNotify).toHaveBeenCalledTimes(1);
    expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ type: 'OVERHEATED' }));
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx jest tests/AlertService.test.js --runInBand
```

Expected: FAIL — tests reference `prefs` but `AlertService` still uses old API

- [ ] **Step 3: Replace AlertService implementation**

Replace the entire content of `src/main/services/AlertService.js`:

```js
const ALERT_MESSAGES = {
  STRONG_BUY: {
    title: 'Strong Buy Signal',
    body: 'Extreme Fear + Undervalued: F&G < 20 and Mayer < 0.8',
  },
  OVERHEATED: {
    title: 'Overheated Market',
    body: 'Extreme Greed + Overvalued: F&G > 80 and Mayer > 1.5',
  },
};

class AlertService {
  constructor({ notify, prefs } = {}) {
    this._notify = notify;
    this._prefs = prefs;
  }

  trigger(type) {
    if (!type || !ALERT_MESSAGES[type]) return;
    if (this._prefs.isMuted(type)) return;
    if (this._prefs.isOnCooldown(type)) return;

    this._prefs.setLastFired(type, Date.now());
    this._notify({ type, ...ALERT_MESSAGES[type] });
  }
}

module.exports = { AlertService };
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx jest tests/AlertService.test.js --runInBand
```

Expected: PASS — 8 tests

- [ ] **Step 5: Commit**

```
git add src/main/services/AlertService.js tests/AlertService.test.js
git commit -m "feat(notifications): AlertService delegates cooldown and mute to NotificationPreferences"
```

---

### Task 3: Add notification submenu to TrayController

**Files:**
- Modify: `src/main/tray.js`
- Modify: `tests/TrayController.test.js`

**Interfaces:**
- Consumes: nothing from prior tasks (TrayController is wired in index.js, Task 4)
- Produces: `TrayController` constructor now accepts `{ onToggleMute?, getMuted? }`. When both provided, a "Notifications" submenu appears before the separator with "Strong Buy Alert" and "Overheated Alert" checkbox items.

- [ ] **Step 1: Write the failing tests**

Append to the `'TrayController menu'` describe block in `tests/TrayController.test.js`:

```js
  it('includes Notifications submenu when onToggleMute and getMuted provided', () => {
    makeController({ onToggleMute: jest.fn(), getMuted: jest.fn(() => false) });
    const [template] = Menu.buildFromTemplate.mock.calls[0];
    const item = template.find(i => i.label === 'Notifications');
    expect(item).toBeDefined();
    expect(item.submenu).toHaveLength(2);
  });

  it('omits Notifications submenu when onToggleMute not provided', () => {
    makeController();
    const [template] = Menu.buildFromTemplate.mock.calls[0];
    const item = template.find(i => i.label === 'Notifications');
    expect(item).toBeUndefined();
  });

  it('Strong Buy Alert is checked when not muted', () => {
    const getMuted = jest.fn(() => false);
    makeController({ onToggleMute: jest.fn(), getMuted });
    const [template] = Menu.buildFromTemplate.mock.calls[0];
    const submenu = template.find(i => i.label === 'Notifications').submenu;
    expect(submenu.find(i => i.label === 'Strong Buy Alert').checked).toBe(true);
  });

  it('Strong Buy Alert is unchecked when muted', () => {
    const getMuted = jest.fn(type => type === 'STRONG_BUY');
    makeController({ onToggleMute: jest.fn(), getMuted });
    const [template] = Menu.buildFromTemplate.mock.calls[0];
    const submenu = template.find(i => i.label === 'Notifications').submenu;
    expect(submenu.find(i => i.label === 'Strong Buy Alert').checked).toBe(false);
  });

  it('Overheated Alert is unchecked when muted', () => {
    const getMuted = jest.fn(type => type === 'OVERHEATED');
    makeController({ onToggleMute: jest.fn(), getMuted });
    const [template] = Menu.buildFromTemplate.mock.calls[0];
    const submenu = template.find(i => i.label === 'Notifications').submenu;
    expect(submenu.find(i => i.label === 'Overheated Alert').checked).toBe(false);
  });

  it('click Strong Buy Alert calls onToggleMute with STRONG_BUY', () => {
    const onToggleMute = jest.fn();
    makeController({ onToggleMute, getMuted: jest.fn(() => false) });
    const [template] = Menu.buildFromTemplate.mock.calls[0];
    const submenu = template.find(i => i.label === 'Notifications').submenu;
    submenu.find(i => i.label === 'Strong Buy Alert').click();
    expect(onToggleMute).toHaveBeenCalledWith('STRONG_BUY');
  });

  it('click Overheated Alert calls onToggleMute with OVERHEATED', () => {
    const onToggleMute = jest.fn();
    makeController({ onToggleMute, getMuted: jest.fn(() => false) });
    const [template] = Menu.buildFromTemplate.mock.calls[0];
    const submenu = template.find(i => i.label === 'Notifications').submenu;
    submenu.find(i => i.label === 'Overheated Alert').click();
    expect(onToggleMute).toHaveBeenCalledWith('OVERHEATED');
  });
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx jest tests/TrayController.test.js --runInBand
```

Expected: FAIL — "Notifications" submenu not found in template

- [ ] **Step 3: Update TrayController**

In `src/main/tray.js`, update the `TrayController` constructor and `_buildMenu`:

```js
class TrayController {
  constructor({ onQuit, onTogglePanel, onToggleWidget, startupService, onCheckForUpdates, onToggleMute, getMuted }) {
    const iconPath = path.join(__dirname, '../../src/assets/bitcoin.png');
    const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
    this._tray = new Tray(icon);
    this._onTogglePanel = onTogglePanel;
    this._onQuit = onQuit;
    this._onToggleWidget = onToggleWidget;
    this._widgetEnabled = false;
    this._startupService = startupService || null;
    this._onCheckForUpdates = onCheckForUpdates || null;
    this._onToggleMute = onToggleMute || null;
    this._getMuted = getMuted || null;

    this._tray.on('click', () => this._onTogglePanel());
    this._buildMenu();
  }

  _buildMenu() {
    const items = [
      {
        label: this._widgetEnabled ? 'Hide Widget' : 'Show Widget',
        click: () => {
          this._widgetEnabled = !this._widgetEnabled;
          this._onToggleWidget(this._widgetEnabled);
          this._buildMenu();
        },
      },
    ];

    if (this._startupService) {
      items.push({
        label: 'Start at login',
        type: 'checkbox',
        checked: this._startupService.isEnabled(),
        click: () => {
          this._startupService.setEnabled(!this._startupService.isEnabled());
          this._buildMenu();
        },
      });
    }

    if (this._onCheckForUpdates) {
      items.push({ label: 'Check for Updates', click: () => this._onCheckForUpdates() });
    }

    if (this._onToggleMute && this._getMuted) {
      items.push({
        label: 'Notifications',
        submenu: [
          {
            label: 'Strong Buy Alert',
            type: 'checkbox',
            checked: !this._getMuted('STRONG_BUY'),
            click: () => { this._onToggleMute('STRONG_BUY'); this._buildMenu(); },
          },
          {
            label: 'Overheated Alert',
            type: 'checkbox',
            checked: !this._getMuted('OVERHEATED'),
            click: () => { this._onToggleMute('OVERHEATED'); this._buildMenu(); },
          },
        ],
      });
    }

    items.push({ type: 'separator' });
    items.push({ label: 'Quit', click: () => this._onQuit() });

    const menu = Menu.buildFromTemplate(items);
    this._tray.setContextMenu(menu);
  }

  update({ price, fearGreed, mayerMultiple, marketState }) {
    this._tray.setTitle(formatTrayLabel(price, fearGreed, mayerMultiple, marketState));
    this._tray.setToolTip(formatTooltip(price, fearGreed, mayerMultiple));
  }

  destroy() {
    this._tray.destroy();
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx jest tests/TrayController.test.js --runInBand
```

Expected: PASS — all existing + 7 new tests

- [ ] **Step 5: Commit**

```
git add src/main/tray.js tests/TrayController.test.js
git commit -m "feat(tray): add per-type notification mute submenu"
```

---

### Task 4: Wire NotificationPreferences in index.js

**Files:**
- Modify: `src/main/index.js`

**Interfaces:**
- Consumes:
  - `NotificationPreferences` from Task 1: `new NotificationPreferences({ store, cooldownMs? })`
  - `AlertService` from Task 2: `new AlertService({ notify, prefs })`
  - `TrayController` from Task 3: accepts `{ onToggleMute, getMuted }`

- [ ] **Step 1: Update index.js**

In `src/main/index.js`:

1. Add import at the top (after existing imports):
```js
const { NotificationPreferences } = require('./services/NotificationPreferences');
```

2. Replace the `alertService` instantiation:
```js
// Before:
const alertService = new AlertService({
  notify: ({ title, body }) => new Notification({ title, body }).show(),
});

// After:
const prefs = new NotificationPreferences({ store: cache });
const alertService = new AlertService({
  notify: ({ title, body }) => new Notification({ title, body }).show(),
  prefs,
});
```

3. Add `onToggleMute` and `getMuted` to the `TrayController` constructor call:
```js
const tray = new TrayController({
  onQuit: () => app.quit(),
  startupService,
  onCheckForUpdates: updater ? () => updater.checkForUpdates() : null,
  onToggleMute: (type) => prefs.toggleMute(type),
  getMuted: (type) => prefs.isMuted(type),
  onTogglePanel: () => {
    const mayer = currentMayer();
    const fg = state.fearGreed?.value ?? null;
    const marketState = SignalEngine.classifyMarketState(fg, mayer);
    const { mvrvLabel, mvrvColor } = currentMvrvZone();
    panel.toggle({ price: state.price, fearGreed: fg, mayerMultiple: mayer, marketState, mvrvZScore: state.mvrvZScore, mvrvLabel, mvrvColor });
  },
  onToggleWidget: (enabled) => {
    if (enabled) widget.show();
    else widget.hide();
  },
});
```

- [ ] **Step 2: Run the full test suite**

```
npm test
```

Expected: PASS — all existing tests still pass, no regressions

- [ ] **Step 3: Commit**

```
git add src/main/index.js
git commit -m "feat(notifications): wire NotificationPreferences into index.js"
```

---

### Task 5: Smoke test in the running app

- [ ] **Step 1: Start the app**

```
npm start
```

- [ ] **Step 2: Verify Notifications submenu**

Right-click the tray icon. Confirm you see:
- "Notifications ▶" item
- Submenu with "Strong Buy Alert" (checked) and "Overheated Alert" (checked)

- [ ] **Step 3: Toggle a notification type**

Click "Strong Buy Alert". Confirm:
- The item becomes unchecked
- Menu rebuilds (right-click again to verify state persisted in menu)

- [ ] **Step 4: Restart the app and verify persistence**

Close and reopen the app. Right-click tray icon. "Strong Buy Alert" should still be unchecked.

- [ ] **Step 5: Re-enable and verify**

Click "Strong Buy Alert" again. Confirm it returns to checked. Restart → still checked.
