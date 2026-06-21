# Project Constitution — easy-index

## Core Philosophy

Controllers are passive. Engines are pure. HTTP is isolated. Orchestrators only wire.
Business logic lives in services and engines — never in UI, never in entry points.

---

## Immutable Rules

### CONST-001 — No Business Logic in Controllers
**Rule:** Controllers (`TrayController`, `PanelController`, `WidgetController`) must NOT compute signals, classify market state, or execute any business logic.
**Rationale:** Separation of concerns — controllers are passive UI receivers only.
**Protects against:** Logic scattered across UI layer; untestable business rules; architectural drift where controllers become fat.
**Exceptions:** None.
**Implemented in:** `src/main/tray.js`, `src/main/panel.js`, `src/main/widget.js`

---

### CONST-002 — Engine Purity
**Rule:** Engines (`SignalEngine`, `MayerMultipleEngine`, `MVRVZScoreEngine`, and future engines) must be pure — no side effects, no mutable state, no I/O. Static keyword is an implementation choice; purity is the law.
**Rationale:** Pure functions are deterministic and trivially testable.
**Protects against:** Hidden state bugs; untestable computation; coupling engines to infrastructure.
**Exceptions:** None.
**Implemented in:** `src/main/services/SignalEngine.js`, `src/main/services/MayerMultipleEngine.js`, `src/main/services/MVRVZScoreEngine.js`

---

### CONST-003 — HTTP Abstraction in Service Layer
**Rule:** All HTTP calls must be isolated in a dedicated data service (`MarketDataService` or subclasses/extensions). Business logic services, engines, and controllers must never perform HTTP directly.
**Rationale:** Abstracts external data fetching from internal logic. `MarketDataService` can be extended per asset context (e.g., new cryptocurrency).
**Protects against:** HTTP logic leaking into engines or controllers; untestable network calls; tight coupling to external APIs.
**Exceptions:** None.
**Implemented in:** `src/main/services/MarketDataService.js`

---

### CONST-004 — Dependency Injection for Data-Coordinating Services
**Rule:** Any service that coordinates external data fetching (e.g., `DataScheduler`) must receive fetch functions via injection — never instantiate or call HTTP services directly.
**Rationale:** Enables testing without HTTP; decouples scheduling from fetching.
**Protects against:** Hard-to-test schedulers; brittle tests requiring real network.
**Exceptions:** None.
**Implemented in:** `src/main/services/DataScheduler.js` (constructor takes `fetchPrice`/`fetchFearGreed`/`fetchHistorical`/`fetchMVRVZScore`), wired in `src/main/index.js`

---

### CONST-005 — index.js is Orchestrator Only
**Rule:** `index.js` must only wire services, register events, and call `broadcast()`. Business logic is forbidden inside `index.js`.
**Rationale:** Orchestrator must stay thin — it connects parts, never computes.
**Protects against:** Logic accumulating in the entry point; untestable orchestration code.
**Exceptions:** Calling engine static methods (e.g., `SignalEngine.classifyMarketState`, `MayerMultipleEngine.computeFromHistoricalPrices`) from inside `broadcast()` is wiring, not business logic — the computation itself still lives in the engine.
**Implemented in:** `src/main/index.js`

---

## Architectural Rules

### CONST-006 — Controllers Are Passive Receivers
**Rule:** Controllers should receive data only via `broadcast()`. They must not pull or request data on their own initiative.
**Rationale:** Keeps data flow unidirectional and predictable.
**Protects against:** Race conditions; duplicate fetches; unpredictable UI state.
**Exceptions:** Conditional — only if a specific problem requires a workaround, with explicit justification.
**Implemented in:** `src/main/tray.js`, `src/main/panel.js`, `src/main/widget.js` (`update()` methods)

---

