class SaveLoad {
  constructor() {
    // Wait for DOM to be ready before initializing
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      // DOM is already loaded
      this.init();
    }
  }

  showStatusMessage(message, type = 'info', duration = 3500) {
    let container = document.getElementById('saveLoadStatusContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'saveLoadStatusContainer';
      container.style.position = 'fixed';
      container.style.top = '16px';
      container.style.right = '16px';
      container.style.zIndex = '12000';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '8px';
      container.style.pointerEvents = 'none';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.padding = '10px 12px';
    toast.style.fontFamily = "'Tiny5', monospace";
    toast.style.fontSize = '12px';
    toast.style.border = '2px solid #333';
    toast.style.background = '#111';
    toast.style.color = '#fff';
    toast.style.boxShadow = '0 0 10px rgba(0,0,0,0.35)';
    toast.style.maxWidth = '360px';
    toast.style.pointerEvents = 'auto';

    if (type === 'error') {
      toast.style.borderColor = '#ff6b6b';
      toast.style.color = '#ffb3b3';
    } else if (type === 'success') {
      toast.style.borderColor = '#00ff41';
      toast.style.color = '#b8ffd1';
    }

    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, duration);
  }

  // Force a lightweight zoom refresh to keep grid/background/ruler visually synchronized.
  // This preserves existing behavior while centralizing the workaround logic in one place.
  forceZoomRefresh(zoomValue, delay = 100) {
    const app = this.getApp();
    if (!app || !app.setZoomLevel) {
      return;
    }

    const targetZoom = parseFloat(zoomValue);
    if (!Number.isFinite(targetZoom)) {
      return;
    }

    setTimeout(() => {
      app.setZoomLevel(targetZoom + 0.001);
      setTimeout(() => {
        app.setZoomLevel(targetZoom);
      }, 10);
    }, delay);
  }

  getContextValue(name) {
    if (window.AppContext && typeof window.AppContext.get === 'function') {
      return window.AppContext.get(name);
    }
    return window[name];
  }

  setContextValue(name, value) {
    if (window.AppContext && typeof window.AppContext.set === 'function') {
      return window.AppContext.set(name, value);
    }
    window[name] = value;
    return value;
  }

  getApp() {
    return this.getContextValue('app');
  }

  getGrid() {
    return this.getContextValue('grid');
  }

  setGrid(grid) {
    return this.setContextValue('grid', grid);
  }

  getRuler() {
    return this.getContextValue('ruler');
  }

  setRuler(ruler) {
    return this.setContextValue('ruler', ruler);
  }

  getHistoryManager() {
    return this.getContextValue('historyManager');
  }

  getPalette() {
    return this.getContextValue('palette');
  }

  getLayers() {
    return this.getContextValue('layers');
  }

  getBackground() {
    return this.getContextValue('background');
  }

  getCanvasSizeModal() {
    return this.getContextValue('canvasSizeModal');
  }

  getModalUtils() {
    return this.getContextValue('ModalUtils');
  }

  getSaveLoadSVGUtils() {
    return this.getContextValue('SaveLoadSVGUtils');
  }

  getProjectSchema() {
    return this.getContextValue('ProjectSchema');
  }

  setCanvasSizeModal(canvasSizeModal) {
    return this.setContextValue('canvasSizeModal', canvasSizeModal);
  }

  clearHistoryState() {
    const historyManager = this.getHistoryManager();
    if (historyManager) {
      historyManager.history = [];
      historyManager.historyIndex = -1;
      historyManager.updateButtons();
    }
  }

  resetPaletteToDefault() {
    const palette = this.getPalette();
    if (palette) {
      palette.setCurrentColor('#000000');
      document.querySelectorAll('.palette-color.selected').forEach((el) => {
        el.classList.remove('selected');
      });
    }
  }

  init() {
    const newBtn = document.getElementById('newBtn');
    const saveBtn = document.getElementById('saveBtn');
    const loadBtn = document.getElementById('loadBtn');
    const loadFileInput = document.getElementById('loadFileInput');

    if (!newBtn || !saveBtn || !loadBtn || !loadFileInput) {
      console.error('SaveLoad: Required buttons not found:', {
        newBtn: !!newBtn,
        saveBtn: !!saveBtn,
        loadBtn: !!loadBtn,
        loadFileInput: !!loadFileInput
      });
      return;
    }

    newBtn.addEventListener('click', () => this.showNewProjectModal());
    saveBtn.addEventListener('click', () => this.showSaveProjectModal());
    loadBtn.addEventListener('click', () => loadFileInput.click());
    loadFileInput.addEventListener('change', (e) => this.loadProject(e));

    this.setupNewProjectModal();
    this.setupSaveProjectModal();
    this.setupSVGLoadConfirmModal();
  }

  setupNewProjectModal() {
    const modalUtils = this.getModalUtils();
    if (!modalUtils) return;

    this.newProjectModal = modalUtils.create({
      modalId: 'confirmNewProjectModal',
      closeIds: ['confirmNewProjectClose'],
      cancelIds: ['confirmNewProjectCancel'],
      confirmId: 'confirmNewProjectConfirm',
      focusId: 'confirmNewProjectConfirm',
      trapFocusIds: [
        'confirmNewProjectConfirm',
        'confirmNewProjectCancel',
        'confirmNewProjectClose'
      ],
      enterConfirms: true,
      onConfirm: () => {
        this.newProject();
        return true;
      }
    });
  }

  showNewProjectModal() {
    const modal = document.getElementById('confirmNewProjectModal');
    const confirmBtn = document.getElementById('confirmNewProjectConfirm');

    if (this.newProjectModal) {
      this.newProjectModal.open();
      return;
    }

    modal.style.display = 'flex';
    // Focus the confirm button so user can immediately press Enter
    setTimeout(() => {
      if (confirmBtn) {
        confirmBtn.focus();
      }
    }, 100);
  }

  setupSaveProjectModal() {
    const modal = document.getElementById('saveProjectModal');
    const confirmBtn = document.getElementById('saveProjectConfirm');
    const fileNameInput = document.getElementById('saveFileName');
    const fileNamePreview = document.getElementById('saveFileNamePreview');

    if (!modal || !confirmBtn || !fileNameInput || !fileNamePreview) return;

    const updatePreview = () => {
      const fileName = fileNameInput.value.trim() || 'pixel-art-project';
      fileNamePreview.textContent = `${fileName}.json`;
    };

    const closeModal = () => {
      if (this.saveProjectModal) {
        this.saveProjectModal.close(false);
      } else {
        modal.style.display = 'none';
      }
      fileNameInput.value = '';
    };

    const modalUtils = this.getModalUtils();
    if (modalUtils) {
      this.saveProjectModal = modalUtils.create({
        modalId: 'saveProjectModal',
        closeIds: ['saveProjectClose'],
        cancelIds: ['saveProjectCancel'],
        focusId: 'saveFileName',
        trapFocusIds: [
          'saveFileName',
          'saveProjectConfirm',
          'saveProjectCancel',
          'saveProjectClose'
        ]
      });
    }

    fileNameInput.addEventListener('input', updatePreview);
    fileNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        confirmBtn.click();
      }
    });

    confirmBtn.addEventListener('click', () => {
      const fileName = fileNameInput.value.trim() || 'pixel-art-project';
      this.saveProject(fileName);
      closeModal();
    });
  }

  setupSVGLoadConfirmModal() {
    const modalUtils = this.getModalUtils();
    if (!modalUtils) return;

    this.svgLoadConfirmPending = null;
    this.svgLoadConfirmModal = modalUtils.create({
      modalId: 'svgLoadConfirmModal',
      closeIds: ['svgLoadConfirmClose'],
      cancelIds: ['svgLoadConfirmCancel'],
      confirmId: 'svgLoadConfirmContinue',
      focusId: 'svgLoadConfirmContinue',
      trapFocusIds: ['svgLoadConfirmContinue', 'svgLoadConfirmCancel', 'svgLoadConfirmClose'],
      enterConfirms: true,
      onClose: (result) => {
        if (this.svgLoadConfirmPending) {
          const resolve = this.svgLoadConfirmPending;
          this.svgLoadConfirmPending = null;
          resolve(!!result);
        }
      }
    });
  }

  showSaveProjectModal() {
    const modal = document.getElementById('saveProjectModal');
    const fileNameInput = document.getElementById('saveFileName');

    if (this.saveProjectModal) {
      this.saveProjectModal.open();
    } else {
      modal.style.display = 'flex';
    }

    // Focus the input and select any existing text
    setTimeout(() => {
      fileNameInput.focus();
      fileNameInput.select();
    }, 100);
  }

  newProject() {
    const grid = this.getGrid();
    const ruler = this.getRuler();
    const background = this.getBackground();
    const layers = this.getLayers();
    const canvasSizeModal = this.getCanvasSizeModal();

    // In custom mode, show the canvas size modal again
    if (window.location.pathname.includes('/custom/')) {
      // Clear existing grid and background
      if (grid) {
        this.setGrid(null);
      }
      if (ruler) {
        this.setRuler(null);
      }
      if (background) {
        background.image = null;
        background.draw();
        // Reset button icon to "import"
        background.updateImportButtonIcon();
      }

      // Clear layers
      if (layers) {
        layers.layers.clear();
        layers.renderLayers();
      }

      // Clear history
      this.clearHistoryState();

      // Reset current color to black
      this.resetPaletteToDefault();

      // Show canvas size modal again
      if (canvasSizeModal) {
        canvasSizeModal.show();
      } else {
        // Reinitialize modal if it doesn't exist
        const newCanvasSizeModal = new CanvasSizeModal();
        this.setCanvasSizeModal(newCanvasSizeModal);
        newCanvasSizeModal.setOnConfirm((width, height) => {
          const currentApp = this.getApp();
          if (currentApp && currentApp.initializeGrid) {
            currentApp.initializeGrid(width, height);
          }
        });
      }

      return;
    }

    // For non-custom modes, use standard new project behavior
    // Clear grid
    if (grid) {
      grid.clear();
    }

    // Clear layers
    if (layers) {
      layers.layers.clear();
      layers.renderLayers();
    }

    // Clear background
    if (background) {
      background.removeImage(true); // Skip history since we're starting new project
      // Reset button icon to "import"
      background.updateImportButtonIcon();
      const opacitySlider = document.getElementById('bgOpacity');
      const opacityValue = document.getElementById('opacityValue');
      if (opacitySlider && opacityValue) {
        opacitySlider.value = 100;
        opacityValue.textContent = '100%';
      }
    }

    // Reset background color and fade
    if (grid) {
      grid.backgroundColor = '#ffffff';
      grid.setFadeToBlack(100);
      const fadeSlider = document.getElementById('bgFadeToBlack');
      const fadeValue = document.getElementById('fadeValue');
      if (fadeSlider && fadeValue) {
        fadeSlider.value = 100;
        fadeValue.textContent = '100%';
      }
    }

    // Reset current color to black
    this.resetPaletteToDefault();

    // Clear history
    this.clearHistoryState();

    // Reset zoom
    if (grid) {
      grid.setZoom(1);
      const zoomLevel = document.getElementById('zoomLevel');
      if (zoomLevel) {
        zoomLevel.textContent = '100%';
      }
    }
  }

  saveProject(fileName = null) {
    try {
      const grid = this.getGrid();
      const projectSchema = this.getProjectSchema();

      if (!grid) {
        throw new Error('Grid is not initialized');
      }

      const projectData =
        projectSchema && typeof projectSchema.serializeProjectState === 'function'
          ? projectSchema.serializeProjectState()
          : {
              version: '1.0',
              savedAt: new Date().toISOString(),
              grid: {
                width: grid.width,
                height: grid.height,
                cellSize: grid.cellSize,
                pixels: grid.getPixelData()
              }
            };

      // Convert to JSON
      const jsonData = JSON.stringify(projectData, null, 2);

      // Sanitize filename (remove invalid characters)
      const sanitizedFileName = fileName
        ? fileName.replace(/[^a-z0-9\-_]/gi, '-').toLowerCase() || 'pixel-art-project'
        : `pixel-art-project-${Date.now()}`;

      // Create download
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sanitizedFileName}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error saving project:', error);
      this.showStatusMessage('Error saving project: ' + error.message, 'error', 4500);
    }
  }

  loadProject(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Detect file type by extension
    const fileName = file.name.toLowerCase();
    const isSVG = fileName.endsWith('.svg');

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const app = this.getApp();

        if (isSVG) {
          await this.loadSVG(e.target.result);
          return; // Exit early for SVG loading
        }

        const parsedProjectData = JSON.parse(e.target.result);
        const projectSchema = this.getProjectSchema();
        const projectData =
          projectSchema && typeof projectSchema.normalizeProjectData === 'function'
            ? projectSchema.normalizeProjectData(parsedProjectData)
            : parsedProjectData;

        // Confirm before loading (in case user has unsaved work)
        const shouldLoad = await this.showSVGLoadConfirmModal(
          'Load this project? Current work will be replaced.',
          'Load Project'
        );
        if (!shouldLoad) {
          return;
        }

        const savedWidth = projectData.grid.width;
        const savedHeight = projectData.grid.height;

        // Reinitialize grid with saved dimensions if in custom mode
        if (window.location.pathname.includes('/custom/') && app && app.initializeGrid) {
          app.initializeGrid(savedWidth, savedHeight);
        }

        const grid = this.getGrid();
        const layers = this.getLayers();
        const palette = this.getPalette();
        const background = this.getBackground();
        const ruler = this.getRuler();

        // Load layers first (before setPixelData which will rescan)
        const savedLayers = new Map();
        if (projectData.layers && projectData.layers.length > 0) {
          projectData.layers.forEach((layer) => {
            savedLayers.set(layer.color, {
              visible: layer.visible !== false, // Default to visible
              count: layer.count || 0
            });
          });
        }

        // Load grid pixels (this will trigger scanPixels, but we'll restore layer visibility after)
        if (grid && projectData.grid.pixels) {
          grid.setPixelData(projectData.grid.pixels);
        }

        // Restore layer visibility settings from saved data
        if (layers && savedLayers.size > 0) {
          savedLayers.forEach((savedData, color) => {
            if (layers.layers.has(color)) {
              layers.layers.get(color).visible = savedData.visible;
            }
          });
          layers.renderLayers();
        }

        // Load current color
        if (palette && projectData.currentColor) {
          palette.setCurrentColor(projectData.currentColor);
        }

        // Load settings FIRST (including zoom) so background image can use correct zoom
        let savedZoom = 1;
        if (grid && projectData.settings) {
          if (projectData.settings.zoom !== undefined) {
            savedZoom = projectData.settings.zoom;
            // Use App's setZoomLevel method to properly sync zoom index
            if (app && app.setZoomLevel) {
              app.setZoomLevel(projectData.settings.zoom);
            } else {
              // Fallback if app method not available
              grid.setZoom(projectData.settings.zoom);
              if (background && background.setZoom) {
                background.setZoom(projectData.settings.zoom);
              }
              if (ruler && ruler.setZoom) {
                ruler.setZoom(projectData.settings.zoom);
              }
              const zoomLevel = document.getElementById('zoomLevel');
              if (zoomLevel) {
                zoomLevel.textContent = `${Math.round(projectData.settings.zoom * 100)}%`;
              }
            }
          }
        }

        // Load background image (after zoom is set)
        if (background && projectData.background) {
          if (projectData.background.imageData) {
            const img = new Image();
            img.onload = () => {
              background.image = img;
              background.opacity = projectData.background.opacity || 1;

              // Restore transform properties
              background.x = projectData.background.x !== undefined ? projectData.background.x : 0;
              background.y = projectData.background.y !== undefined ? projectData.background.y : 0;
              background.scale =
                projectData.background.scale !== undefined ? projectData.background.scale : 1.0;
              background.rotation =
                projectData.background.rotation !== undefined ? projectData.background.rotation : 0;

              // Ensure background canvas zoom matches grid zoom
              if (background.setZoom) {
                background.setZoom(savedZoom);
              }

              // Force a redraw to ensure proper alignment
              background.draw();

              // Update opacity slider
              const opacitySlider = document.getElementById('bgOpacity');
              const opacityValue = document.getElementById('opacityValue');
              if (opacitySlider && opacityValue) {
                opacitySlider.value = (projectData.background.opacity || 1) * 100;
                opacityValue.textContent = `${Math.round((projectData.background.opacity || 1) * 100)}%`;
              }

              // Update button icon to close (X)
              if (background.updateImportButtonIcon) {
                background.updateImportButtonIcon();
              }

              // Force a zoom refresh to ensure all components are synchronized
              // This fixes the issue where canvas appears small until user zooms
              this.forceZoomRefresh(grid ? grid.zoom : savedZoom, 100);
            };
            img.src = projectData.background.imageData;
          } else {
            // No background image
            background.image = null;
            // Reset transform properties when no image
            background.x = 0;
            background.y = 0;
            background.scale = 1.0;
            background.rotation = 0;
            background.draw();

            // Hide handles when no image
            if (background.updateHandleVisibility) {
              background.updateHandleVisibility();
            }

            // Update button icon back to upload
            if (background.updateImportButtonIcon) {
              background.updateImportButtonIcon();
            }

            // Force a zoom refresh even when no background image
            this.forceZoomRefresh(grid ? grid.zoom : savedZoom, 100);
          }
        }

        // Load remaining settings (zoom already loaded above)
        if (grid && projectData.settings) {
          if (projectData.settings.showGrid !== undefined) {
            grid.showGrid = projectData.settings.showGrid;
          }
          // Zoom was already set above before loading background image
          if (projectData.settings.backgroundColor !== undefined) {
            grid.backgroundColor = projectData.settings.backgroundColor;
          }
          const fadeOpacity =
            projectData.settings.fadeToBlack !== undefined ? projectData.settings.fadeToBlack : 100;
          grid.setFadeToBlack(fadeOpacity);
          // Update fade slider UI
          const fadeSlider = document.getElementById('bgFadeToBlack');
          const fadeValueEl = document.getElementById('fadeValue');
          if (fadeSlider && fadeValueEl) {
            fadeSlider.value = fadeOpacity;
            fadeValueEl.textContent = `${fadeOpacity}%`;
          }
          grid.draw();
        }

        // Clear history after loading
        this.clearHistoryState();

        // Final zoom refresh to ensure all components are synchronized
        // This fixes the issue where canvas appears small until user zooms
        this.forceZoomRefresh(grid ? grid.zoom : savedZoom, 150);

        console.info('Project loaded successfully');
      } catch (error) {
        console.error('Error loading project:', error);
        this.showStatusMessage('Error loading project: ' + error.message, 'error', 4500);
      }
    };

    reader.onerror = () => {
      this.showStatusMessage('Error reading file', 'error', 4500);
    };

    reader.readAsText(file);

    // Reset file input so same file can be loaded again
    event.target.value = '';
  }

  async showSVGLoadConfirmModal(message, title = 'Load SVG File') {
    return new Promise((resolve) => {
      const modal = document.getElementById('svgLoadConfirmModal');
      const titleEl = modal ? modal.querySelector('.color-picker-header h3') : null;
      const messageEl = document.getElementById('svgLoadConfirmMessage');

      if (!modal || !messageEl) {
        resolve(false);
        return;
      }

      if (titleEl) {
        titleEl.textContent = title;
      }
      messageEl.innerHTML = message.replace(/\n/g, '<br>');

      if (this.svgLoadConfirmModal) {
        this.svgLoadConfirmPending = resolve;
        this.svgLoadConfirmModal.open();
        return;
      }

      // Fallback behavior if ModalUtils is unavailable
      const fallbackMessage = title ? `${title}\n\n${message}` : message;
      resolve(window.confirm(fallbackMessage));
    });
  }

  async loadSVG(svgContent) {
    try {
      const normalized = this.parseAndNormalizeSVG(svgContent);
      const { svgElement, svgWidth, svgHeight, cssStyleMap, allRects, pathRects, allRectData } =
        normalized;

      const cellSize = this.detectCellSize(allRectData, 10);

      const gridWidth = Math.round(svgWidth / cellSize);
      const gridHeight = Math.round(svgHeight / cellSize);

      // Validate grid dimensions
      if (gridWidth < 8 || gridWidth > 1024 || gridHeight < 8 || gridHeight > 1024) {
        throw new Error(
          `Invalid grid dimensions: ${gridWidth}x${gridHeight}. Must be between 8-1024 pixels.`
        );
      }

      // Single confirmation dialog with all information (including grid resize for custom mode)
      const proceed = await this.showSVGLoadConfirmModal(
        `Loading SVG will import pixel art only.\n\nSettings, background image, and layer visibility will be reset to defaults.\n\nGrid will be resized to ${gridWidth}x${gridHeight}.\n\nCurrent work will be replaced.\n\nContinue?`
      );
      if (!proceed) {
        return;
      }

      const finalCellSize = this.detectCellSize(allRectData, cellSize);

      // Recalculate grid dimensions with final cell size
      const finalGridWidth = Math.round(svgWidth / finalCellSize);
      const finalGridHeight = Math.round(svgHeight / finalCellSize);

      // Validate grid dimensions
      if (
        finalGridWidth < 8 ||
        finalGridWidth > 1024 ||
        finalGridHeight < 8 ||
        finalGridHeight > 1024
      ) {
        throw new Error(
          `Invalid grid dimensions: ${finalGridWidth}x${finalGridHeight}. Must be between 8-1024 pixels.`
        );
      }

      // Initialize pixel array
      const pixels = Array(finalGridHeight)
        .fill(null)
        .map(() => Array(finalGridWidth).fill(null));

      const { pixelElements, backgroundElements } = this.classifySVGElements(
        allRects,
        pathRects,
        finalCellSize
      );

      this.applyPixelElementsToGrid(
        pixelElements,
        svgElement,
        cssStyleMap,
        finalCellSize,
        finalGridWidth,
        finalGridHeight,
        pixels
      );

      this.applyImportedSVGState({
        svgElement,
        svgWidth,
        svgHeight,
        finalGridWidth,
        finalGridHeight,
        pixels,
        backgroundElements
      });

      // All layers will be visible by default (scanPixels sets this)
      // Reset current color to black
      this.resetPaletteToDefault();
      // Clear history
      this.clearHistoryState();

      console.info('SVG loaded successfully');
    } catch (error) {
      console.error('Error loading SVG:', error);
      this.showStatusMessage('Error loading SVG: ' + error.message, 'error', 4500);
    }
  }

  parseSVGCSSStyles(svgDoc) {
    const svgUtils = this.getSaveLoadSVGUtils();
    return svgUtils.parseSVGCSSStyles(svgDoc);
  }

  parsePathToRect(path) {
    const svgUtils = this.getSaveLoadSVGUtils();
    return svgUtils.parsePathToRect(path);
  }

  resolveElementColor(element, group, cssStyleMap, elementType) {
    const svgUtils = this.getSaveLoadSVGUtils();
    return svgUtils.resolveElementColor(element, group, cssStyleMap, elementType);
  }

  resolvePathColor(path, group, cssStyleMap) {
    const svgUtils = this.getSaveLoadSVGUtils();
    return svgUtils.resolvePathColor(path, group, cssStyleMap);
  }

  resolveRectColor(rect, group, cssStyleMap) {
    const svgUtils = this.getSaveLoadSVGUtils();
    return svgUtils.resolveRectColor(rect, group, cssStyleMap);
  }

  convertEscapedID(id) {
    const svgUtils = this.getSaveLoadSVGUtils();
    return svgUtils.convertEscapedID(id);
  }

  isValidColor(color) {
    const svgUtils = this.getSaveLoadSVGUtils();
    return svgUtils.isValidColor(color);
  }

  namedColorToHex(color) {
    const svgUtils = this.getSaveLoadSVGUtils();
    return svgUtils.namedColorToHex(color);
  }

  createBackgroundSVG(svgElement, backgroundElements, width, height) {
    const svgUtils = this.getSaveLoadSVGUtils();
    return svgUtils.createBackgroundSVG(svgElement, backgroundElements, width, height);
  }

  parseAndNormalizeSVG(svgContent) {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
    const parserError = svgDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Failed to parse SVG: ' + parserError.textContent);
    }

    const svgElement = svgDoc.querySelector('svg');
    if (!svgElement) {
      throw new Error('No SVG element found in file');
    }

    const svgWidth =
      parseFloat(svgElement.getAttribute('width')) ||
      parseFloat(svgElement.getAttribute('viewBox')?.split(' ')[2]) ||
      640;
    const svgHeight =
      parseFloat(svgElement.getAttribute('height')) ||
      parseFloat(svgElement.getAttribute('viewBox')?.split(' ')[3]) ||
      640;

    const cssStyleMap = this.parseSVGCSSStyles(svgDoc);
    const allRects = svgElement.querySelectorAll('rect');
    const allPaths = svgElement.querySelectorAll('path');

    const pathRects = [];
    allPaths.forEach((path) => {
      const pathData = this.parsePathToRect(path);
      if (pathData) {
        pathRects.push(pathData);
      }
    });

    const allRectData = [];
    allRects.forEach((rect) => {
      allRectData.push({
        width: parseFloat(rect.getAttribute('width')) || 0,
        height: parseFloat(rect.getAttribute('height')) || 0,
        element: rect
      });
    });
    pathRects.forEach((pathRect) => {
      allRectData.push({
        width: pathRect.width,
        height: pathRect.height,
        element: pathRect.element
      });
    });

    return {
      svgDoc,
      svgElement,
      svgWidth,
      svgHeight,
      cssStyleMap,
      allRects,
      pathRects,
      allRectData
    };
  }

  detectCellSize(allRectData, fallbackSize = 10) {
    const widthCounts = {};
    allRectData.forEach((data) => {
      const width = data.width;
      if (width > 0 && width < 100) {
        widthCounts[width] = (widthCounts[width] || 0) + 1;
      }
    });

    let cellSize = fallbackSize;
    let maxCount = 0;
    Object.keys(widthCounts).forEach((width) => {
      if (widthCounts[width] > maxCount) {
        maxCount = widthCounts[width];
        cellSize = parseFloat(width);
      }
    });

    return cellSize;
  }

  classifySVGElements(allRects, pathRects, finalCellSize) {
    const pixelElements = [];
    const backgroundElements = [];
    const tolerance = 0.1;

    const isPixelAligned = ({ x, y, width, height }) =>
      width > 0 &&
      width < 100 &&
      height > 0 &&
      height < 100 &&
      Math.abs(width - finalCellSize) < tolerance &&
      Math.abs(height - finalCellSize) < tolerance &&
      Math.abs(x % finalCellSize) < tolerance &&
      Math.abs(y % finalCellSize) < tolerance;

    allRects.forEach((rect) => {
      const x = parseFloat(rect.getAttribute('x')) || 0;
      const y = parseFloat(rect.getAttribute('y')) || 0;
      const width = parseFloat(rect.getAttribute('width')) || 0;
      const height = parseFloat(rect.getAttribute('height')) || 0;
      if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) return;

      if (isPixelAligned({ x, y, width, height })) {
        pixelElements.push({ element: rect, x, y, width, height, type: 'rect' });
      } else {
        backgroundElements.push(rect.cloneNode(true));
      }
    });

    pathRects.forEach((pathRect) => {
      const { x, y, width, height, element } = pathRect;
      if (isPixelAligned({ x, y, width, height })) {
        pixelElements.push({ element, x, y, width, height, type: 'path' });
      } else {
        backgroundElements.push(element.cloneNode(true));
      }
    });

    return { pixelElements, backgroundElements };
  }

  applyPixelElementsToGrid(
    pixelElements,
    svgElement,
    cssStyleMap,
    finalCellSize,
    finalGridWidth,
    finalGridHeight,
    pixels
  ) {
    pixelElements.forEach(({ element, x, y, type }) => {
      let color = null;

      let parent = element.parentElement;
      while (parent && parent !== svgElement) {
        if (parent.tagName === 'g') {
          color = this.resolveElementColor(element, parent, cssStyleMap, type);
          if (color) break;
        }
        parent = parent.parentElement;
      }

      if (!color) {
        color = this.resolveElementColor(element, null, cssStyleMap, type);
      }

      if (!color || typeof color !== 'string') return;

      let normalizedColor = null;
      if (color.startsWith('#')) {
        normalizedColor = color.toLowerCase();
      } else if (this.isValidColor(color)) {
        const hexColor = this.namedColorToHex(color);
        if (hexColor && hexColor.startsWith('#')) {
          normalizedColor = hexColor.toLowerCase();
        }
      }

      if (!normalizedColor) return;
      const gridX = Math.round(x / finalCellSize);
      const gridY = Math.round(y / finalCellSize);
      if (gridX >= 0 && gridX < finalGridWidth && gridY >= 0 && gridY < finalGridHeight) {
        pixels[gridY][gridX] = normalizedColor;
      }
    });
  }

  applyImportedSVGState({
    svgElement,
    svgWidth,
    svgHeight,
    finalGridWidth,
    finalGridHeight,
    pixels,
    backgroundElements
  }) {
    const grid = this.getGrid();
    const app = this.getApp();
    const background = this.getBackground();
    const ruler = this.getRuler();

    if (grid && (grid.width !== finalGridWidth || grid.height !== finalGridHeight)) {
      if (app && app.initializeGrid) {
        app.initializeGrid(finalGridWidth, finalGridHeight);
      } else {
        throw new Error('Cannot resize grid: app.initializeGrid not available');
      }
    }

    if (background && backgroundElements.length > 0) {
      const backgroundSVG = this.createBackgroundSVG(
        svgElement,
        backgroundElements,
        svgWidth,
        svgHeight
      );
      const backgroundDataURL =
        'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(backgroundSVG);

      const img = new Image();
      img.onload = () => {
        background.image = img;
        background.opacity = 1.0;
        background.x = 0;
        background.y = 0;
        background.scale = 1.0;
        background.rotation = 0;

        const opacitySlider = document.getElementById('bgOpacity');
        const opacityValue = document.getElementById('opacityValue');
        if (opacitySlider && opacityValue) {
          opacitySlider.value = 100;
          opacityValue.textContent = '100%';
        }

        background.draw();
        if (background.updateImportButtonIcon) {
          background.updateImportButtonIcon();
        }
      };
      img.src = backgroundDataURL;
    } else if (background) {
      background.removeImage();
      const opacitySlider = document.getElementById('bgOpacity');
      const opacityValue = document.getElementById('opacityValue');
      if (opacitySlider && opacityValue) {
        opacitySlider.value = 100;
        opacityValue.textContent = '100%';
      }
    }

    const finalGrid = this.getGrid();
    if (finalGrid) {
      finalGrid.showGrid = true;
      finalGrid.backgroundColor = '#ffffff';
      finalGrid.setFadeToBlack(100);
      const fadeSlider = document.getElementById('bgFadeToBlack');
      const fadeValueEl = document.getElementById('fadeValue');
      if (fadeSlider && fadeValueEl) {
        fadeSlider.value = 100;
        fadeValueEl.textContent = '100%';
      }
    }

    if (app && app.setZoomLevel) {
      app.setZoomLevel(0.5);
    } else if (finalGrid) {
      finalGrid.setZoom(0.5);
      if (background && background.setZoom) {
        background.setZoom(0.5);
      }
      if (ruler && ruler.setZoom) {
        ruler.setZoom(0.5);
      }
      const zoomLevel = document.getElementById('zoomLevel');
      if (zoomLevel) {
        zoomLevel.textContent = '50%';
      }
    }

    if (finalGrid) {
      finalGrid.setPixelData(pixels);
    }

    this.forceZoomRefresh(finalGrid ? finalGrid.zoom : 0.5, 100);
  }
}

window.saveLoad = new SaveLoad();
