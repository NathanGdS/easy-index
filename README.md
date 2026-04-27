# easy-index

Bitcoin market awareness in your system tray. Real-time price, Fear & Greed Index, and Mayer Multiple — with alerts that only fire when signals align.

![Version](https://img.shields.io/badge/version-0.1.0-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![Platform](https://img.shields.io/badge/platform-Windows-lightgrey)

---

## What it does

Lives in the Windows system tray and shows three Bitcoin metrics at a glance:

```
₿ 67K | 😨 24 | M 0.9
```

| Field | Meaning |
|---|---|
| `₿ 67K` | Current BTC price |
| `😨 24` | Fear & Greed Index (0–100) with sentiment emoji |
| `M 0.9` | Mayer Multiple (price / 200-day MA) |

Click the tray icon to expand a detail panel. Enable the floating widget from the tray menu for an always-on-top display.

**Alerts fire only on combined signals** — both conditions must be true simultaneously:

| Alert | Condition |
|---|---|
| Strong Buy | Fear & Greed < 20 **AND** Mayer < 0.8 |
| Overheated | Fear & Greed > 80 **AND** Mayer > 1.5 |

Single-signal conditions (fear without undervaluation, or greed without overvaluation) produce no noise. Same alert won't repeat within 1 hour.

---

## Features

- Live BTC price — updates every 60 seconds (CoinGecko, fallback to Binance)
- Fear & Greed Index — fetches once per 24 hours from Alternative.me
- Mayer Multiple — computed locally from 200-day moving average (no external dependency)
- Expandable panel — click the tray icon for formatted detail view
- Floating widget — optional always-on-top display mode
- Offline resilience — persistent local cache survives restarts and network failures
- Retry logic — up to 2 automatic retries on fetch failure

---

## Requirements

- Windows 10 or later
- Node.js 18+

---

## Installation

```bash
git clone https://github.com/nathangarsantos/easy-index.git
cd easy-index
npm install
```

---

## Usage

```bash
npm start
```

The app starts minimized to the system tray. Right-click the tray icon to toggle the floating widget or quit.

---

## Architecture

```
MarketDataService (APIs)
    ↓
DataScheduler (polls every 60s / 24h)
    ↓
index.js (orchestrator)
    ├→ CacheStore          — persist state to disk
    ├→ MayerMultipleEngine — compute MA200 + multiple
    ├→ SignalEngine         — classify market state
    ├→ AlertService         — fire system notifications
    └→ Broadcast
        ├→ TrayController  — system tray text
        ├→ PanelController — click-to-expand window
        └→ WidgetController — floating widget
```

All state flows through a single broadcast function; UI components are passive receivers.

---

## Data sources

| Data | Primary | Fallback |
|---|---|---|
| BTC Price | CoinGecko | Binance |
| Fear & Greed | Alternative.me | — |
| Historical Prices (200d) | CoinGecko | — |

All requests use an 8-second timeout.

---

## Tests

```bash
npm test
```

~53 tests covering `MayerMultipleEngine`, `SignalEngine`, `DataScheduler`, and `AlertService`.

```bash
npm run test:watch
```

---

## Tech stack

- [Electron](https://www.electronjs.org/) 28
- [electron-store](https://github.com/sindresorhus/electron-store) — persistent cache
- [node-fetch](https://github.com/node-fetch/node-fetch) 2 — HTTP client
- [Jest](https://jestjs.io/) 29 — test framework

---

## License

MIT — Nathan G. Santos
