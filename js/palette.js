// SNES/PS1 50-color palette (reduced from 64, removed middle shades)
const SNES_PALETTE = [
  // Row 1 - Dark colors (removed #4a4a4a - middle dark gray)
  '#000000',
  '#1a1a1a',
  '#2a2a2a',
  '#3a3a3a',
  '#5a5a5a',
  '#6a6a6a',
  '#7a7a7a',
  // Row 2 - Grays (removed #bababa - middle gray)
  '#8a8a8a',
  '#9a9a9a',
  '#aaaaaa',
  '#cacaca',
  '#dadada',
  '#eaeaea',
  '#ffffff',
  // Row 3 - Skin Tones (dark to light, vibrant/saturated)
  '#3a1209',
  '#602426',
  '#8b413c',
  '#bf592c',
  '#cd7323',
  '#f29b5d',
  '#fbc686',
  // Row 4 - Yellow (dark to light)
  '#4a4000',
  '#6b6000',
  '#8b8000',
  '#b0a000',
  '#d4c000',
  '#ffe000',
  '#ffff40',
  // Row 5 - Green (dark to light)
  '#004000',
  '#006000',
  '#008000',
  '#00a000',
  '#00c000',
  '#00ff00',
  '#40ff80',
  // Row 6 - Blue Green / Cyan (dark to light)
  '#004040',
  '#006060',
  '#008080',
  '#00a0a0',
  '#00c0c0',
  '#00ffff',
  '#40ffdf',
  // Row 7 - Blue (dark to light)
  '#000040',
  '#000060',
  '#000080',
  '#0000a0',
  '#0000c0',
  '#0000ff',
  '#4080ff',
  // Row 8 - Blue Violet (dark to light)
  '#200040',
  '#300060',
  '#400080',
  '#6000a0',
  '#8000c0',
  '#a000ff',
  '#c080ff',
  // Row 9 - Violet (dark to light)
  '#400040',
  '#600060',
  '#800080',
  '#a000a0',
  '#c000c0',
  '#ff00ff',
  '#ff80ff',
  // Row 10 - Red Violet / Magenta (dark to light)
  '#400020',
  '#600030',
  '#800040',
  '#a00060',
  '#c00080',
  '#ff00a0',
  '#ff80c0',
  // Row 11 - Red (dark to light)
  '#400000',
  '#600000',
  '#800000',
  '#a00000',
  '#c00000',
  '#ff0000',
  '#ff4040',
  // Row 12 - Red Orange (dark to light)
  '#400000',
  '#600000',
  '#800000',
  '#a02000',
  '#c04000',
  '#ff6000',
  '#ff8040',
  // Row 13 - Orange (dark to light)
  '#402000',
  '#603000',
  '#804000',
  '#a06000',
  '#c08000',
  '#ffa000',
  '#ffc040',
  // Row 14 - Yellow Orange (dark to light)
  '#4a3000',
  '#6b4000',
  '#8b5000',
  '#b07000',
  '#d49000',
  '#ffb000',
  '#ffd040'
];

class Palette {
  constructor() {
    this.currentColor = '#000000';
    this.selectedPaletteColor = null;
  }

  init() {
    this.renderPalette();
    this.setupEventListeners();
    this.updateCurrentColorDisplay();
  }

  renderPalette() {
    const paletteGrid = document.getElementById('paletteGrid');
    const paletteGridDesktop = document.getElementById('paletteGridDesktop');
    const grids = [paletteGrid, paletteGridDesktop].filter(Boolean);

    grids.forEach((grid) => {
      grid.innerHTML = '';
    });

    // Render SNES palette colors
    SNES_PALETTE.forEach((color, index) => {
      grids.forEach((grid) => {
        const colorDiv = document.createElement('div');
        colorDiv.className = 'palette-color';
        colorDiv.style.backgroundColor = color;
        colorDiv.dataset.index = index;
        colorDiv.dataset.type = 'snes';
        colorDiv.title = color;
        colorDiv.addEventListener('click', () => this.selectPaletteColor(index));
        grid.appendChild(colorDiv);
      });
    });
  }

  setupEventListeners() {
    // Event listeners are now handled in renderPalette
  }

