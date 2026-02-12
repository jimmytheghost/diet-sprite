class HistoryManager {
  constructor() {
    this.history = [];
    this.historyIndex = -1;
    // No limit - allow undoing all the way back to the beginning
  }

  addAction(action) {
    // Remove any actions after current index (when undoing and then doing new action)
    this.history = this.history.slice(0, this.historyIndex + 1);

    // Add new action
    this.history.push(action);
    this.historyIndex++;

    // No history limit - allow unlimited undo steps

    this.updateButtons();
  }

  undo() {
    if (this.historyIndex < 0) return;

    const action = this.history[this.historyIndex];
    this.applyAction(action, true);
    this.historyIndex--;
    this.updateButtons();
  }

  redo() {
    if (this.historyIndex >= this.history.length - 1) return;

    this.historyIndex++;
    const action = this.history[this.historyIndex];
    this.applyAction(action, false);
    this.updateButtons();
  }

  applyAction(action, isUndo) {
    const pixels = window.grid ? window.grid.getPixelData() : [];

    if (action.type === 'paint') {
      const { x, y, oldColor, newColor } = action;
      pixels[y][x] = isUndo ? oldColor : newColor;
    } else if (action.type === 'fill') {
      const changes = action.changes;
      changes.forEach((change) => {
        pixels[change.y][change.x] = isUndo ? change.oldColor : change.newColor;
      });
    } else if (action.type === 'clear') {
      if (isUndo && action.previousPixels) {
        // Restore previous pixels
        for (let y = 0; y < action.previousPixels.length; y++) {
          for (let x = 0; x < action.previousPixels[y].length; x++) {
            pixels[y][x] = action.previousPixels[y][x];
          }
        }
      } else {
        // Redo: clear all (action.newPixels would be all null)
        const gridWidth = window.grid ? window.grid.width : 150;
        const gridHeight = window.grid ? window.grid.height : 150;
        for (let y = 0; y < gridHeight; y++) {
          for (let x = 0; x < gridWidth; x++) {
            pixels[y][x] = null;
          }
        }
      }
    } else if (action.type === 'clearLayer') {
      // Layer clearing is handled by layers.js, but we need to restore pixels
      if (isUndo && action.clearedPixels) {
        // Restore the pixels that were cleared
        action.clearedPixels.forEach(({ x, y, color }) => {
          pixels[y][x] = color;
        });
      } else {
        // Clear the layer again
        const gridWidth = window.grid ? window.grid.width : 150;
        const gridHeight = window.grid ? window.grid.height : 150;
        for (let y = 0; y < gridHeight; y++) {
          for (let x = 0; x < gridWidth; x++) {
            if (pixels[y][x] === action.color) {
              pixels[y][x] = null;
            }
          }
        }
      }
    } else if (action.type === 'changeLayerColor') {
      const { oldColor, newColor, changes } = action;
      changes.forEach(({ x, y }) => {
        pixels[y][x] = isUndo ? oldColor : newColor;
      });
    } else if (action.type === 'changeBackgroundColor') {
      if (window.grid) {
        window.grid.backgroundColor = isUndo ? action.oldColor : action.newColor;
        window.grid.updateBackgroundColor();
      }
    } else if (action.type === 'removeBackground') {
      // Background image removal/restore
      if (window.background) {
        if (isUndo) {
          // Undo: restore the background image
          window.background.restoreImage(action.savedState);
        } else {
          // Redo: remove the background image again (skip history to avoid duplicate actions)
          window.background.removeImage(true);
        }
      }
      return; // Don't call setPixelData
    } else if (action.type === 'shiftPixels') {
      // Pixel art layer shift
      if (window.grid) {
        const pixelsToUse = isUndo ? action.oldPixels : action.newPixels;
        window.grid.setPixelData(pixelsToUse.map((row) => row.slice()));
      }
      return; // Don't call setPixelData again
    } else if (
      action.type === 'moveBackground' ||
      action.type === 'resizeBackground' ||
      action.type === 'rotateBackground'
    ) {
      if (window.background) {
        const transform = isUndo ? action.oldTransform : action.newTransform;
        window.background.x = transform.x;
        window.background.y = transform.y;
        window.background.scale = transform.scale;
        window.background.rotation = transform.rotation;
        window.background.draw();
      }
      return; // Don't call setPixelData
    } else if (action.type === 'trace') {
      // Handle trace operation (batch paint)
      const changes = action.changes;
      changes.forEach((change) => {
        pixels[change.y][change.x] = isUndo ? change.oldColor : change.newColor;
      });
    }

    if (window.grid && pixels.length > 0) {
      window.grid.setPixelData(pixels);
    }
  }

  updateButtons() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');

    if (undoBtn) {
      undoBtn.disabled = this.historyIndex < 0;
      undoBtn.style.opacity = this.historyIndex < 0 ? '0.5' : '1';
      undoBtn.style.cursor = this.historyIndex < 0 ? 'not-allowed' : 'pointer';
    }

    if (redoBtn) {
      redoBtn.disabled = this.historyIndex >= this.history.length - 1;
      redoBtn.style.opacity = this.historyIndex >= this.history.length - 1 ? '0.5' : '1';
      redoBtn.style.cursor =
        this.historyIndex >= this.history.length - 1 ? 'not-allowed' : 'pointer';
    }
  }
}

