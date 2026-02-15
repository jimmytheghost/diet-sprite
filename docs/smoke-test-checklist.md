# Diet Sprite 4.1 Smoke Test Checklist

Use this checklist after refactors to quickly verify critical user flows.

## 0) Preflight

- [ ] Run `npm run smoke:quick`
- [ ] Start app (`npm run serve`) and open the editor in browser

## 1) Save/Load JSON

- [ ] Draw a few pixels using at least 2-3 colors
- [ ] Toggle one layer visibility off, keep others on
- [ ] Import a background image and set non-default opacity / transform (move / scale / rotate)
- [ ] Save project as JSON
- [ ] Create a new project, then load the saved JSON
- [ ] Verify:
  - [ ] Grid dimensions and pixel data restored
  - [ ] Layer visibility restored
  - [ ] Background image + transform + opacity restored
  - [ ] Current color restored

## 2) SVG Import (with and without background elements)

- [ ] Load a simple pixel-only SVG
- [ ] Verify pixels import cleanly and grid size is set correctly
- [ ] Load a more complex SVG that includes non-pixel/background elements
- [ ] Verify background elements import into background layer and pixel cells still map correctly
- [ ] Verify trace/paint/edit remains functional after SVG import

## 3) Export Scenarios

- [ ] Export PNG with transparent background
- [ ] Export PNG with non-transparent background option
- [ ] Export SVG (Canvas Size)
- [ ] Export SVG (Image Size)
- [ ] Export JSON
- [ ] Export ALL (PNG + SVG + JSON)
- [ ] Verify generated files are valid and open correctly

## 4) Modal/UI Sanity

- [ ] Confirm key modals open/close correctly:
  - [ ] New Project confirmation
  - [ ] Save Project modal
  - [ ] Export background choice modal
  - [ ] SVG size modal
  - [ ] Export All modal
  - [ ] Layer clear confirmation
  - [ ] Color picker modal
- [ ] Check keyboard behavior where applicable:
  - [ ] Escape closes modal
  - [ ] Enter confirms when intended
  - [ ] Tab/Shift+Tab focus cycles predictably
- [ ] Quick interaction sanity:
  - [ ] Zoom in/out and custom zoom input
  - [ ] Pan (buttons / drag gestures)
  - [ ] Layer visibility toggles

## 5) Final Pass

- [ ] Run `npm run smoke:quick` one more time
- [ ] If failures occur, fix and repeat this checklist
