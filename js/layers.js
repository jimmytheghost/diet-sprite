class Layers {
  constructor() {
    this.layers = new Map(); // color -> { visible: true, count: 0 }
    this.currentLayerColor = null; // Color being changed
    this.isChangingBackground = false; // Flag for background color change
    this.isChangingGridColor = false; // Flag for grid color change
    this.selectedPaletteColorForLayer = null; // Selected palette color in modal
    this.highlightedLayerColor = null; // Currently highlighted layer color
    this.init();
  }

  init() {
    this.setupColorPickerModal();
    this.setupBackgroundColorButton();
    this.setupConfirmClearModal();
    this.renderLayers();
  }

  setupConfirmClearModal() {
    const modal = document.getElementById('confirmClearModal');

    this.pendingClearColor = null;

    if (window.ModalUtils) {
      this.confirmClearModal = window.ModalUtils.create({
        modalId: 'confirmClearModal',
        closeIds: ['confirmClearClose'],
        cancelIds: ['confirmClearCancel'],
        confirmId: 'confirmClearConfirm',
        trapFocusIds: ['confirmClearConfirm', 'confirmClearCancel', 'confirmClearClose'],
        enterConfirms: true,
        onClose: () => {
          this.pendingClearColor = null;
        },
        onConfirm: () => {
          if (this.pendingClearColor) {
            this.clearLayer(this.pendingClearColor);
          }
          return true;
        }
      });
      return;
    }

    const closeBtn = document.getElementById('confirmClearClose');
    const cancelBtn = document.getElementById('confirmClearCancel');
    const confirmBtn = document.getElementById('confirmClearConfirm');

    const closeModal = () => {
      modal.style.display = 'none';
      this.pendingClearColor = null;
    };

    closeBtn.addEventListener('click', () => {
      closeModal();
    });
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    confirmBtn.addEventListener('click', () => {
      if (this.pendingClearColor) {
        this.clearLayer(this.pendingClearColor);
      }
      closeModal();
    });

    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display !== 'none') {
        closeModal();
      }
    });
  }

  showConfirmClear(color) {
    const messageEl = document.getElementById('confirmClearMessage');

    this.pendingClearColor = color;
    messageEl.textContent = `Are you sure you want to clear all pixels of color ${color.toUpperCase()}?`;

    if (this.confirmClearModal) {
      this.confirmClearModal.open();
      return;
    }

    const modal = document.getElementById('confirmClearModal');
    modal.style.display = 'flex';
  }

  setupBackgroundColorButton() {
    const bgColorBtn = document.getElementById('changeBgColorBtn');
    if (bgColorBtn) {
      bgColorBtn.addEventListener('click', () => {
        const currentBgColor = window.grid?.backgroundColor || '#ffffff';
        this.openColorPickerForBackground(currentBgColor);
      });
    }
  }

  setupColorPickerModal() {
    const modal = document.getElementById('colorPickerModal');
    const colorPicker = document.getElementById('layerColorPicker');
    const newColorPreview = document.getElementById('newColorPreview');
    const closeBtn = document.getElementById('colorPickerClose');
    const cancelBtn = document.getElementById('colorPickerCancel');
    const applyBtn = document.getElementById('colorPickerApply');

    // Update preview when color changes
    colorPicker.addEventListener('input', (e) => {
      newColorPreview.style.backgroundColor = e.target.value;
    });

    // Close modal handlers
    const closeModal = (applyColor = false) => {
      // Auto-apply the selected color when closing (for background and grid)
      if (applyColor) {
        let newColor;

        // Use selected palette color if available (for background), otherwise use color picker
        if (this.isChangingBackground && this.selectedPaletteColorForLayer !== null) {
          newColor = window.SNES_PALETTE[this.selectedPaletteColorForLayer];
        } else {
          newColor = colorPicker.value;
        }

        if (this.isChangingBackground) {
          // Apply background color
          this.changeBackgroundColor(newColor);
        } else if (this.isChangingGridColor) {
          // Apply grid color
          if (window.grid) {
            window.grid.setGridColor(newColor);
          }
        }
      }

      modal.style.display = 'none';
      this.currentLayerColor = null;
      this.isChangingBackground = false;
      this.isChangingGridColor = false;
      this.selectedPaletteColorForLayer = null;
    };

    closeBtn.addEventListener('click', () => {
      // Auto-apply color when closing (for background and grid)
      const shouldApply = this.isChangingBackground || this.isChangingGridColor;
      closeModal(shouldApply);
    });
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        // Auto-apply color when clicking outside (for background and grid)
        const shouldApply = this.isChangingBackground || this.isChangingGridColor;
        closeModal(shouldApply);
      }
    });

    // Apply color change
    applyBtn.addEventListener('click', () => {
      let newColor;

      // For layer color changes and background color changes, use selected palette color if available; otherwise use color picker
      if (
        (this.currentLayerColor || this.isChangingBackground) &&
        this.selectedPaletteColorForLayer !== null
      ) {
        newColor = window.SNES_PALETTE[this.selectedPaletteColorForLayer];
      } else {
        newColor = colorPicker.value;
      }

      if (this.isChangingGridColor) {
        // Change grid color
        if (window.grid) {
          window.grid.setGridColor(newColor);
        }
      } else if (this.isChangingBackground) {
        // Change background color
        this.changeBackgroundColor(newColor);
      } else if (this.currentLayerColor) {
        // Change layer color
        if (newColor !== this.currentLayerColor) {
          this.changeLayerColor(this.currentLayerColor, newColor);
          // Update main palette to select the new color
          if (window.palette) {
            window.palette.selectColorByHex(newColor);
          }
        }
      }
      closeModal();
    });

    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display !== 'none') {
        // Auto-apply color when pressing ESC (for background and grid)
        const shouldApply = this.isChangingBackground || this.isChangingGridColor;
        closeModal(shouldApply);
      }
    });

    // Quick-select color buttons (for background color only)
    const quickSelectColors = document.getElementById('quickSelectColors');
    const quickSelectButtons = quickSelectColors.querySelectorAll('.quick-select-btn');
    quickSelectButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const color = btn.dataset.color;
        colorPicker.value = color;
        newColorPreview.style.backgroundColor = color;
      });
    });
  }

  openColorPicker(color) {
    const modal = document.getElementById('colorPickerModal');
    const colorPicker = document.getElementById('layerColorPicker');
    const paletteGrid = document.getElementById('layerColorPaletteGrid');
    const oldColorPreview = document.getElementById('oldColorPreview');
    const newColorPreview = document.getElementById('newColorPreview');
    const modalTitle = modal.querySelector('.color-picker-header h3');
    const quickSelectColors = document.getElementById('quickSelectColors');

    this.currentLayerColor = color;
    this.isChangingBackground = false;
    this.isChangingGridColor = false;
    this.selectedPaletteColorForLayer = null;

    // Hide color picker input, show palette grid
    colorPicker.style.display = 'none';
    paletteGrid.style.display = 'flex';
    paletteGrid.style.flexDirection = 'row';
    paletteGrid.style.gap = '10px';
    paletteGrid.style.width = '100%';
    paletteGrid.style.maxWidth = '500px';
    paletteGrid.style.margin = '0 auto';
    paletteGrid.style.alignItems = 'flex-start';

    // Render palette grid with two side-by-side sections
    paletteGrid.innerHTML = '';
    if (!window.SNES_PALETTE) {
      console.error('SNES_PALETTE not available');
      return;
    }

    // Create left section (rows 1-7, indices 0-48)
    const leftSection = document.createElement('div');
    leftSection.style.display = 'grid';
    leftSection.style.gridTemplateColumns = 'repeat(7, 1fr)';
    leftSection.style.gap = '4px';
    leftSection.style.flex = '1';

    // Create right section (rows 8-14, indices 49-98)
    const rightSection = document.createElement('div');
    rightSection.style.display = 'grid';
    rightSection.style.gridTemplateColumns = 'repeat(7, 1fr)';
    rightSection.style.gap = '4px';
    rightSection.style.flex = '1';

    window.SNES_PALETTE.forEach((paletteColor, index) => {
      const colorDiv = document.createElement('div');
      colorDiv.className = 'palette-color';
      colorDiv.style.backgroundColor = paletteColor;
      colorDiv.style.minWidth = '20px';
      colorDiv.style.minHeight = '20px';
      colorDiv.dataset.index = index;
      colorDiv.title = paletteColor;

      // Highlight if this is the current color
      if (paletteColor.toLowerCase() === color.toLowerCase()) {
        colorDiv.classList.add('selected');
        this.selectedPaletteColorForLayer = index;
      }

      // Handle palette color selection
      colorDiv.addEventListener('click', () => {
        // Clear previous selections
        paletteGrid
          .querySelectorAll('.palette-color')
          .forEach((el) => el.classList.remove('selected'));
        // Select this color
        colorDiv.classList.add('selected');
        this.selectedPaletteColorForLayer = index;
        const selectedColor = window.SNES_PALETTE[index];
        newColorPreview.style.backgroundColor = selectedColor;
      });

      // Add to left section (rows 1-7) or right section (rows 8-14)
      if (index <= 48) {
        leftSection.appendChild(colorDiv);
      } else {
        rightSection.appendChild(colorDiv);
      }
    });

    paletteGrid.appendChild(leftSection);
    paletteGrid.appendChild(rightSection);

    colorPicker.value = color;
    oldColorPreview.style.backgroundColor = color;
    newColorPreview.style.backgroundColor = color;
    modalTitle.textContent = 'Change Layer Color';
    quickSelectColors.style.display = 'none'; // Hide quick-select for layer colors
    modal.style.display = 'flex';
  }

  openColorPickerForBackground(color) {
    const modal = document.getElementById('colorPickerModal');
    const colorPicker = document.getElementById('layerColorPicker');
    const paletteGrid = document.getElementById('layerColorPaletteGrid');
    const oldColorPreview = document.getElementById('oldColorPreview');
    const newColorPreview = document.getElementById('newColorPreview');
    const modalTitle = modal.querySelector('.color-picker-header h3');
    const quickSelectColors = document.getElementById('quickSelectColors');

    this.currentLayerColor = null;
    this.isChangingBackground = true;
    this.isChangingGridColor = false;
    this.selectedPaletteColorForLayer = null;

    // Hide color picker input, show palette grid (background now uses palette like layer colors)
    colorPicker.style.display = 'none';
    paletteGrid.style.display = 'flex';
    paletteGrid.style.flexDirection = 'row';
    paletteGrid.style.gap = '10px';
    paletteGrid.style.width = '100%';
    paletteGrid.style.maxWidth = '500px';
    paletteGrid.style.margin = '0 auto';
    paletteGrid.style.alignItems = 'flex-start';

    // Render palette grid with two side-by-side sections
    paletteGrid.innerHTML = '';
    if (!window.SNES_PALETTE) {
      console.error('SNES_PALETTE not available');
      return;
    }

    // Create left section (rows 1-7, indices 0-48)
    const leftSection = document.createElement('div');
    leftSection.style.display = 'grid';
    leftSection.style.gridTemplateColumns = 'repeat(7, 1fr)';
    leftSection.style.gap = '4px';
    leftSection.style.flex = '1';

    // Create right section (rows 8-14, indices 49-98)
    const rightSection = document.createElement('div');
    rightSection.style.display = 'grid';
    rightSection.style.gridTemplateColumns = 'repeat(7, 1fr)';
    rightSection.style.gap = '4px';
    rightSection.style.flex = '1';

    window.SNES_PALETTE.forEach((paletteColor, index) => {
      const colorDiv = document.createElement('div');
      colorDiv.className = 'palette-color';
      colorDiv.style.backgroundColor = paletteColor;
      colorDiv.style.minWidth = '20px';
      colorDiv.style.minHeight = '20px';
      colorDiv.dataset.index = index;
      colorDiv.title = paletteColor;

      // Highlight if this is the current background color
      if (paletteColor.toLowerCase() === color.toLowerCase()) {
        colorDiv.classList.add('selected');
        this.selectedPaletteColorForLayer = index;
      }

      // Handle palette color selection
      colorDiv.addEventListener('click', () => {
        // Clear previous selections
        paletteGrid
          .querySelectorAll('.palette-color')
          .forEach((el) => el.classList.remove('selected'));
        // Select this color
        colorDiv.classList.add('selected');
        this.selectedPaletteColorForLayer = index;
        const selectedColor = window.SNES_PALETTE[index];
        newColorPreview.style.backgroundColor = selectedColor;
      });

      // Add to left section (rows 1-7) or right section (rows 8-14)
      if (index <= 48) {
        leftSection.appendChild(colorDiv);
      } else {
        rightSection.appendChild(colorDiv);
      }
    });

    paletteGrid.appendChild(leftSection);
    paletteGrid.appendChild(rightSection);

    colorPicker.value = color;
    oldColorPreview.style.backgroundColor = color;
    newColorPreview.style.backgroundColor = color;
    modalTitle.textContent = 'Change Background Color';
    quickSelectColors.style.display = 'none'; // Hide quick-select for background color (now uses palette)
    modal.style.display = 'flex';
  }

  openColorPickerForGrid(color) {
    const modal = document.getElementById('colorPickerModal');
    const colorPicker = document.getElementById('layerColorPicker');
    const paletteGrid = document.getElementById('layerColorPaletteGrid');
    const oldColorPreview = document.getElementById('oldColorPreview');
    const newColorPreview = document.getElementById('newColorPreview');
    const modalTitle = modal.querySelector('.color-picker-header h3');
    const quickSelectColors = document.getElementById('quickSelectColors');

    this.currentLayerColor = null;
    this.isChangingBackground = false;
    this.isChangingGridColor = true;
    this.selectedPaletteColorForLayer = null;

    // Show color picker input, hide palette grid (grid uses color picker)
    colorPicker.style.display = 'block';
    paletteGrid.style.display = 'none';

    colorPicker.value = color;
    oldColorPreview.style.backgroundColor = color;
    newColorPreview.style.backgroundColor = color;
    modalTitle.textContent = 'Change Grid Color';
    quickSelectColors.style.display = 'none'; // Hide quick-select for grid color
    modal.style.display = 'flex';
  }

  changeBackgroundColor(newColor) {
    if (!window.grid) return;

    const oldColor = window.grid.backgroundColor || '#ffffff';

    // Store in history
    window.historyManager?.addAction({
      type: 'changeBackgroundColor',
      oldColor: oldColor,
      newColor: newColor
    });

    // Update grid background color
    window.grid.backgroundColor = newColor;
    window.grid.updateBackgroundColor();
  }

  addColor(color) {
    if (!color) return; // Skip transparent/null colors

    if (!this.layers.has(color)) {
      this.layers.set(color, {
        visible: true,
        count: 0
      });
      this.renderLayers();
      // Highlight the layer if it matches the current color
      this.highlightLayerByColor(color);
    }
  }

  updateColorCount(color, delta) {
    if (!color) return;

    if (this.layers.has(color)) {
      const layer = this.layers.get(color);
      layer.count += delta;

      // Remove layer if count reaches 0
      if (layer.count <= 0) {
        this.layers.delete(color);
        // Clear highlight if this was the highlighted layer
        if (this.highlightedLayerColor === color) {
          this.clearHighlight();
        }
      }

      this.renderLayers();
    }
  }

  setColorCount(color, count) {
    if (!color) return;

    if (count > 0) {
      if (!this.layers.has(color)) {
        this.layers.set(color, {
          visible: true,
          count: 0
        });
      }
      this.layers.get(color).count = count;
    } else {
      this.layers.delete(color);
    }

    this.renderLayers();
  }

  toggleVisibility(color) {
    if (!this.layers.has(color)) return;

    const layer = this.layers.get(color);
    layer.visible = !layer.visible;
    this.renderLayers();

    // Redraw grid to reflect visibility change
    if (window.grid) {
      window.grid.draw();
    }
  }

  clearLayer(color) {
    if (!this.layers.has(color)) return;

    // Clear all pixels of this color
    if (window.grid) {
      const pixels = window.grid.getPixelData();
      const clearedPixels = [];
      const gridWidth = window.grid.width;
      const gridHeight = window.grid.height;

      for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
          if (pixels[y][x] === color) {
            clearedPixels.push({ x, y, color: pixels[y][x] });
            pixels[y][x] = null;
          }
        }
      }

      if (clearedPixels.length > 0) {
        window.historyManager?.addAction({
          type: 'clearLayer',
          color: color,
          cleared: clearedPixels.length,
          clearedPixels: clearedPixels
        });

        window.grid.setPixelData(pixels);
        this.layers.delete(color);
        this.renderLayers();
      }
    }
  }

  isVisible(color) {
    if (!color) return true; // Transparent is always "visible"
    if (!this.layers.has(color)) return true;
    return this.layers.get(color).visible;
  }

  getAllLayers() {
    return Array.from(this.layers.entries()).map(([color, data]) => ({
      color,
      ...data
    }));
  }

  rebuildLayers() {
    // Clear existing layers
    this.layers.clear();

    // Rebuild from current pixel data
    if (window.grid) {
      const pixels = window.grid.getPixelData();
      const gridWidth = window.grid.width;
      const gridHeight = window.grid.height;

      // Count pixels by color
      const colorCounts = new Map();
      for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
          const color = pixels[y][x];
          if (color) {
            colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
          }
        }
      }

      // Add layers with correct counts
      colorCounts.forEach((count, color) => {
        this.layers.set(color, {
          visible: true,
          count: count
        });
      });
    }

    // Re-render layers panel
    this.renderLayers();
  }

  renderLayers() {
    const layersList = document.getElementById('layersList');
    if (!layersList) return;

    layersList.innerHTML = '';

    if (this.layers.size === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'section-title';
      emptyMsg.style.textAlign = 'center';
      emptyMsg.style.padding = '20px';
      emptyMsg.style.opacity = '0.5';
      emptyMsg.textContent = 'No layers yet';
      layersList.appendChild(emptyMsg);
      return;
    }

    // Sort layers by color (hex value) for consistent ordering
    const sortedLayers = Array.from(this.layers.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    sortedLayers.forEach(([color, data]) => {
      const layerItem = document.createElement('div');
      layerItem.className = 'layer-item';
      layerItem.dataset.color = color; // Store color for easy lookup
      if (!data.visible) {
        layerItem.classList.add('hidden');
      }
      // Highlight if this is the currently selected color
      if (this.highlightedLayerColor === color) {
        layerItem.classList.add('active');
      }

      // Add click handler to layer item to select the color
      layerItem.addEventListener('click', (e) => {
        // Don't trigger if clicking on buttons or color thumbnail
        if (!e.target.closest('.layer-btn') && !e.target.closest('.layer-color')) {
          if (window.palette) {
            window.palette.selectColorByHex(color);
          }
        }
      });

      const colorDiv = document.createElement('div');
      colorDiv.className = 'layer-color';
      colorDiv.style.backgroundColor = color;
      colorDiv.style.cursor = 'pointer';
      colorDiv.title = 'Click to change color';

      colorDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openColorPicker(color);
      });

      const infoDiv = document.createElement('div');
      infoDiv.className = 'layer-info';

      const nameDiv = document.createElement('div');
      nameDiv.className = 'layer-name';
      nameDiv.textContent = color.toUpperCase();
      nameDiv.title = color;

      const countDiv = document.createElement('div');
      countDiv.className = 'layer-count';
      countDiv.textContent = `${data.count} pixels`;

      infoDiv.appendChild(nameDiv);
      infoDiv.appendChild(countDiv);

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'layer-actions';

      const eyeBtn = document.createElement('button');
      eyeBtn.className = 'layer-btn';
      eyeBtn.title = data.visible ? 'Hide layer' : 'Show layer';
      const eyeIcon = document.createElement('span');
      eyeIcon.className = 'material-icons';
      eyeIcon.textContent = data.visible ? 'visibility' : 'visibility_off';
      eyeBtn.appendChild(eyeIcon);
      eyeBtn.onclick = (e) => {
        e.stopPropagation();
        this.toggleVisibility(color);
      };

      const clearBtn = document.createElement('button');
      clearBtn.className = 'layer-btn clear-btn';
      clearBtn.title = 'Clear layer';
      const clearIcon = document.createElement('span');
      clearIcon.className = 'material-icons';
      clearIcon.textContent = 'close';
      clearBtn.appendChild(clearIcon);
      clearBtn.onclick = (e) => {
        e.stopPropagation();
        this.showConfirmClear(color);
      };

      actionsDiv.appendChild(eyeBtn);
      actionsDiv.appendChild(clearBtn);

      layerItem.appendChild(colorDiv);
      layerItem.appendChild(infoDiv);
      layerItem.appendChild(actionsDiv);

      layersList.appendChild(layerItem);
    });
  }

  highlightLayerByColor(color) {
    // Only highlight if the color exists as a layer
    if (!color || !this.layers.has(color)) {
      // If color doesn't exist as a layer, clear highlight
      this.clearHighlight();
      return;
    }

    // Clear previous highlight
    this.clearHighlight();

    // Set new highlight
    this.highlightedLayerColor = color;

    // Apply highlight to the layer item
    const layerItem = document.querySelector(`.layer-item[data-color="${color}"]`);
    if (layerItem) {
      layerItem.classList.add('active');
    }
  }

  clearHighlight() {
    // Remove highlight from all layer items
    document.querySelectorAll('.layer-item.active').forEach((item) => {
      item.classList.remove('active');
    });
    this.highlightedLayerColor = null;
  }

  changeLayerColor(oldColor, newColor) {
    if (!window.grid) return;

    const pixels = window.grid.getPixelData();
    const changes = [];
    let changed = false;
    const gridWidth = window.grid.width;
    const gridHeight = window.grid.height;

    // Change all pixels of old color to new color
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        if (pixels[y][x] === oldColor) {
          changes.push({ x, y, oldColor: oldColor, newColor: newColor });
          pixels[y][x] = newColor;
          changed = true;
        }
      }
    }

    if (changed && changes.length > 0) {
      // Add to history
      window.historyManager?.addAction({
        type: 'changeLayerColor',
        oldColor: oldColor,
        newColor: newColor,
        changes: changes
      });

      // Update layers before setting pixel data
      if (this.layers.has(oldColor)) {
        const layerData = this.layers.get(oldColor);
        this.layers.delete(oldColor);
        this.layers.set(newColor, layerData);
      }

      // Update grid pixels directly (don't use setPixelData to avoid double rescan)
      window.grid.pixels = pixels;
      window.grid.draw();
      this.renderLayers();
    }
  }

  scanPixels() {
    // Scan all pixels and update layer counts
    if (!window.grid) return;

    const pixels = window.grid.getPixelData();
    if (!pixels || !Array.isArray(pixels) || pixels.length === 0) {
      console.warn('scanPixels: Invalid pixels data');
      return;
    }

    const colorCounts = new Map();
    const gridWidth = window.grid.width;
    const gridHeight = window.grid.height;

    // Count pixels by color
    for (let y = 0; y < gridHeight; y++) {
      if (!pixels[y] || !Array.isArray(pixels[y])) {
        console.warn(`scanPixels: Invalid row ${y} in pixels array`);
        continue;
      }
      for (let x = 0; x < gridWidth; x++) {
        const color = pixels[y][x];
        if (color) {
          colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
        }
      }
    }

    // Preserve visibility settings when rescanning
    const visibilityMap = new Map();
    this.layers.forEach((data, color) => {
      visibilityMap.set(color, data.visible);
    });

    // Update layers
    this.layers.clear();
    colorCounts.forEach((count, color) => {
      this.layers.set(color, {
        visible: visibilityMap.has(color) ? visibilityMap.get(color) : true,
        count: count
      });
    });

    this.renderLayers();
  }
}

const layers = new Layers();
window.layers = layers;