const addTouchClickHandler = (element, handler) => {
  if (window.InputUtils && typeof window.InputUtils.addTouchClickHandler === 'function') {
    window.InputUtils.addTouchClickHandler(element, handler);
    return;
  }
  if (element) {
    element.addEventListener('click', handler);
  }
};

class App {
  constructor() {
    this.panX = 0;
    this.panY = 0;
    this.isPanning = false;
    this.panStartX = 0;
    this.panStartY = 0;
    this.zoomLevel = 1;
    this.zoomLevels = [0.1, 0.25, 0.5, 1.0, 1.5, 2.0, 3.0, 4.0]; // 10%, 25%, 50%, 100%, 150%, 200%, 300%, 400%
    this.currentZoomIndex = 3; // Start at 100% (index 3)

    this.init();
  }

  init() {
    // Initialize modules
    if (window.palette) {
      window.palette.init();
    }

    // Set app instance in shared context
    if (window.AppContext) {
      window.AppContext.setApp(this);
    } else {
      window.app = this;
    }

    // Initialize history manager
    const historyManager = new HistoryManager();
    if (window.AppContext) {
      window.AppContext.setHistoryManager(historyManager);
    } else {
      window.historyManager = historyManager;
    }
    historyManager.updateButtons();

    // Grid and ruler will be initialized after canvas size modal confirms dimensions

    this.setupUndoRedo();
    this.setupZoomControls();
    this.setupPanControls();
    this.setupGridToggle();
    this.setupTraceButton();
    this.setupKeyboardShortcuts();
    this.setupPanning();
    this.setupCanvasInfoClick();
    this.setupPanButton();

    // Initialize current tool
    window.currentTool = 'brush';
  }

  setupUndoRedo() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');

    if (!undoBtn || !redoBtn) return;

    // Use touch-friendly handler
    addTouchClickHandler(undoBtn, () => {
      if (window.historyManager && window.historyManager.historyIndex >= 0) {
        window.historyManager.undo();
      }
    });

