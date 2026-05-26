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

---

### CONST-002 — Engine Purity
**Rule:** Engines (`SignalEngine`, `MayerMultipleEngine`, and future engines) must be pure — no side effects, no mutable state, no I/O. Static keyword is an implementation choice; purity is the law.
**Rationale:** Pure functions are deterministic and trivially testable.
**Protects against:** Hidden state bugs; untestable computation; coupling engines to infrastructure.
**Exceptions:** None.

---

### CONST-003 — HTTP Abstraction in Service Layer
**Rule:** All HTTP calls must be isolated in a dedicated data service (`MarketDataService` or subclasses/extensions). Business logic services, engines, and controllers must never perform HTTP directly.
**Rationale:** Abstracts external data fetching from internal logic. `MarketDataService` can be extended per asset context (e.g., new cryptocurrency).
**Protects against:** HTTP logic leaking into engines or controllers; untestable network calls; tight coupling to external APIs.
**Exceptions:** None.

---

### CONST-004 — Dependency Injection for Data-Coordinating Services
**Rule:** Any service that coordinates external data fetching (e.g., `DataScheduler`) must receive fetch functions via injection — never instantiate or call HTTP services directly.
**Rationale:** Enables testing without HTTP; decouples scheduling from fetching.
**Protects against:** Hard-to-test schedulers; brittle tests requiring real network.
**Exceptions:** None.

---

### CONST-005 — index.js is Orchestrator Only
**Rule:** `index.js` must only wire services, register events, and call `broadcast()`. Business logic is forbidden inside `index.js`.
**Rationale:** Orchestrator must stay thin — it connects parts, never computes.
**Protects against:** Logic accumulating in the entry point; untestable orchestration code.
**Exceptions:** None.

---

## Architectural Rules

### CONST-006 — Controllers Are Passive Receivers
**Rule:** Controllers should receive data only via `broadcast()`. They must not pull or request data on their own initiative.
**Rationale:** Keeps data flow unidirectional and predictable.
**Protects against:** Race conditions; duplicate fetches; unpredictable UI state.
**Exceptions:** Conditional — only if a specific problem requires a workaround, with explicit justification.

---

### CONST-007 — Parameterize Asset-Specific Logic
**Rule:** Asset identifiers (ticker symbols, CoinGecko IDs, Binance pairs) must not be hardcoded inside engines or services. They must be parameterized to support multi-asset future.
**Rationale:** App is currently Bitcoin-only but multi-asset support is a planned direction.
**Protects against:** Refactoring pain when adding new assets; Bitcoin-specific logic entangled in generic computation.
**Exceptions:** Acceptable temporarily in config/constants files — never inside logic code.

---

## Technology Rules

### CONST-008 — Dual-Signal Alert Requirement
**Rule:** Alerts fire only when both signals align simultaneously (Fear & Greed + Mayer Multiple). Single-signal alerts are not currently implemented.
**Rationale:** Reduces false positives. Current polling is 60s with 1h cooldown per alert type.
**Protects against:** Alert fatigue from weak single-indicator signals.
**Exceptions:** Can evolve as the signal library grows.

---

### CONST-009 — CacheStore for Persistence
**Rule:** Persistence goes through `CacheStore` (electron-store wrapper). Direct disk writes elsewhere are the current pattern.
**Rationale:** Current pattern only — may evolve if persistence needs grow.
**Protects against:** Scattered persistence logic.
**Exceptions:** Flexible.

---

## Development Rules

### CONST-010 — UI Controller Test Coverage Is a Gap
**Rule:** UI controllers (tray, panel, widget) currently have no test coverage. This is a known gap to be closed, not an intentional policy.
**Rationale:** Electron mocking complexity delayed coverage — not a philosophical choice.
**Exceptions:** N/A.

---

## Forbidden Patterns

| Pattern | Violates |
|---|---|
| Signal computation inside a controller | CONST-001 |
| Engine with instance state or I/O | CONST-002 |
| `fetch`/`axios` call inside an engine or controller | CONST-003 |
| `DataScheduler` directly importing `MarketDataService` | CONST-004 |
| Business logic added to `index.js` | CONST-005 |
| Hardcoded `"bitcoin"` / `"BTCUSDT"` inside engine logic | CONST-007 |

---

## Amendment History

_No amendments yet._
