# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # run Electron app
npm test           # run all tests (Jest, --runInBand)
npm run test:watch # watch mode
```

Single test file:
```bash
npx jest tests/SignalEngine.test.js --runInBand
```

## Architecture

`src/main/index.js` is the orchestrator. On `app.whenReady`:
1. Instantiates all services and controllers
2. Starts `DataScheduler`, which emits `price-updated` (every 60s) and `daily-updated` (every 24h)
3. Each event updates `state`, persists to `CacheStore`, then calls `broadcast()`
4. `broadcast()` pushes the same payload to all three UI controllers and runs `SignalEngine` → `AlertService`

```
MarketDataService  (HTTP, 8s timeout, CoinGecko + Binance fallback)
    ↓
DataScheduler      (EventEmitter, two timers)
    ↓ events
index.js state     (price, fearGreed, historical)
    ↓
CacheStore         (electron-store, survives restarts)
    ↓ broadcast()
TrayController / PanelController / WidgetController   (passive receivers)
SignalEngine → AlertService                           (combined-signal alerts, 1h cooldown)
```

## Services

| File | Role |
|---|---|
| `MarketDataService.js` | All HTTP fetches; CoinGecko primary, Binance fallback for price |
| `DataScheduler.js` | Timer loop + retry (MAX_RETRIES=2); caches last good value on failure |
| `MayerMultipleEngine.js` | Pure static methods: `computeMA200`, `computeMayerMultiple`, `computeFromHistoricalPrices` |
| `SignalEngine.js` | Pure static: `classifyMarketState(fearGreed, mayerMultiple)` → `STRONG_BUY / OVERHEATED / FEARFUL / GREEDY / NEUTRAL` |
| `AlertService.js` | Fires OS notifications; per-type cooldown (`cooldownMs`, default 3 600 000 ms) |
| `CacheStore.js` | Thin wrapper over `electron-store` |

## Tests

Tests live in `tests/`. Electron is fully mocked via `tests/__mocks__/electron.js` — Jest maps `require('electron')` there automatically (see `moduleNameMapper` in `package.json`).

~53 tests cover the four pure/injectable services: `MayerMultipleEngine`, `SignalEngine`, `DataScheduler`, `AlertService`. UI controllers (`tray`, `panel`, `widget`) have no test coverage yet.

`DataScheduler` receives fetch functions by injection, so tests pass in jest mock functions without any HTTP.

## Alert logic

Alerts fire **only** when both signals align simultaneously:

| Alert | Condition |
|---|---|
| `STRONG_BUY` | `fearGreed < 20` **AND** `mayerMultiple < 0.8` |
| `OVERHEATED` | `fearGreed > 80` **AND** `mayerMultiple > 1.5` |

Single-signal states (`FEARFUL`, `GREEDY`) never trigger `AlertService`.
