# easy-index

Bitcoin market awareness in your system tray. Real-time price, Fear & Greed Index, Mayer Multiple, and MVRV Z-Score — with alerts that only fire when signals align.

![Version](https://img.shields.io/badge/version-0.2.2-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![Platform](https://img.shields.io/badge/platform-Windows-lightgrey)

---

## What it does

Lives in the Windows system tray and shows Bitcoin metrics at a glance:

```
🔵 ₿75K 😨24 ×0.91
```

| Field | Meaning |
|---|---|
| `🔵` | Signal badge — market state color (🔵 Strong Buy / 🔴 Overheated / 🟠 Fearful / 🟡 Greedy / ⚪ Neutral) |
| `₿75K` | Current BTC price |
| `😨24` | Fear & Greed Index (0–100) with sentiment emoji |
| `×0.91` | Mayer Multiple (price / 200-day MA) |

Hover the tray icon for a verbose tooltip. Click to expand the detail panel. Enable the floating widget from the tray menu for an always-on-top display.

**Alerts fire only on combined signals** — both conditions must be true simultaneously:

| Alert | Condition |
|---|---|
| Strong Buy | Fear & Greed < 20 **AND** Mayer < 0.8 |
| Overheated | Fear & Greed > 80 **AND** Mayer > 1.5 |

Single-signal conditions (fear without undervaluation, or greed without overvaluation) produce no noise. Same alert won't repeat within 1 hour.

---

## Features

- Live BTC price — updates every 60 seconds (CoinGecko, fallback to Binance)
- Fear & Greed Index — fetches every 60 seconds
- Mayer Multiple — computed locally from 200-day moving average (no external dependency)
- MVRV Z-Score — fetches every 4 hours; zone classification (underheat / fair / overvalued / extreme)
- Signal badge — colored tray icon prefix reflects combined market state at a glance
- Expandable panel — click the tray icon for a detailed dark-card view with progress bars and MVRV section
- Floating widget — optional always-on-top display with compact MVRV display
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
DataScheduler (polls every 60s / 24h / 4h for MVRV)
    ↓
index.js (orchestrator)
    ├→ CacheStore           — persist state to disk
    ├→ MayerMultipleEngine  — compute MA200 + multiple
    ├→ MVRVZScoreEngine     — fetch + zone classification
    ├→ SignalEngine          — classify market state
    ├→ AlertService          — fire system notifications
    └→ Broadcast
        ├→ TrayController   — system tray badge + label
        ├→ PanelController  — click-to-expand dark card panel
        └→ WidgetController — floating always-on-top widget
```

All state flows through a single broadcast function; UI components are passive receivers.

---

## Data sources

| Data | Primary | Fallback | Poll interval |
|---|---|---|---|
| BTC Price | CoinGecko | Binance | 60s |
| Fear & Greed | Alternative.me | — | 60s |
| Historical Prices (200d) | CoinGecko | — | 24h |
| MVRV Z-Score | bitcoin-data.com | — | 4h |

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
