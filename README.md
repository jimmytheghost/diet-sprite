# Diet Sprite | Pixel Art Editor

**Version:** 3.4.2  
**Status:** Production-ready

Diet Sprite is a browser-based pixel art editor with a retro SNES/PS1-inspired workflow. It is built with plain HTML/CSS/JavaScript (no framework), optimized for desktop + iPad/touch use, and designed around fast color-based editing.

---

## Quick Start

### Run locally

From this project folder:

```bash
./launch.command
```

This starts a local HTTP server at:

- `http://localhost:8550/index.html`

### Stop server

In the terminal running the script, press `Ctrl+C`.

---

## Current Project Layout

This repo uses a **flat root structure**:

```
.
├── index.html
├── styles.css
├── launch.command
├── README.md
├── js/
│   ├── app.js
│   ├── background.js
│   ├── canvas-size-modal.js
│   ├── export.js
│   ├── grid.js
│   ├── layers.js
│   ├── palette.js
│   ├── ruler.js
│   ├── save-load.js
│   └── tools.js
```

---

## Core Features

- Drawing tools: Brush, Eraser, Fill, Eyedropper, Clear
- Dynamic canvas sizing (8–1024 px, multiple aspect ratio presets)
- SNES/PS1 palette + custom color support
- Color-based layers (each color acts like a togglable layer)
- Background image import with transform controls (move/scale/rotate)
- Background image visibility toggle + opacity controls
- Trace background image into pixel art (with progress + cancel)
- Unlimited undo/redo
- Zoom + pan controls (buttons, slider, gesture-friendly behavior)
- Save/load project JSON (with backward compatibility for older saves)
- SVG loading support and multi-format export (PNG/SVG/JSON + export-all flow)
- Ruler guides and grid visibility/color controls
- Strong touch/iPad support throughout UI

---

## Architecture Overview

- `js/app.js` – app bootstrap, undo/redo history, zoom/pan, keyboard shortcuts, UI wiring
- `js/grid.js` – pixel matrix, drawing/fill logic, rendering, trace pipeline
- `js/layers.js` – color-layer visibility + layer operations
- `js/background.js` – background image lifecycle + transforms
- `js/palette.js` – palette rendering + color selection/sync
- `js/tools.js` – active tool state + clear-canvas modal flow
- `js/save-load.js` – JSON/SVG import/export of project state
- `js/export.js` – export options and output generation
- `js/ruler.js` – ruler guide overlay behavior
- `js/canvas-size-modal.js` – startup/project resize modal

---

## Technology Stack

- HTML5 + CSS3
- Vanilla JavaScript (ES6+)
- HTML5 Canvas APIs
- Local Python HTTP server (via `launch.command`)

---

## Notes

- Designed for pixel-perfect rendering with canvas resolution scaling.
- Optimized for touch and Apple Pencil workflows as well as desktop input.
- Internal/planning documentation has been separated from this public-ready project snapshot.
