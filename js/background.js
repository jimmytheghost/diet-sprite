class Background {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.image = null;
    this.opacity = 1;
    this.savedOpacity = 1; // Saved opacity for toggle functionality
    // Transform properties
    this.x = 0; // Position X offset
    this.y = 0; // Position Y offset
    this.scale = 1.0; // Scale factor
    this.rotation = 0; // Rotation in radians
    this.zoom = 1; // Current zoom level
    this.init();
  }

  init() {
    this.canvas = document.getElementById('backgroundCanvas');
    if (!this.canvas) {
      console.error('Background canvas not found');
      return;
    }
    this.ctx = this.canvas.getContext('2d');

    // Don't setup canvas yet - grid doesn't exist in custom mode until modal confirms
    // setupCanvas() will be called from App.initializeGrid()
    this.setupEventListeners();
  }

  getContextValue(name) {
    if (window.AppContext && typeof window.AppContext.get === 'function') {
      return window.AppContext.get(name);
    }
    return window[name];
  }

  getGrid() {
    return this.getContextValue('grid');
  }

  getLayers() {
    return this.getContextValue('layers');
  }

  getHistoryManager() {
    return this.getContextValue('historyManager');
  }

  getApp() {
    return this.getContextValue('app');
  }

  getModalUtils() {
    return this.getContextValue('ModalUtils');
  }

  setupCanvas() {
    const grid = this.getGrid();
    if (!grid) {
      console.warn('Grid not initialized yet, cannot setup background canvas');
      return;
    }
    const width = grid.width * grid.cellSize; // Grid cells * cell size
    const height = grid.height * grid.cellSize;
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
  }

  setZoom(level) {
    this.zoom = level;
    const grid = this.getGrid();
    if (!grid) {
      return;
    }
    const canvasWidth = grid.width * grid.cellSize;
    const canvasHeight = grid.height * grid.cellSize;
    this.canvas.style.width = `${canvasWidth * level}px`;
    this.canvas.style.height = `${canvasHeight * level}px`;
  }

  getImage() {
    return this.image;
  }

  updateToggleButtonDimming() {
    const bgImageToggle = document.getElementById('bgImageToggle');
    if (!bgImageToggle || !this.image) return;

    // Dim button when opacity is 0% (activated/hidden), not dim when 1% or more
    if (this.opacity === 0) {
      bgImageToggle.classList.add('bg-image-off');
    } else {
      bgImageToggle.classList.remove('bg-image-off');
    }
  }

  setupEventListeners() {
    const bgImageInput = document.getElementById('bgImageInput');
    const bgImportBtn = document.getElementById('bgImportBtn');
    const bgRemoveBtn = document.getElementById('bgRemoveBtn');
    const bgOpacity = document.getElementById('bgOpacity');
    const opacityValue = document.getElementById('opacityValue');
    const bgImageToggle = document.getElementById('bgImageToggle');

    bgImportBtn.addEventListener('click', () => {
      // Only open file picker if showing upload icon (no image loaded)
      if (!this.image) {
        bgImageInput.click();
      }
      // If image is loaded, clicking does nothing (hold to hide instead)
    });

    bgImageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.loadImage(file);
      }
    });

    bgRemoveBtn.addEventListener('click', () => {
      this.showRemoveBackgroundModal();
    });

    bgOpacity.addEventListener('input', (e) => {
      this.opacity = e.target.value / 100;
      this.savedOpacity = this.opacity; // Update saved opacity when slider changes
      opacityValue.textContent = `${e.target.value}%`;
      // Update button dimming based on opacity (0% = dim, 1%+ = not dim)
      this.updateToggleButtonDimming();
      this.draw();
    });

    // Background image toggle button
    if (bgImageToggle) {
      bgImageToggle.addEventListener('click', () => {
        if (!this.image) return; // Only toggle if image is loaded

        if (this.opacity === 0) {
          // Show background image (restore from saved opacity or default to 100%)
          this.opacity = this.savedOpacity > 0 ? this.savedOpacity : 1;
          // Update slider and value display
          if (bgOpacity) bgOpacity.value = this.opacity * 100;
          if (opacityValue) opacityValue.textContent = `${Math.round(this.opacity * 100)}%`;
        } else {
          // Hide background image
          this.savedOpacity = this.opacity;
          this.opacity = 0;
          // Update slider and value display
          if (bgOpacity) bgOpacity.value = 0;
          if (opacityValue) opacityValue.textContent = '0%';
        }
        // Update button dimming state
        this.updateToggleButtonDimming();
        this.draw();
      });
    }

    // Fade to black slider
    const bgFadeToBlack = document.getElementById('bgFadeToBlack');
    const fadeValue = document.getElementById('fadeValue');
    if (bgFadeToBlack && fadeValue) {
      bgFadeToBlack.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        fadeValue.textContent = `${value}%`;
        const grid = this.getGrid();
        if (grid) {
          grid.setFadeToBlack(value);
        }
      });
    }

    // Drag and drop
    const canvasWrapper = document.getElementById('canvasWrapper');
    canvasWrapper.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    canvasWrapper.addEventListener('drop', (e) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        this.loadImage(file);
      }
    });

    // Hide layers button (hold to hide all pixel art)
    this.setupHideLayersButton();

    // Hide background button (hold to hide background image)
    this.setupHideBackgroundButton();

    // Setup remove background confirmation modal
    this.setupRemoveBackgroundModal();

    // Setup toolbar transform buttons (R, S, P)
    this.setupToolbarTransformButtons();
  }

  setupHideLayersButton() {
    const hideLayersBtn = document.getElementById('hideLayersBtn');
    if (!hideLayersBtn) return;

    let savedVisibilityStates = null;
    let isHiding = false;

    // Handle mouse/touch down
    const handleHideStart = () => {
      const layers = this.getLayers();
      const grid = this.getGrid();
      if (!layers) return;

      // Save current visibility states
      savedVisibilityStates = new Map();
      layers.layers.forEach((data, color) => {
        savedVisibilityStates.set(color, data.visible);
      });

      // Hide all layers
      layers.layers.forEach((data, _color) => {
        data.visible = false;
      });

      isHiding = true;

      // Redraw grid to reflect hidden layers
      if (grid) {
        grid.draw();
      }

      // Update layer UI
      layers.renderLayers();
    };

    // Handle mouse/touch up
    const handleHideEnd = () => {
      const layers = this.getLayers();
      const grid = this.getGrid();
      if (!isHiding || !savedVisibilityStates || !layers) return;

      // Restore previous visibility states
      savedVisibilityStates.forEach((visible, color) => {
        if (layers.layers.has(color)) {
          layers.layers.get(color).visible = visible;
        }
      });

      isHiding = false;
      savedVisibilityStates = null;

      // Redraw grid to show restored layers
      if (grid) {
        grid.draw();
      }

      // Update layer UI
      layers.renderLayers();
    };

    // Mouse events
    hideLayersBtn.addEventListener('mousedown', handleHideStart);
    document.addEventListener('mouseup', handleHideEnd);

    // Touch events for mobile
    hideLayersBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handleHideStart();
    });
    document.addEventListener('touchend', handleHideEnd);

    // Prevent context menu on long press
    hideLayersBtn.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  loadImage(file) {
    // Ensure canvas is set up before loading image
    const grid = this.getGrid();
    if (!grid) {
      console.warn('Cannot load background image: Grid not initialized yet');
      return;
    }

    // Setup canvas if not already done
    if (this.canvas.width === 0 || this.canvas.height === 0) {
      this.setupCanvas();
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.image = img;
        // Reset transform properties to defaults
        this.x = 0;
        this.y = 0;
        this.scale = 1.0;
        this.rotation = 0;
        // Set default opacity to 80% when importing new image
        this.opacity = 0.8;
        this.savedOpacity = 0.8;
        // Update opacity slider UI
        const opacitySlider = document.getElementById('bgOpacity');
        const opacityValue = document.getElementById('opacityValue');
        if (opacitySlider && opacityValue) {
          opacitySlider.value = 80;
          opacityValue.textContent = '80%';
        }
        // Update button dimming state
        this.updateToggleButtonDimming();
        this.draw();
        // Update button icon to close (X)
        this.updateImportButtonIcon();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  draw() {
    if (!this.canvas || !this.ctx) {
      return;
    }
    // Ensure canvas is set up before drawing
    if (this.canvas.width === 0 || this.canvas.height === 0) {
      if (this.getGrid()) {
        this.setupCanvas();
      } else {
        return; // Can't draw if grid isn't initialized
      }
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.image) {
      this.ctx.save();
      this.ctx.globalAlpha = this.opacity;

      // Canvas center point
      const canvasCenterX = this.canvas.width / 2;
      const canvasCenterY = this.canvas.height / 2;

      // Calculate base scale to fit image to canvas (maintain aspect ratio)
      const canvasSize = Math.max(this.canvas.width, this.canvas.height);
      const imageAspect = this.image.width / this.image.height;
      let baseWidth = canvasSize;
      let baseHeight = canvasSize;

      if (this.image.width > this.image.height) {
        baseHeight = canvasSize / imageAspect;
      } else {
        baseWidth = canvasSize * imageAspect;
      }

      // Apply transforms in order: translate, rotate, scale
      // Translate to canvas center + offset
      this.ctx.translate(canvasCenterX + this.x, canvasCenterY + this.y);

      // Rotate around image center (0,0 after translate)
      this.ctx.rotate(this.rotation);

      // Scale the image (base scale * user scale)
      this.ctx.scale(this.scale, this.scale);

      // Draw image centered at origin (before transforms)
      // Use base dimensions that fit the canvas
      this.ctx.drawImage(this.image, -baseWidth / 2, -baseHeight / 2, baseWidth, baseHeight);

      this.ctx.restore();
    }
  }

  removeImage(skipHistory = false) {
    // Save image data for undo before removing (unless skipping history)
    let imageData = null;
    let savedTransform = null;

    const historyManager = this.getHistoryManager();

    if (this.image && historyManager && !skipHistory) {
      try {
        // Convert image to data URL for saving
        const canvas = document.createElement('canvas');
        canvas.width = this.image.width;
        canvas.height = this.image.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(this.image, 0, 0);
        imageData = canvas.toDataURL('image/png');

        // Save current transform state
        savedTransform = {
          imageData: imageData,
          opacity: this.opacity,
          x: this.x,
          y: this.y,
          scale: this.scale,
          rotation: this.rotation
        };
      } catch (e) {
        console.warn('Could not save background image for undo:', e);
      }
    }

    // Remove the image
    this.image = null;
    this.opacity = 1;
    this.savedOpacity = 1;
    this.draw();
    // Update button icon back to upload
    this.updateImportButtonIcon();
    // Reset toggle button state
    this.updateToggleButtonDimming();

    // Add to history for undo (unless skipping)
    if (historyManager && savedTransform && !skipHistory) {
      historyManager.addAction({
        type: 'removeBackground',
        savedState: savedTransform
      });
    }
  }

  restoreImage(savedState) {
    if (!savedState || !savedState.imageData) {
      return;
    }

    const img = new Image();
    img.onload = () => {
      this.image = img;
      this.opacity = savedState.opacity !== undefined ? savedState.opacity : 1;
      this.savedOpacity = this.opacity;
      this.x = savedState.x !== undefined ? savedState.x : 0;
      this.y = savedState.y !== undefined ? savedState.y : 0;
      this.scale = savedState.scale !== undefined ? savedState.scale : 1.0;
      this.rotation = savedState.rotation !== undefined ? savedState.rotation : 0;

      // Update opacity slider UI
      const opacitySlider = document.getElementById('bgOpacity');
      const opacityValue = document.getElementById('opacityValue');
      if (opacitySlider && opacityValue) {
        const opacityPercent = Math.round(this.opacity * 100);
        opacitySlider.value = opacityPercent;
        opacityValue.textContent = `${opacityPercent}%`;
      }
      // Update button dimming state
      this.updateToggleButtonDimming();

      this.draw();
      this.updateImportButtonIcon();
    };
    img.src = savedState.imageData;
  }

  updateImportButtonIcon() {
    const bgImportBtn = document.getElementById('bgImportBtn');
    if (!bgImportBtn) return;

    const iconSpan = bgImportBtn.querySelector('.material-icons');
    if (!iconSpan) return;

    if (this.image) {
      // Image loaded: show close icon
      iconSpan.textContent = 'close';
      bgImportBtn.title = 'Hold to Hide Background';
    } else {
      // No image: show upload icon
      iconSpan.textContent = 'upload';
      bgImportBtn.title = 'Import Image';
    }
  }

  setupHideBackgroundButton() {
    const bgImportBtn = document.getElementById('bgImportBtn');
    if (!bgImportBtn) return;

    let savedOpacity = null;
    let isHiding = false;
    let hideTouchId = null; // Track which touch is holding the button

    // Handle mouse/touch down
    const handleHideStart = (e) => {
      // Only hide if image is loaded
      if (!this.image) return;

      // Stop propagation to prevent click event from firing
      if (e) {
        e.stopPropagation();
      }

      // Save current opacity
      savedOpacity = this.opacity;

      // Hide background by setting opacity to 0
      this.opacity = 0;
      isHiding = true;

      // Track touch ID for touch events
      if (e && e.touches && e.touches.length > 0) {
        hideTouchId = e.touches[0].identifier;
      }

      // Redraw to hide background
      this.draw();
    };

    // Handle mouse/touch up
    const handleHideEnd = (e) => {
      if (!isHiding || savedOpacity === null) return;

      // For touch events, only restore if it's the touch that was holding the button
      if (e && e.changedTouches && hideTouchId !== null) {
        let isHideTouch = false;
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === hideTouchId) {
            isHideTouch = true;
            break;
          }
        }
        if (!isHideTouch) {
          return; // This touchend is not from the button hold
        }
      }

      // Restore previous opacity
      this.opacity = savedOpacity;
      isHiding = false;
      savedOpacity = null;
      hideTouchId = null;

      // Redraw to show background again
      this.draw();
    };

    // Mouse events - use capture phase and stop propagation (not preventDefault)
    bgImportBtn.addEventListener(
      'mousedown',
      (e) => {
        // Only trigger hide if image is loaded
        if (this.image) {
          handleHideStart(e);
        }
      },
      { capture: true }
    );

    // Listen for mouseup on document (button or anywhere)
    const mouseUpHandler = (e) => {
      if (isHiding) {
        handleHideEnd(e);
      }
    };
    document.addEventListener('mouseup', mouseUpHandler);

    // Touch events for mobile - use capture phase, stop propagation (not preventDefault)
    bgImportBtn.addEventListener(
      'touchstart',
      (e) => {
        // Only trigger hide if image is loaded
        if (this.image) {
          handleHideStart(e);
        }
      },
      { capture: true, passive: true }
    ); // Use passive: true so it doesn't block canvas events

    // Listen for touchend on document
    const touchEndHandler = (e) => {
      if (isHiding) {
        handleHideEnd(e);
      }
    };
    document.addEventListener('touchend', touchEndHandler, { passive: true });

    // Prevent context menu on long press
    bgImportBtn.addEventListener('contextmenu', (e) => {
      if (this.image) {
        e.preventDefault();
      }
    });
  }

  setupRemoveBackgroundModal() {
    const modal = document.getElementById('confirmRemoveBackgroundModal');
    if (!modal) return;

    const modalUtils = this.getModalUtils();
    if (modalUtils) {
      this.removeBackgroundModal = modalUtils.create({
        modalId: 'confirmRemoveBackgroundModal',
        closeIds: ['confirmRemoveBackgroundClose'],
        cancelIds: ['confirmRemoveBackgroundCancel'],
        confirmId: 'confirmRemoveBackgroundConfirm',
        trapFocusIds: [
          'confirmRemoveBackgroundConfirm',
          'confirmRemoveBackgroundCancel',
          'confirmRemoveBackgroundClose'
        ],
        enterConfirms: true,
        onConfirm: () => {
          this.removeImage();
          return true;
        }
      });
      return;
    }
  }

  showRemoveBackgroundModal() {
    const modal = document.getElementById('confirmRemoveBackgroundModal');
    if (!modal) return;
    if (this.removeBackgroundModal) {
      this.removeBackgroundModal.open();
    } else {
      modal.style.display = 'flex';
    }
  }

  setupToolbarTransformButtons() {
    const rotateBtn = document.getElementById('bgTransformRotate');
    const scaleBtn = document.getElementById('bgTransformScale');
    const imageBtn = document.getElementById('bgTransformImage');
    const positionBtn = document.getElementById('bgTransformPosition');

    if (!rotateBtn || !scaleBtn || !imageBtn || !positionBtn) return;

    let activeButton = null;
    let startX = 0;
    let startY = 0;
    let initialScale = 1;
    let initialRotation = 0;
    let initialX = 0;
    let initialY = 0;
    let initialDistance = 0;
    let initialPixels = null;
    let accumulatedShiftX = 0;
    let accumulatedShiftY = 0;
    let hasChanged = false;

    const getCanvasCenter = () => {
      const canvasArea = document.querySelector('.canvas-area');
      if (!canvasArea) return { x: 0, y: 0 };

      const areaRect = canvasArea.getBoundingClientRect();
      const app = this.getApp();
      const panX = app ? app.panX : 0;
      const panY = app ? app.panY : 0;

      return {
        x: areaRect.left + areaRect.width / 2 + panX,
        y: areaRect.top + areaRect.height / 2 + panY
      };
    };

    const handleStart = (e, buttonType) => {
      // For image button, don't require background image, but require grid
      const grid = this.getGrid();
      if (buttonType === 'image' && !grid) {
        console.warn('Cannot move canvas: Grid not initialized');
        return;
      }
      if (buttonType !== 'image' && !this.image) return;

      e.preventDefault();
      e.stopPropagation();

      activeButton = buttonType;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      startX = clientX;
      startY = clientY;
      initialScale = this.scale;
      initialRotation = this.rotation;
      initialX = this.x;
      initialY = this.y;
      accumulatedShiftX = 0;
      accumulatedShiftY = 0;
      hasChanged = false;

      // Save initial pixel state for image button
      if (buttonType === 'image' && grid) {
        initialPixels = grid.getPixelData().map((row) => row.slice());
      }

      // Calculate initial distance for scale
      if (buttonType === 'scale') {
        const center = getCanvasCenter();
        initialDistance = Math.sqrt(
          Math.pow(startX - center.x, 2) + Math.pow(startY - center.y, 2)
        );
      }
    };

    const handleMove = (e) => {
      if (!activeButton) return;
      if (activeButton !== 'image' && !this.image) return;

      e.preventDefault();
      e.stopPropagation();

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - startX;
      const deltaY = clientY - startY;

      if (activeButton === 'scale') {
        // Scale: calculate distance from canvas center and compare to initial
        const center = getCanvasCenter();
        const currentDistance = Math.sqrt(
          Math.pow(clientX - center.x, 2) + Math.pow(clientY - center.y, 2)
        );
        const distanceRatio = currentDistance / initialDistance;
        const newScale = Math.max(0.1, Math.min(5.0, initialScale * distanceRatio));
        if (Math.abs(this.scale - newScale) > 0.001) {
          this.scale = newScale;
          hasChanged = true;
        }
      } else if (activeButton === 'position') {
        // Position: apply delta directly
        const newX = initialX + deltaX;
        const newY = initialY + deltaY;
        if (Math.abs(this.x - newX) > 0.5 || Math.abs(this.y - newY) > 0.5) {
          this.x = newX;
          this.y = newY;
          hasChanged = true;
        }
      } else if (activeButton === 'rotate') {
        // Rotate: calculate angle from image center
        const center = getCanvasCenter();
        const currentAngle = Math.atan2(clientY - center.y, clientX - center.x);
        const startAngle = Math.atan2(startY - center.y, startX - center.x);
        const angleDelta = currentAngle - startAngle;
        const newRotation = initialRotation + angleDelta;
        if (Math.abs(this.rotation - newRotation) > 0.001) {
          this.rotation = newRotation;
          hasChanged = true;
        }
      } else if (activeButton === 'image') {
        // Image: shift pixel art layer by grid cells (snapping to grid)
        const currentGrid = this.getGrid();
        if (!currentGrid) {
          console.warn('Cannot move canvas: Grid not initialized');
          return;
        }
        if (!initialPixels) {
          // Try to get initial pixels now if we don't have them
          initialPixels = this.getGrid()
            .getPixelData()
            .map((row) => row.slice());
        }

        // Get current zoom to convert screen pixels to grid cells
        const app = this.getApp();
        const zoom = app && app.zoomLevel ? app.zoomLevel : 1;
        const cellSize = this.getGrid().cellSize;
        const scaledCellSize = cellSize * zoom;

        // Calculate total shift in grid cells (snap to grid)
        const totalDeltaX = deltaX / scaledCellSize;
        const totalDeltaY = deltaY / scaledCellSize;

        // Round to nearest grid cell
        const newShiftX = Math.round(totalDeltaX);
        const newShiftY = Math.round(totalDeltaY);

        // Only update if shift changed
        if (newShiftX !== accumulatedShiftX || newShiftY !== accumulatedShiftY) {
          accumulatedShiftX = newShiftX;
          accumulatedShiftY = newShiftY;

          // Restore initial pixels and apply new shift
          const moveGrid = this.getGrid();
          moveGrid.setPixelData(initialPixels.map((row) => row.slice()));
          moveGrid.shiftPixels(accumulatedShiftX, accumulatedShiftY);
          hasChanged = true;
        }
      }

      if (hasChanged && activeButton !== 'image') {
        this.draw();
      }
    };

    const handleEnd = (e) => {
      if (!activeButton) return;

      e.preventDefault();
      e.stopPropagation();

      // Add to history if transform changed
      const history = this.getHistoryManager();
      if (hasChanged && history) {
        if (activeButton === 'image') {
          // For image shift, save pixel data change
          const grid = this.getGrid();
          if (initialPixels && grid) {
            const currentPixels = grid.getPixelData();
            history.addAction({
              type: 'shiftPixels',
              oldPixels: initialPixels.map((row) => row.slice()),
              newPixels: currentPixels.map((row) => row.slice()),
              shiftX: accumulatedShiftX,
              shiftY: accumulatedShiftY
            });
          }
        } else {
          // For background transforms
          const actionType =
            activeButton === 'scale'
              ? 'resizeBackground'
              : activeButton === 'position'
                ? 'moveBackground'
                : 'rotateBackground';

          history.addAction({
            type: actionType,
            oldTransform: {
              x: initialX,
              y: initialY,
              scale: initialScale,
              rotation: initialRotation
            },
            newTransform: {
              x: this.x,
              y: this.y,
              scale: this.scale,
              rotation: this.rotation
            }
          });
        }
      }

      activeButton = null;
      initialPixels = null;
      accumulatedShiftX = 0;
      accumulatedShiftY = 0;
      hasChanged = false;
    };

    // Mouse events for all buttons
    rotateBtn.addEventListener('mousedown', (e) => handleStart(e, 'rotate'));
    scaleBtn.addEventListener('mousedown', (e) => handleStart(e, 'scale'));
    imageBtn.addEventListener('mousedown', (e) => handleStart(e, 'image'));
    positionBtn.addEventListener('mousedown', (e) => handleStart(e, 'position'));

    // Touch events for all buttons
    rotateBtn.addEventListener('touchstart', (e) => handleStart(e, 'rotate'));
    scaleBtn.addEventListener('touchstart', (e) => handleStart(e, 'scale'));
    imageBtn.addEventListener('touchstart', (e) => handleStart(e, 'image'));
    positionBtn.addEventListener('touchstart', (e) => handleStart(e, 'position'));

    // Global move and end handlers (only add once)
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
  }
}

const background = new Background();
if (window.AppContext && typeof window.AppContext.setBackground === 'function') {
  window.AppContext.setBackground(background);
} else {
  window.background = background;
}