### CONST-007 — Parameterize Asset-Specific Logic
**Rule:** Asset identifiers (ticker symbols, CoinGecko IDs, Binance pairs) must not be hardcoded inside engines or services. They must be parameterized to support multi-asset future.
**Rationale:** App is currently Bitcoin-only but multi-asset support is a planned direction.
**Protects against:** Refactoring pain when adding new assets; Bitcoin-specific logic entangled in generic computation.
**Exceptions:** Acceptable temporarily in config/constants files — never inside logic code.
**Implemented in:** `src/main/services/MarketDataService.js` (URL constants at top of file, isolated from fetch logic)

---

## Technology Rules

### CONST-008 — Dual-Signal Alert Requirement
**Rule:** Alerts fire only when both signals align simultaneously (Fear & Greed + Mayer Multiple). Single-signal alerts are not currently implemented.
**Rationale:** Reduces false positives. Current polling is 60s with 1h cooldown per alert type.
**Protects against:** Alert fatigue from weak single-indicator signals.
**Exceptions:** Can evolve as the signal library grows.
**Implemented in:** `src/main/services/SignalEngine.js` (`shouldAlert`), `src/main/services/AlertService.js` (cooldown)

---

### CONST-009 — CacheStore for Persistence
**Rule:** Persistence goes through `CacheStore` (electron-store wrapper). Direct disk writes elsewhere are the current pattern.
**Rationale:** Current pattern only — may evolve if persistence needs grow.
**Protects against:** Scattered persistence logic.
**Exceptions:** Flexible.
**Implemented in:** `src/main/services/CacheStore.js`

---

## Development Rules

### CONST-010 — UI Controller Test Coverage
**Rule:** UI controllers (`TrayController`, `PanelController`, `WidgetController`) must have test coverage. Electron APIs they depend on are mocked via `tests/__mocks__/electron.js`.
**Rationale:** Closed gap — Electron mocking complexity originally delayed coverage; this is no longer the case.
**Protects against:** Regressions in tray/panel/widget rendering logic going unnoticed.
**Exceptions:** None.
**Implemented in:** `tests/TrayController.test.js`, `tests/PanelController.test.js`, `tests/WidgetController.test.js` (31 tests total)

---

## Forbidden Patterns

| Pattern | Violates | File scope (glob) | Pattern (regex) |
|---|---|---|---|
| Signal/zone classification called inside the tray controller | CONST-001 | `src/main/tray.js` | `classifyMarketState\(\|computeMayerMultiple\(\|computeMA200\(\|computeFromHistoricalPrices\(\|classifyZone\(` |
| Signal/zone classification called inside the panel controller | CONST-001 | `src/main/panel.js` | `classifyMarketState\(\|computeMayerMultiple\(\|computeMA200\(\|computeFromHistoricalPrices\(\|classifyZone\(` |
| Signal/zone classification called inside the widget controller | CONST-001 | `src/main/widget.js` | `classifyMarketState\(\|computeMayerMultiple\(\|computeMA200\(\|computeFromHistoricalPrices\(\|classifyZone\(` |
| Engine with instance state or I/O | CONST-002 | `src/main/services/*Engine.js` | `require\(['"]electron['"]\)\|fetch\(\|axios\|this\.\w` |
| `fetch`/`axios` call inside a controller or `index.js` | CONST-003 | `src/main/*.js` | `fetch\(\|axios` |
| `fetch`/`axios` call inside an engine | CONST-003 | `src/main/services/*Engine.js` | `fetch\(\|axios` |
| `DataScheduler` directly importing `MarketDataService` | CONST-004 | `src/main/services/DataScheduler.js` | `require\(['"]\.\/MarketDataService['"]\)\|new MarketDataService\(` |
| Hardcoded `"bitcoin"` / `"BTCUSDT"` inside engine logic | CONST-007 | `src/main/services/*Engine.js` | `bitcoin\|BTCUSDT` |

CONST-005 and CONST-006 have no row here — "business logic in `index.js`" and "passive receiver" hinge on a judgment call (the same engine-call syntax is *required* wiring inside `broadcast()` but *forbidden* inside a controller). A regex can't tell those apart without false positives, so they're enforced by `constitution-keeper`'s reasoning layer at edit time, not by pattern match.

---

## Amendment History

See AMENDMENTS.md