  selectPaletteColor(index) {
    // Clear previous selections
    document.querySelectorAll('.palette-color').forEach((el) => el.classList.remove('selected'));

    this.selectedPaletteColor = index;
    this.currentColor = SNES_PALETTE[index];

    const colorDiv = document.querySelector(`.palette-color[data-index="${index}"]`);
    if (colorDiv) {
      colorDiv.classList.add('selected');
    }

    this.updateCurrentColorDisplay();

    // Highlight layer if it exists
    if (window.layers) {
      window.layers.highlightLayerByColor(this.currentColor);
    }

    // Auto-switch from eraser or clear to brush when selecting a color
    if ((window.currentTool === 'eraser' || window.currentTool === 'clear') && window.tools) {
      window.tools.selectTool('brush');
    }
  }

  updateCurrentColorDisplay() {
    const display = document.getElementById('currentColorDisplay');
    const displayTablet = document.getElementById('currentColorDisplayTablet');
    if (display) {
      display.style.backgroundColor = this.currentColor;
    }
    if (displayTablet) {
      displayTablet.style.backgroundColor = this.currentColor;
    }
  }

  getCurrentColor() {
    return this.currentColor;
  }

  setCurrentColor(color) {
    this.currentColor = color;
    this.updateCurrentColorDisplay();

    // Check if color matches a palette color and highlight it
    this.syncPaletteSelection(color);

    // Highlight layer if it exists
    if (window.layers) {
      window.layers.highlightLayerByColor(this.currentColor);
    }
  }

  // Find the nearest color in the palette using Euclidean distance in RGB space
  findNearestPaletteColor(hexColor) {
    // Convert hex to RGB
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
          }
        : null;
    };

    const targetRgb = hexToRgb(hexColor);
    if (!targetRgb) return null;

    let minDistance = Infinity;
    let nearestIndex = -1;

    SNES_PALETTE.forEach((paletteColor, index) => {
      const paletteRgb = hexToRgb(paletteColor);
      if (!paletteRgb) return;

      // Calculate Euclidean distance in RGB space
      const distance = Math.sqrt(
        Math.pow(targetRgb.r - paletteRgb.r, 2) +
          Math.pow(targetRgb.g - paletteRgb.g, 2) +
          Math.pow(targetRgb.b - paletteRgb.b, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = index;
      }
    });

    return nearestIndex !== -1 ? nearestIndex : null;
  }

  // Sync palette selection when a color is picked
  syncPaletteSelection(hexColor) {
    // Normalize hex color (ensure uppercase and # prefix)
    let normalizedColor = hexColor.toUpperCase();
    if (!normalizedColor.startsWith('#')) {
      normalizedColor = '#' + normalizedColor;
    }

    // Check if color exactly matches a palette color
    const exactIndex = SNES_PALETTE.findIndex((c) => c.toUpperCase() === normalizedColor);
    if (exactIndex !== -1) {
      // Exact match - highlight and use the palette color
      this.selectPaletteColor(exactIndex);
      return;
    }

    // No exact match - find nearest palette color and select it
    const nearestIndex = this.findNearestPaletteColor(normalizedColor);
    if (nearestIndex !== null) {
      // Select the nearest palette color (this will set currentColor to the palette color)
      this.selectPaletteColor(nearestIndex);
    } else {
      // No palette color found (shouldn't happen, but handle it)
      document.querySelectorAll('.palette-color').forEach((el) => el.classList.remove('selected'));
      this.selectedPaletteColor = null;
      this.currentColor = hexColor;
      this.updateCurrentColorDisplay();
      // Highlight layer if it exists
      if (window.layers) {
        window.layers.highlightLayerByColor(this.currentColor);
      }
    }
  }

  selectColorByHex(hexColor) {
    // Use syncPaletteSelection to handle palette matching and nearest color selection
    this.syncPaletteSelection(hexColor);

    // Auto-switch from eraser or clear to brush when selecting a color
    if ((window.currentTool === 'eraser' || window.currentTool === 'clear') && window.tools) {
      window.tools.selectTool('brush');
    }
  }
}

const palette = new Palette();
window.palette = palette;
// Make SNES_PALETTE globally accessible for trace functionality
window.SNES_PALETTE = SNES_PALETTE;
