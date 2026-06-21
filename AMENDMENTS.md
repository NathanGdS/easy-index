# Amendments

## Amendment 1 -- 2026-06-21
**Article(s):** CONST-001, CONST-002, CONST-003, CONST-004, CONST-005, CONST-006, CONST-007, CONST-008, CONST-009
**Scope:** global rule change (documentation completeness, not a behavior change)
**Before:** Articles had no "Implemented in" pointer field. Forbidden Patterns table had a `Pattern`/`Violates` column only, no `File scope (glob)` / `Pattern (regex)` columns, so the `constitution-keeper` guard hook could not pattern-match violations automatically. `AMENDMENTS.md` did not exist.
**After:** Each article now carries an "Implemented in" pointer to the file(s) that demonstrate it. The Forbidden Patterns table gained `File scope (glob)` and `Pattern (regex)` columns so the guard hook can detect violations on file edits. Rows that are judgment calls rather than regex-expressible rules (the CONST-005/CONST-006 boundary between orchestrator wiring and business logic) were intentionally left without a table row -- they stay reasoning-layer-only, per `constitution-keeper`'s own rule against inventing regexes for nuanced calls. `AMENDMENTS.md` created as the log this hook requires.
**Rationale:** `CONSTITUTION.md` predates the `hyked-constitution` plugin install and didn't match the plugin's expected template. This brings it up to spec so the guard hook can actually enforce. No rule semantics changed.
**Author:** Nathan (via constitution-init gap-fill session)

## Amendment 2 -- 2026-06-21
**Article(s):** CONST-010
**Scope:** global rule change
**Before:** "UI Controller Test Coverage Is a Gap" -- stated `TrayController`/`PanelController`/`WidgetController` had no test coverage, framed as an unintentional gap, not policy.
**After:** "UI Controller Test Coverage" -- coverage is now required and exists: `tests/TrayController.test.js`, `tests/PanelController.test.js`, `tests/WidgetController.test.js` (31 tests, verified passing). Gap closed.
**Rationale:** The repo now has real passing controller test suites; the old article misstated current state.
**Author:** Nathan (via constitution-init gap-fill session)
