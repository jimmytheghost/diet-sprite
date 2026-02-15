Diet Sprite 4.1 Cleanup

Use this as the master checklist for the next cleanup cycle.

## Global Progress

- [x] 1. Reduce `window.*` globals via context/accessor migration
- [x] 2. Split `save-load.js` SVG pipeline into focused helpers
- [x] 3. Centralize project JSON schema/serialization logic
- [x] 4. Standardize all modal flows through `ModalUtils`
- [x] 5. Add repeatable smoke-test checklist (or script)

---

## 1) Reduce `window.*` globals via context/accessor migration

**Goal:** lower coupling and make modules easier to reason about/test.

- [x] 1.1 Inventory major global usage hotspots (`grid.js`, `export.js`, `background.js`, `layers.js`, `tools.js`)
- [x] 1.2 Add missing getters/setters in `app-context.js` only when needed
- [x] 1.3 Add local accessor helpers per module (`getGrid()`, `getLayers()`, etc.)
- [x] 1.4 Migrate read paths first (lowest risk), then write paths
- [x] 1.5 Keep behavior identical; no feature changes during migration
- [x] 1.6 Lint + quick smoke check after each module migration

**Done when:** core modules no longer directly depend on most `window.*` references.

---

## 2) Split `save-load.js` SVG pipeline into focused helpers

**Goal:** reduce file complexity and isolate responsibilities.

- [x] 2.1 Extract SVG parsing/normalization step helpers
- [x] 2.2 Extract pixel-vs-background element classification
- [x] 2.3 Extract imported state application (grid/layers/background/settings)
- [x] 2.4 Keep existing SaveLoad public behavior and call paths stable
- [x] 2.5 Remove now-dead inlined code after validation
- [x] 2.6 Lint + SVG import smoke test (simple + complex SVG)

**Done when:** `loadSVG()` orchestrates smaller functions instead of containing most logic inline.

---

## 3) Centralize project JSON schema/serialization logic

**Goal:** avoid schema drift between Save/Load/Export paths.

- [x] 3.1 Define one canonical project schema module (fields + defaults)
- [x] 3.2 Create shared serializer (app state -> project JSON)
- [x] 3.3 Create shared deserializer/normalizer (JSON -> safe app state)
- [x] 3.4 Update save/export/load code paths to use shared schema utilities
- [x] 3.5 Add version compatibility guards/fallback defaults
- [x] 3.6 Lint + load/save/export round-trip verification

**Done when:** one source of truth is used by all JSON-related workflows.

---

## 4) Standardize all modal flows through `ModalUtils`

**Goal:** consistent keyboard/focus/close behavior and less duplicated modal logic.

- [x] 4.1 Inventory modals still using ad-hoc event wiring
- [x] 4.2 Migrate each modal to `ModalUtils.create(...)`
- [x] 4.3 Ensure Enter/Escape/Tab behavior is consistent per modal intent
- [x] 4.4 Remove legacy fallback/duplicate modal code paths that are no longer needed
- [x] 4.5 Validate accessibility basics (focus trap, visible focus, predictable close)
- [x] 4.6 Lint + manual modal flow pass

**Done when:** all major modals share one consistent implementation approach.

---

## 5) Add repeatable smoke-test checklist (or script)

**Goal:** faster confidence checks after every refactor.

- [x] 5.1 Create `docs` checklist for critical user flows
- [x] 5.2 Include save/load JSON and SVG import scenarios (with/without background elements)
- [x] 5.3 Include export scenarios (PNG/SVG/JSON)
- [x] 5.4 Include quick UI sanity checks (modals, zoom/pan, layer visibility)
- [x] 5.5 Optionally add a simple npm script alias for routine checks
- [x] 5.6 Run checklist once end-to-end and adjust steps for clarity

**Done when:** anyone can run a short, reliable post-refactor verification pass.

---

## Session Notes

- [x] Record branch name used for cleanup work
- [x] Record commit hashes per completed milestone
- [x] Record any deferred ideas (explicitly out of scope)

### Session Entries

- Branch: `main`
- Commit at start of cleanup cycle updates: `c4e4a78`
- Milestone refs:
  - M1 globals/context migration + modal standardization + save/load/export schema wiring (working tree)
  - M2 SVG load pipeline helper split in `save-load.js` (working tree)
  - M3 smoke checklist + npm alias (`docs/smoke-test-checklist.md`, `smoke:quick`) (working tree)
- Deferred / out of scope:
  - Full `window.*` migration of `app.js` history/pan/zoom internals remains for a future cleanup pass
