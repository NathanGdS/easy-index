# 0001 — UI Redesign: Tray + Panel

**Status**: Complete
**Archived**: 2026-04-29
**User Stories**: 5 / 5

---

## Summary

Redesigned the tray label to be compact and signal-aware: colored emoji badge prefix (🔵🔴🟠🟡⚪), ₿75K format (no space), × prefix for Mayer Multiple, and a verbose tooltip. Redesigned the panel popup as a polished dark card with a per-state signal banner, progress bars for Fear & Greed (0–100) and Mayer Multiple (0–2.5), CSS transitions on bar widths and value colors, and `---` placeholders for unloaded data. Market state is now a first-class visual element in both surfaces.

---

## User Stories

| ID | Title | Status |
|----|-------|--------|
| US-1 | index.js broadcast wiring | ✅ |
| US-2 | TrayController redesign | ✅ |
| US-3 | PanelController enrichment + resize | ✅ |
| US-4 | panel.html redesign | ✅ |
| US-5 | Tests: formatTrayLabel + PanelController._enrichData | ✅ |

---

## Implementation Details

**US-1 — src/main/index.js**: Moved `SignalEngine.classifyMarketState()` call before `tray.update()` and `panel.update()` in `broadcast()`. Both now receive `marketState`. Expanded `onTogglePanel` callback to compute `marketState` inline before calling `panel.toggle()`. `widget.update()` unchanged.

**US-2 — src/main/tray.js**: Updated `formatPrice` (₿75K, no space), `formatMayer` (× prefix). Added `SIGNAL_BADGES` map and inline `fearLabelLocal`/`mayerLabelLocal` helpers. Added exported `formatTrayLabel(price, fearGreed, mayerMultiple, marketState)` pure function. Added `formatTooltip` for verbose tooltip format (`Bitcoin: $75,423 | Fear & Greed: 26 (Fear) | Mayer: ×0.89 (Fair Value)`). Updated `update()` to accept `marketState` and delegate to both functions.

**US-3 — src/main/panel.js**: Extended `_enrichData` signature with `marketState = null` default parameter; returns `marketState` in enriched object. Resized panel window from 280×200 to 300×260, adjusted position offsets accordingly.

**US-4 — src/renderer/panel.html**: Full rewrite. Signal banner at top with per-state background/text colors and badge+label text. Price row with `$` locale formatting. Fear & Greed and Mayer sections each have section label, animated `.bar-fill` inside `.bar-track`, and `.val-row` with value + zone label. CSS transitions: `width 0.4s ease` on bar fills, `color 0.3s ease` on value text. Mayer bar scales 0–2.5 (capped at 100%).

**US-5 — tests/**: Created `tests/TrayController.test.js` (11 tests for `formatTrayLabel`) and `tests/PanelController.test.js` (4 tests for `_enrichData`). Full suite: 76 tests, all passing.

---

## Files Changed

| File | Change |
|------|--------|
| `src/main/index.js` | Pass `marketState` to `tray.update()`, `panel.update()`; compute inline in `onTogglePanel` |
| `src/main/tray.js` | `formatPrice` (no space), `formatMayer` (× prefix), `formatTrayLabel` (new exported fn), `formatTooltip`, `SIGNAL_BADGES`, label helpers |
| `src/main/panel.js` | `_enrichData` accepts `marketState`; window 300×260 |
| `src/renderer/panel.html` | Full rewrite: signal banner, progress bars, CSS transitions |
| `tests/TrayController.test.js` | New: 11 tests for `formatTrayLabel` |
| `tests/PanelController.test.js` | New: 4 tests for `PanelController._enrichData` |