    addTouchClickHandler(redoBtn, () => {
      if (
        window.historyManager &&
        window.historyManager.historyIndex < window.historyManager.history.length - 1
      ) {
        window.historyManager.redo();
      }
    });
  }

  setupZoomControls() {
    const zoomSlider = document.getElementById('zoomSlider');
    const zoomLevel = document.getElementById('zoomLevel');

    if (!zoomSlider || !zoomLevel) {
      console.error('Zoom controls not found in DOM');
      return;
    }

    // Set initial slider value
    zoomSlider.value = this.zoomLevel;

    const updateZoom = (zoomValue) => {
      this.zoomLevel = parseFloat(zoomValue);

      // Update slider
      zoomSlider.value = this.zoomLevel;

      // Apply zoom to all components
      if (window.grid) {
        window.grid.setZoom(this.zoomLevel);
      }
      if (window.background) {
        window.background.setZoom(this.zoomLevel);
      }
      if (window.ruler) {
        window.ruler.setZoom(this.zoomLevel);
      }

      // Update display
      zoomLevel.textContent = `${Math.round(this.zoomLevel * 100)}%`;

      // Constrain panning
      this.constrainPan();
    };

    // Slider input handler
    zoomSlider.addEventListener('input', (e) => {
      updateZoom(e.target.value);
    });

    // Zoom out button handler
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    if (zoomOutBtn) {
      addTouchClickHandler(zoomOutBtn, () => {
        const newZoom = Math.max(0.1, parseFloat(zoomSlider.value) - 0.1);
        updateZoom(newZoom);
        // Trigger input event to maintain consistency
        zoomSlider.dispatchEvent(new Event('input'));
      });
    }

    // Zoom in button handler
    const zoomInBtn = document.getElementById('zoomInBtn');
    if (zoomInBtn) {
      addTouchClickHandler(zoomInBtn, () => {
        const newZoom = Math.min(4.0, parseFloat(zoomSlider.value) + 0.1);
        updateZoom(newZoom);
        // Trigger input event to maintain consistency
        zoomSlider.dispatchEvent(new Event('input'));
      });
    }

    // Click on zoom level display to enter custom value
    addTouchClickHandler(zoomLevel, () => {
      this.showZoomInputModal(updateZoom);
    });

    // Initialize zoom
    updateZoom(this.zoomLevel);
  }

  // Show zoom input modal
  showZoomInputModal(onConfirm) {
    const modal = document.getElementById('zoomInputModal');
    const input = document.getElementById('zoomInputValue');
    const closeBtn = document.getElementById('zoomInputClose');
    const cancelBtn = document.getElementById('zoomInputCancel');
    const confirmBtn = document.getElementById('zoomInputConfirm');

    if (!modal || !input) {
      return;
    }

    // Set current zoom value
    input.value = Math.round(this.zoomLevel * 100);

    if (window.ModalUtils) {
      if (!this.zoomInputModal) {
        this.zoomInputModal = window.ModalUtils.create({
          modalId: 'zoomInputModal',
          closeIds: ['zoomInputClose'],
          cancelIds: ['zoomInputCancel'],
          confirmId: 'zoomInputConfirm',
          focusId: 'zoomInputValue',
          trapFocusIds: ['zoomInputValue', 'zoomInputConfirm', 'zoomInputCancel', 'zoomInputClose'],
          enterConfirms: true,
          onConfirm: () => {
            const value = parseFloat(input.value);
            if (isNaN(value) || value < 10 || value > 400) {
              input.focus();
              input.select();
              return false;
            }
            if (typeof this.zoomInputOnConfirm === 'function') {
              this.zoomInputOnConfirm(value / 100);
            }
            return true;
          }
        });
      }

      this.zoomInputOnConfirm = onConfirm;
      this.zoomInputModal.open();
      setTimeout(() => input.select(), 20);
      return;
    }

    // Fallback
    closeBtn.onclick = () => {
      modal.style.display = 'none';
    };
    cancelBtn.onclick = () => {
      modal.style.display = 'none';
    };
    confirmBtn.onclick = () => {
      const value = parseFloat(input.value);
      if (!isNaN(value) && value >= 10 && value <= 400 && onConfirm) {
        onConfirm(value / 100);
        modal.style.display = 'none';
      }
    };
    modal.style.display = 'flex';
    setTimeout(() => {
      input.focus();
      input.select();
    }, 10);
  }

  // Method to set zoom (used when loading from JSON)
  setZoomLevel(zoomValue) {
    // Clamp zoom value to valid range
    const clampedValue = Math.max(0.1, Math.min(4.0, parseFloat(zoomValue)));

    this.zoomLevel = clampedValue;

    // Update slider
    const zoomSlider = document.getElementById('zoomSlider');
    if (zoomSlider) {
      zoomSlider.value = this.zoomLevel;
    }

    // Apply zoom to all components
    if (window.grid) {
      window.grid.setZoom(this.zoomLevel);
    }
    if (window.background) {
      window.background.setZoom(this.zoomLevel);
    }
    if (window.ruler) {
      window.ruler.setZoom(this.zoomLevel);
    }

    // Update display
    const zoomLevel = document.getElementById('zoomLevel');
    if (zoomLevel) {
      zoomLevel.textContent = `${Math.round(this.zoomLevel * 100)}%`;
    }

    this.constrainPan();
  }

  setupPanControls() {
    const panUp = document.getElementById('panUp');
    const panDown = document.getElementById('panDown');
    const panLeft = document.getElementById('panLeft');
    const panRight = document.getElementById('panRight');

    if (!panUp || !panDown || !panLeft || !panRight) return;

    const getPanStep = () => {
      // Scale pan step based on zoom level
      if (this.zoomLevel <= 2) {
        return 120;
      } else if (this.zoomLevel <= 4) {
        return 200;
      } else {
        return 280;
      }
    };

    const handlePanUp = () => {
      this.panY += getPanStep();
      this.applyPan();
      this.constrainPan();
    };

    const handlePanDown = () => {
      this.panY -= getPanStep();
      this.applyPan();
      this.constrainPan();
    };

    const handlePanLeft = () => {
      this.panX += getPanStep();
      this.applyPan();
      this.constrainPan();
    };

    const handlePanRight = () => {
      this.panX -= getPanStep();
      this.applyPan();
      this.constrainPan();
    };

    // Use touch-friendly handlers for all pan buttons
    addTouchClickHandler(panUp, handlePanUp);
    addTouchClickHandler(panDown, handlePanDown);
    addTouchClickHandler(panLeft, handlePanLeft);
    addTouchClickHandler(panRight, handlePanRight);
  }

  setupGridToggle() {
    const gridToggle = document.getElementById('gridToggle');
    if (!gridToggle) return;

    addTouchClickHandler(gridToggle, () => {
      if (window.grid) {
        window.grid.toggleGrid();
      }
    });
  }

  setupTraceButton() {
    const traceBtn = document.getElementById('currentColorBtn');
    const traceBtnTablet = document.getElementById('currentColorBtnTablet');
    const traceConfirmModal = document.getElementById('traceConfirmModal');
    const traceConfirmBegin = document.getElementById('traceConfirmBegin');
    const traceConfirmCancel = document.getElementById('traceConfirmCancel');
    const traceConfirmClose = document.getElementById('traceConfirmClose');
    const traceStopBtn = document.getElementById('traceStopBtn');

    const showConfirmation = () => {
      if (!window.background || !window.background.image) {
        return;
      }

      if (window.grid) {
        window.grid.showTraceConfirmation();
      }
    };

    const beginTrace = () => {
      if (window.grid) {
        window.grid.hideTraceConfirmation();
        window.grid.traceBackgroundImage();
      }
    };

    const cancelTrace = () => {
      if (window.grid) {
        window.grid.hideTraceConfirmation();
      }
    };

    const stopTrace = () => {
      if (window.grid) {
        window.grid.stopTrace();
      }
    };

    // Trace button handlers - show confirmation
    if (traceBtn) {
      addTouchClickHandler(traceBtn, showConfirmation);
    }

    if (traceBtnTablet) {
      addTouchClickHandler(traceBtnTablet, showConfirmation);
    }

    // Confirmation modal handlers
    if (traceConfirmBegin) {
      addTouchClickHandler(traceConfirmBegin, beginTrace);
    }

    if (traceConfirmCancel) {
      addTouchClickHandler(traceConfirmCancel, cancelTrace);
    }

    if (traceConfirmClose) {
      addTouchClickHandler(traceConfirmClose, cancelTrace);
    }

    // Keyboard navigation for trace confirmation modal
    const handleTraceModalKeyboard = (e) => {
      // Only handle keyboard events when modal is visible
      if (!traceConfirmModal || traceConfirmModal.style.display === 'none') return;

      if (e.key === 'Enter') {
        e.preventDefault();
        // Activate the currently focused button
        const activeElement = document.activeElement;
        if (activeElement === traceConfirmBegin) {
          beginTrace();
        } else if (activeElement === traceConfirmCancel) {
          cancelTrace();
        } else {
          // If no button is focused, default to Begin Trace
          beginTrace();
        }
      } else if (e.key === 'Tab') {
        // Tab navigation between buttons
        e.preventDefault();
        const activeElement = document.activeElement;
        if (activeElement === traceConfirmBegin) {
          traceConfirmCancel.focus();
        } else if (activeElement === traceConfirmCancel) {
          traceConfirmBegin.focus();
        } else {
          // If neither is focused, focus Begin Trace
          traceConfirmBegin.focus();
        }
      }
    };

    // Add document-level keyboard listener for trace modal
    document.addEventListener('keydown', handleTraceModalKeyboard);

    // Stop button handler
    if (traceStopBtn) {
      addTouchClickHandler(traceStopBtn, stopTrace);
    }
  }

  setupCanvasInfoClick() {
    const canvasInfo = document.getElementById('canvasInfo');
    if (!canvasInfo) {
      console.warn('Canvas info element not found');
      return;
    }

    // Make it look clickable
    canvasInfo.style.cursor = 'pointer';
    canvasInfo.title = 'Click to change canvas size';
    canvasInfo.style.pointerEvents = 'auto'; // Ensure it can receive clicks
    canvasInfo.style.zIndex = '10'; // Ensure it's above canvas elements

    const handleClick = (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!window.grid) {
        console.warn('Grid not initialized yet');
        return;
      }

      // Get current dimensions
      const currentWidth = window.grid.width;
      const currentHeight = window.grid.height;

      // Update modal inputs with current dimensions
      const widthInput = document.getElementById('canvasWidthInput');
      const heightInput = document.getElementById('canvasHeightInput');
      const aspectRatioSelect = document.getElementById('aspectRatioSelect');

      if (widthInput && heightInput) {
        widthInput.value = currentWidth;
        heightInput.value = currentHeight;

        // Determine aspect ratio from current dimensions
        const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
        const divisor = gcd(currentWidth, currentHeight);
        const arWidth = currentWidth / divisor;
        const arHeight = currentHeight / divisor;

        // Try to match to a preset, otherwise use custom
        let aspectRatio = 'custom';
        if (arWidth === 1 && arHeight === 1) {
          aspectRatio = '1x1';
        } else if (arWidth === 16 && arHeight === 9) {
          aspectRatio = '16:9';
        } else if (arWidth === 9 && arHeight === 16) {
          aspectRatio = '9:16';
        } else if (arWidth === 2 && arHeight === 3) {
          aspectRatio = '2:3';
        } else if (arWidth === 4 && arHeight === 5) {
          aspectRatio = '4:5';
        }

        if (aspectRatioSelect) {
          aspectRatioSelect.value = aspectRatio;
          // Update height based on aspect ratio if not custom
          if (window.canvasSizeModal) {
            window.canvasSizeModal.aspectRatio = aspectRatio;
            if (aspectRatio !== 'custom') {
              window.canvasSizeModal.updateHeightInput();
            } else {
              heightInput.disabled = false;
            }
          }
        }
      }

      // Show modal
      if (window.canvasSizeModal) {
        window.canvasSizeModal.show();
      } else {
        console.error('Canvas size modal not found');
      }
    };

    // Use both touch and click handlers to ensure it works
    canvasInfo.addEventListener('click', handleClick);
    canvasInfo.addEventListener('touchend', (e) => {
      e.preventDefault();
      handleClick(e);
    });
  }

  setupPanButton() {
    const panButton = document.getElementById('panButton');
    const panButtonTablet = document.getElementById('panButtonTablet');
    const panButtons = [panButton, panButtonTablet].filter((btn) => btn !== null);

    if (panButtons.length === 0) return;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startPanX = 0;
    let startPanY = 0;

    const handleStart = (e) => {
      e.preventDefault();
      e.stopPropagation();

      isDragging = true;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      startX = clientX;
      startY = clientY;
      startPanX = this.panX;
      startPanY = this.panY;

      panButtons.forEach((btn) => {
        if (btn.style) btn.style.cursor = 'grabbing';
      });
    };

    const handleMove = (e) => {
      if (!isDragging) return;

      e.preventDefault();
      e.stopPropagation();

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - startX;
      const deltaY = clientY - startY;

      this.panX = startPanX + deltaX;
      this.panY = startPanY + deltaY;
      this.constrainPan();
    };

    const handleEnd = (e) => {
      if (!isDragging) return;

      e.preventDefault();
      e.stopPropagation();

      isDragging = false;
      panButtons.forEach((btn) => {
        if (btn.style) btn.style.cursor = 'grab';
      });
    };

    // Add event listeners to all pan buttons
    panButtons.forEach((btn) => {
      // Mouse events
      btn.addEventListener('mousedown', handleStart);
      // Touch events
      btn.addEventListener('touchstart', handleStart, { passive: false });
    });

    // Document-level move/end events (shared for all buttons)
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Undo/Redo
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          window.historyManager?.undo();
        } else if (e.key === 'z' && e.shiftKey) {
          e.preventDefault();
          window.historyManager?.redo();
        } else if (e.key === 'y') {
          e.preventDefault();
          window.historyManager?.redo();
        }
      }

      // Tool shortcuts
      if (!e.ctrlKey && !e.metaKey) {
        switch (e.key) {
          case 'b':
            window.tools?.selectTool('brush');
            break;
          case 'e':
            window.tools?.selectTool('eraser');
            break;
          case 'f':
            window.tools?.selectTool('fill');
            break;
          case 'i':
            window.tools?.selectTool('eyedropper');
            break;
        }
      }
    });
  }

  setupPanning() {
    const canvasArea = document.querySelector('.canvas-area');
    const canvasWrapper = document.getElementById('canvasWrapper');

    if (!canvasArea || !canvasWrapper) return;

    // Mouse events for panning
    canvasArea.addEventListener('mousedown', (e) => {
      // Only pan if space is held or middle mouse button
      if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        e.preventDefault();
        e.stopPropagation();
        this.isPanning = true;
        this.panStartX = e.clientX - this.panX;
        this.panStartY = e.clientY - this.panY;
        canvasArea.style.cursor = 'grabbing';
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (this.isPanning) {
        e.preventDefault();
        e.stopPropagation();

        const newPanX = e.clientX - this.panStartX;
        const newPanY = e.clientY - this.panStartY;

        this.panX = newPanX;
        this.panY = newPanY;
        this.constrainPan();
      }
    });

    document.addEventListener('mouseup', () => {
      if (this.isPanning) {
        this.isPanning = false;
        canvasArea.style.cursor = '';
      }
    });

    // Touch events for panning and pinch zoom (two-finger gestures on iPad)
    let touchStartDistance = 0;
    let touchStartPan = { x: 0, y: 0 };
    let touchStartZoom = 1;
    let isTwoFingerPan = false;
    let isPinchZoom = false;

    canvasArea.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length === 2) {
          e.preventDefault();
          const touch1 = e.touches[0];
          const touch2 = e.touches[1];
          touchStartDistance = Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
              Math.pow(touch2.clientY - touch1.clientY, 2)
          );
          touchStartPan = { x: this.panX, y: this.panY };
          touchStartZoom = this.zoomLevel;
          isTwoFingerPan = true;
          isPinchZoom = false; // Will be determined on first move
        }
      },
      { passive: false }
    );

    canvasArea.addEventListener(
      'touchmove',
      (e) => {
        if (e.touches.length === 2) {
          e.preventDefault();
          const touch1 = e.touches[0];
          const touch2 = e.touches[1];
          const currentDistance = Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
              Math.pow(touch2.clientY - touch1.clientY, 2)
          );

          const distanceChange = currentDistance - touchStartDistance;
          const distanceChangePercent = Math.abs(distanceChange / touchStartDistance);

          // Determine if this is a pinch zoom (significant distance change) or pan
          if (!isPinchZoom && distanceChangePercent > 0.1) {
            isPinchZoom = true;
            isTwoFingerPan = false;
          }

          if (isPinchZoom) {
            // Pinch zoom gesture
            const zoomFactor = currentDistance / touchStartDistance;
            const newZoom = Math.max(0.1, Math.min(4.0, touchStartZoom * zoomFactor));

            // Update zoom via slider
            const zoomSlider = document.getElementById('zoomSlider');
            if (zoomSlider) {
              zoomSlider.value = newZoom;
              const event = new Event('input', { bubbles: true });
              zoomSlider.dispatchEvent(event);
            }
          } else if (isTwoFingerPan) {
            // Two-finger pan gesture
            const midX = (touch1.clientX + touch2.clientX) / 2;
            const midY = (touch1.clientY + touch2.clientY) / 2;

            // Calculate pan offset
            const areaRect = canvasArea.getBoundingClientRect();
            const startMidX = areaRect.left + areaRect.width / 2;
            const startMidY = areaRect.top + areaRect.height / 2;

            this.panX = touchStartPan.x + (midX - startMidX);
            this.panY = touchStartPan.y + (midY - startMidY);
            this.constrainPan();
          }
        }
      },
      { passive: false }
    );

    canvasArea.addEventListener('touchend', () => {
      isTwoFingerPan = false;
      isPinchZoom = false;
    });

    // Handle trackpad/mouse wheel panning and zoom
    canvasArea.addEventListener(
      'wheel',
      (e) => {
        // Ctrl/Cmd + wheel = zoom
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          e.stopPropagation();

          // Calculate zoom delta (negative deltaY = zoom in, positive = zoom out)
          const zoomSpeed = 0.01;
          const zoomDelta = -e.deltaY * zoomSpeed;
          const newZoom = Math.max(0.1, Math.min(4.0, this.zoomLevel + zoomDelta));

          // Update zoom via slider
          const zoomSlider = document.getElementById('zoomSlider');
          if (zoomSlider) {
            zoomSlider.value = newZoom;
            const event = new Event('input', { bubbles: true });
            zoomSlider.dispatchEvent(event);
          }
        } else {
          // Regular wheel = pan
          e.preventDefault();
          e.stopPropagation();

          const panSpeed = 1;
          this.panX -= e.deltaX * panSpeed;
          this.panY -= e.deltaY * panSpeed;

          this.constrainPan();
          this.applyPan();
        }
      },
      { passive: false }
    );
  }

  applyPan() {
    const canvasWrapper = document.getElementById('canvasWrapper');
    if (!canvasWrapper) return;

    canvasWrapper.style.transform = `translate(${this.panX}px, ${this.panY}px)`;
  }

  constrainPan() {
    const canvasArea = document.querySelector('.canvas-area');
    const canvasWrapper = document.getElementById('canvasWrapper');

    if (!canvasArea || !canvasWrapper) return;
    if (!window.grid) return;

    const canvasWidth = window.grid.width * window.grid.cellSize;
    const canvasHeight = window.grid.height * window.grid.cellSize;
    const scaledWidth = canvasWidth * this.zoomLevel;
    const scaledHeight = canvasHeight * this.zoomLevel;
    const areaRect = canvasArea.getBoundingClientRect();

    const areaWidth = areaRect.width - 40;
    const areaHeight = areaRect.height - 40;

    const excessWidth = scaledWidth - areaWidth;
    const excessHeight = scaledHeight - areaHeight;

    if (excessWidth > 0) {
      const constrainedX = Math.max(-excessWidth, Math.min(excessWidth, this.panX));
      this.panX = constrainedX;
    }

    if (excessHeight > 0) {
      const constrainedY = Math.max(-excessHeight, Math.min(excessHeight, this.panY));
      this.panY = constrainedY;
    }

    this.applyPan();
  }

  resetPan() {
    this.panX = 0;
    this.panY = 0;
    this.applyPan();
  }

  initializeGrid(width, height) {
    // Check if grid already exists - if so, resize it non-destructively
    if (window.grid) {
      window.grid.resizeGrid(width, height);
    } else {
      // Initialize grid with custom dimensions
      if (window.AppContext) {
        window.AppContext.setGrid(new Grid(width, height));
      } else {
        window.grid = new Grid(width, height);
      }
    }

    // Initialize or update ruler with custom dimensions
    if (typeof Ruler !== 'undefined') {
      if (window.ruler) {
        // Update existing ruler
        window.ruler.updateDimensions(width, height);
      } else {
        // Initialize ruler with custom dimensions
        window.ruler = new Ruler(width, height);
        if (window.ruler) {
          // Setup canvas now that grid exists
          window.ruler.setupCanvas();
          window.ruler.setZoom(this.zoomLevel);
        }
      }
    }

    // Initialize background
    if (window.background) {
      window.background.setupCanvas();
    }

    // Update zoom to fit canvas
    this.updateZoomForCanvas(width, height);
  }

  updateZoomForCanvas(width, height) {
    // Calculate appropriate starting zoom
    const canvasWidth = width * 10; // cellSize
    const canvasHeight = height * 10;
    const maxDimension = Math.max(canvasWidth, canvasHeight);

    // Find closest zoom level that fits
    let closestIndex = 2; // Default to 50%
    for (let i = 0; i < this.zoomLevels.length; i++) {
      if (maxDimension * this.zoomLevels[i] <= 800) {
        closestIndex = i;
      } else {
        break;
      }
    }

    this.currentZoomIndex = closestIndex;
    this.zoomLevel = this.zoomLevels[this.currentZoomIndex];

    // Update zoom display
    const zoomLevel = document.getElementById('zoomLevel');
    if (zoomLevel) {
      zoomLevel.textContent = `${Math.round(this.zoomLevel * 100)}%`;
    }

    // Apply zoom
    if (window.grid) {
      window.grid.setZoom(this.zoomLevel);
    }
    if (window.background) {
      window.background.setZoom(this.zoomLevel);
    }
    if (window.ruler) {
      window.ruler.setZoom(this.zoomLevel);
    }

    this.constrainPan();
  }
}

// Layers Panel Toggle Functionality
class LayersPanelToggle {
  constructor() {
    this.panel = document.getElementById('layersPanel');
    this.toggleBtn = document.getElementById('layersToggleBtn');
    this.isCollapsed = localStorage.getItem('layersPanelCollapsed') === 'true';

    this.init();
  }

  init() {
    if (!this.panel || !this.toggleBtn) return;

    if (this.isCollapsed) {
      this.panel.classList.add('collapsed');
    }

    addTouchClickHandler(this.toggleBtn, () => {
      this.toggle();
    });
  }

  toggle() {
    this.isCollapsed = !this.isCollapsed;
    if (this.isCollapsed) {
      this.panel.classList.add('collapsed');
    } else {
      this.panel.classList.remove('collapsed');
    }
    localStorage.setItem('layersPanelCollapsed', this.isCollapsed.toString());
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    if (window.AppContext) {
      window.AppContext.setApp(app);
    } else {
      window.app = app;
    }
    new LayersPanelToggle();

    // Initialize canvas size modal
    window.canvasSizeModal = new CanvasSizeModal();
    window.canvasSizeModal.setOnConfirm((width, height) => {
      const appInstance = window.AppContext ? window.AppContext.getApp() : window.app;
      appInstance.initializeGrid(width, height);
    });
  });
} else {
  const app = new App();
  if (window.AppContext) {
    window.AppContext.setApp(app);
  } else {
    window.app = app;
  }
  new LayersPanelToggle();

  // Initialize canvas size modal
  window.canvasSizeModal = new CanvasSizeModal();
  window.canvasSizeModal.setOnConfirm((width, height) => {
    const appInstance = window.AppContext ? window.AppContext.getApp() : window.app;
    appInstance.initializeGrid(width, height);
  });
}
