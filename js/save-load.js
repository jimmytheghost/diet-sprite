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
  }

  setupNewProjectModal() {
    const modal = document.getElementById('confirmNewProjectModal');
    const confirmBtn = document.getElementById('confirmNewProjectConfirm');

    if (!modal) return;

    if (window.ModalUtils) {
      this.newProjectModal = window.ModalUtils.create({
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
      return;
    }

    const closeBtn = document.getElementById('confirmNewProjectClose');
    const cancelBtn = document.getElementById('confirmNewProjectCancel');

    const closeModal = () => {
      modal.style.display = 'none';
    };

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    const confirmNewProject = () => {
      this.newProject();
      closeModal();
    };

    confirmBtn.addEventListener('click', confirmNewProject);

    // Keyboard navigation
    const handleModalKeyboard = (e) => {
      // Only handle keyboard events when modal is visible
      if (!modal || modal.style.display === 'none') return;

      if (e.key === 'Enter') {
        e.preventDefault();
        // Activate the currently focused button
        const activeElement = document.activeElement;
        if (activeElement === confirmBtn) {
          confirmNewProject();
        } else if (activeElement === cancelBtn || activeElement === closeBtn) {
          closeModal();
        } else {
          // If no button is focused, default to Confirm
          confirmNewProject();
        }
      } else if (e.key === 'Tab') {
        // Tab navigation between buttons
        e.preventDefault();
        const activeElement = document.activeElement;
        if (activeElement === confirmBtn) {
          cancelBtn.focus();
        } else if (activeElement === cancelBtn || activeElement === closeBtn) {
          confirmBtn.focus();
        } else {
          // If neither is focused, focus Confirm
          confirmBtn.focus();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
      }
    };

    // Add document-level keyboard listener for new project modal
    document.addEventListener('keydown', handleModalKeyboard);
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

    if (window.ModalUtils) {
      this.saveProjectModal = window.ModalUtils.create({
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
    // In custom mode, show the canvas size modal again
    if (window.location.pathname.includes('/custom/')) {
      // Clear existing grid and background
      if (window.grid) {
        window.grid = null;
      }
      if (window.ruler) {
        window.ruler = null;
      }
      if (window.background) {
        window.background.image = null;
        window.background.draw();
        // Reset button icon to "import"
        window.background.updateImportButtonIcon();
      }

      // Clear layers
      if (window.layers) {
        window.layers.layers.clear();
        window.layers.renderLayers();
      }

      // Clear history
      if (window.historyManager) {
        window.historyManager.history = [];
        window.historyManager.historyIndex = -1;
        window.historyManager.updateButtons();
      }

      // Reset current color to black
      if (window.palette) {
        window.palette.setCurrentColor('#000000');
        // Deselect any selected palette colors
        document.querySelectorAll('.palette-color.selected').forEach((el) => {
          el.classList.remove('selected');
        });
      }

      // Show canvas size modal again
      if (window.canvasSizeModal) {
        window.canvasSizeModal.show();
      } else {
        // Reinitialize modal if it doesn't exist
        window.canvasSizeModal = new CanvasSizeModal();
        window.canvasSizeModal.setOnConfirm((width, height) => {
          window.app.initializeGrid(width, height);
        });
      }

      return;
    }

    // For non-custom modes, use standard new project behavior
    // Clear grid
    if (window.grid) {
      window.grid.clear();
    }

    // Clear layers
    if (window.layers) {
      window.layers.layers.clear();
      window.layers.renderLayers();
    }

    // Clear background
    if (window.background) {
      window.background.removeImage(true); // Skip history since we're starting new project
      // Reset button icon to "import"
      window.background.updateImportButtonIcon();
      const opacitySlider = document.getElementById('bgOpacity');
      const opacityValue = document.getElementById('opacityValue');
      if (opacitySlider && opacityValue) {
        opacitySlider.value = 100;
        opacityValue.textContent = '100%';
      }
    }

    // Reset background color and fade
    if (window.grid) {
      window.grid.backgroundColor = '#ffffff';
      window.grid.setFadeToBlack(100);
      const fadeSlider = document.getElementById('bgFadeToBlack');
      const fadeValue = document.getElementById('fadeValue');
      if (fadeSlider && fadeValue) {
        fadeSlider.value = 100;
        fadeValue.textContent = '100%';
      }
    }

    // Reset current color to black
    if (window.palette) {
      window.palette.setCurrentColor('#000000');
      // Deselect any selected palette colors
      document.querySelectorAll('.palette-color.selected').forEach((el) => {
        el.classList.remove('selected');
      });
    }

    // Clear history
    if (window.historyManager) {
      window.historyManager.history = [];
      window.historyManager.historyIndex = -1;
      window.historyManager.updateButtons();
    }

    // Reset zoom
    if (window.grid) {
      window.grid.setZoom(1);
      const zoomLevel = document.getElementById('zoomLevel');
      if (zoomLevel) {
        zoomLevel.textContent = '100%';
      }
    }
  }

  saveProject(fileName = null) {
    try {
      // Gather all project data
      const projectData = {
        version: '1.0',
        savedAt: new Date().toISOString(),
        grid: {
          width: window.grid.width,
          height: window.grid.height,
          cellSize: window.grid.cellSize,
          pixels: window.grid ? window.grid.getPixelData() : []
        },
        layers: window.layers ? window.layers.getAllLayers() : [],
        currentColor: window.palette ? window.palette.getCurrentColor() : '#000000',
        background: {
          hasImage: window.background && window.background.image ? true : false,
          opacity: window.background ? window.background.opacity : 1,
          imageData: null, // We'll try to save background image if possible
          x: window.background ? window.background.x : 0,
          y: window.background ? window.background.y : 0,
          scale: window.background ? window.background.scale : 1.0,
          rotation: window.background ? window.background.rotation : 0
        },
        settings: {
          showGrid: window.grid ? window.grid.showGrid : true,
          zoom: window.grid ? window.grid.zoom : 1,
          backgroundColor: window.grid ? window.grid.backgroundColor : '#ffffff',
          fadeToBlack: window.grid ? window.grid.fadeToBlack : 0
        }
      };

      // Try to save background image as data URL if it exists
      if (window.background && window.background.image) {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = window.background.image.width;
          canvas.height = window.background.image.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(window.background.image, 0, 0);
          projectData.background.imageData = canvas.toDataURL('image/png');
        } catch (e) {
          console.warn('Could not save background image:', e);
        }
      }

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
        if (isSVG) {
          await this.loadSVG(e.target.result);
          return; // Exit early for SVG loading
        }

        const projectData = JSON.parse(e.target.result);

        // Validate project data
        if (!projectData.grid || !projectData.grid.pixels) {
          throw new Error('Invalid project file format');
        }

        // Ensure pixels is a 2D array with proper structure
        if (!Array.isArray(projectData.grid.pixels) || projectData.grid.pixels.length === 0) {
          throw new Error('Invalid pixels data: must be a 2D array');
        }

        // Validate that pixels is a 2D array (check first row)
        if (!Array.isArray(projectData.grid.pixels[0])) {
          throw new Error('Invalid pixels data: must be a 2D array');
        }

        // Confirm before loading (in case user has unsaved work)
        const shouldLoad = await this.showSVGLoadConfirmModal(
          'Load this project? Current work will be replaced.',
          'Load Project'
        );
        if (!shouldLoad) {
          return;
        }

        // For custom mode, we need to reinitialize the grid with the saved dimensions
        // Calculate dimensions from pixel data if not explicitly saved
        let savedWidth = projectData.grid.width || projectData.grid.size;
        let savedHeight = projectData.grid.height || projectData.grid.size;

        // If dimensions not in grid object, calculate from pixel data
        if (!savedWidth || !savedHeight) {
          if (
            projectData.grid.pixels &&
            Array.isArray(projectData.grid.pixels) &&
            projectData.grid.pixels.length > 0
          ) {
            savedHeight = projectData.grid.pixels.length;
            if (Array.isArray(projectData.grid.pixels[0])) {
              savedWidth = projectData.grid.pixels[0].length;
            } else {
              savedWidth = savedHeight; // Default to square if can't determine
            }
          } else {
            // Last resort: default to 150x150
            savedWidth = 150;
            savedHeight = 150;
          }
        }

        // Reinitialize grid with saved dimensions if in custom mode
        if (
          window.location.pathname.includes('/custom/') &&
          window.app &&
          window.app.initializeGrid
        ) {
          window.app.initializeGrid(savedWidth, savedHeight);
        }

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
        if (window.grid && projectData.grid.pixels) {
          window.grid.setPixelData(projectData.grid.pixels);
        }

        // Restore layer visibility settings from saved data
        if (window.layers && savedLayers.size > 0) {
          savedLayers.forEach((savedData, color) => {
            if (window.layers.layers.has(color)) {
              window.layers.layers.get(color).visible = savedData.visible;
            }
          });
          window.layers.renderLayers();
        }

        // Load current color
        if (window.palette && projectData.currentColor) {
          window.palette.setCurrentColor(projectData.currentColor);
        }

        // Load settings FIRST (including zoom) so background image can use correct zoom
        let savedZoom = 1;
        if (window.grid && projectData.settings) {
          if (projectData.settings.zoom !== undefined) {
            savedZoom = projectData.settings.zoom;
            // Use App's setZoomLevel method to properly sync zoom index
            if (window.app && window.app.setZoomLevel) {
              window.app.setZoomLevel(projectData.settings.zoom);
            } else {
              // Fallback if app method not available
              window.grid.setZoom(projectData.settings.zoom);
              if (window.background && window.background.setZoom) {
                window.background.setZoom(projectData.settings.zoom);
              }
              if (window.ruler && window.ruler.setZoom) {
                window.ruler.setZoom(projectData.settings.zoom);
              }
              const zoomLevel = document.getElementById('zoomLevel');
              if (zoomLevel) {
                zoomLevel.textContent = `${Math.round(projectData.settings.zoom * 100)}%`;
              }
            }
          }
        }

        // Load background image (after zoom is set)
        if (window.background && projectData.background) {
          if (projectData.background.imageData) {
            const img = new Image();
            img.onload = () => {
              window.background.image = img;
              window.background.opacity = projectData.background.opacity || 1;

              // Restore transform properties
              window.background.x =
                projectData.background.x !== undefined ? projectData.background.x : 0;
              window.background.y =
                projectData.background.y !== undefined ? projectData.background.y : 0;
              window.background.scale =
                projectData.background.scale !== undefined ? projectData.background.scale : 1.0;
              window.background.rotation =
                projectData.background.rotation !== undefined ? projectData.background.rotation : 0;

              // Ensure background canvas zoom matches grid zoom
              if (window.background.setZoom) {
                window.background.setZoom(savedZoom);
              }

              // Force a redraw to ensure proper alignment
              window.background.draw();

              // Update opacity slider
              const opacitySlider = document.getElementById('bgOpacity');
              const opacityValue = document.getElementById('opacityValue');
              if (opacitySlider && opacityValue) {
                opacitySlider.value = (projectData.background.opacity || 1) * 100;
                opacityValue.textContent = `${Math.round((projectData.background.opacity || 1) * 100)}%`;
              }

              // Update button icon to close (X)
              if (window.background.updateImportButtonIcon) {
                window.background.updateImportButtonIcon();
              }

              // Force a zoom refresh to ensure all components are synchronized
              // This fixes the issue where canvas appears small until user zooms
              setTimeout(() => {
                if (window.app && window.app.setZoomLevel) {
                  const currentZoom = window.grid ? window.grid.zoom : savedZoom;
                  // Trigger a tiny zoom change to force redraw
                  window.app.setZoomLevel(currentZoom + 0.001);
                  setTimeout(() => {
                    window.app.setZoomLevel(currentZoom);
                  }, 10);
                }
              }, 100);
            };
            img.src = projectData.background.imageData;
          } else {
            // No background image
            window.background.image = null;
            // Reset transform properties when no image
            window.background.x = 0;
            window.background.y = 0;
            window.background.scale = 1.0;
            window.background.rotation = 0;
            window.background.draw();

            // Hide handles when no image
            if (window.background.updateHandleVisibility) {
              window.background.updateHandleVisibility();
            }

            // Update button icon back to upload
            if (window.background.updateImportButtonIcon) {
              window.background.updateImportButtonIcon();
            }

            // Force a zoom refresh even when no background image
            setTimeout(() => {
              if (window.app && window.app.setZoomLevel) {
                const currentZoom = window.grid ? window.grid.zoom : savedZoom;
                // Trigger a tiny zoom change to force redraw
                window.app.setZoomLevel(currentZoom + 0.001);
                setTimeout(() => {
                  window.app.setZoomLevel(currentZoom);
                }, 10);
              }
            }, 100);
          }
        }

        // Load remaining settings (zoom already loaded above)
        if (window.grid && projectData.settings) {
          if (projectData.settings.showGrid !== undefined) {
            window.grid.showGrid = projectData.settings.showGrid;
          }
          // Zoom was already set above before loading background image
          if (projectData.settings.backgroundColor !== undefined) {
            window.grid.backgroundColor = projectData.settings.backgroundColor;
          }
          const fadeOpacity =
            projectData.settings.fadeToBlack !== undefined ? projectData.settings.fadeToBlack : 100;
          window.grid.setFadeToBlack(fadeOpacity);
          // Update fade slider UI
          const fadeSlider = document.getElementById('bgFadeToBlack');
          const fadeValueEl = document.getElementById('fadeValue');
          if (fadeSlider && fadeValueEl) {
            fadeSlider.value = fadeOpacity;
            fadeValueEl.textContent = `${fadeOpacity}%`;
          }
          window.grid.draw();
        }

        // Clear history after loading
        if (window.historyManager) {
          window.historyManager.history = [];
          window.historyManager.historyIndex = -1;
          window.historyManager.updateButtons();
        }

        // Final zoom refresh to ensure all components are synchronized
        // This fixes the issue where canvas appears small until user zooms
        setTimeout(() => {
          if (window.app && window.app.setZoomLevel) {
            const currentZoom = window.grid ? window.grid.zoom : savedZoom;
            // Trigger a tiny zoom change to force redraw
            window.app.setZoomLevel(currentZoom + 0.001);
            setTimeout(() => {
              window.app.setZoomLevel(currentZoom);
            }, 10);
          }
        }, 150);

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
      const closeBtn = document.getElementById('svgLoadConfirmClose');
      const cancelBtn = document.getElementById('svgLoadConfirmCancel');
      const continueBtn = document.getElementById('svgLoadConfirmContinue');

      if (!modal || !messageEl || !closeBtn || !cancelBtn || !continueBtn) {
        resolve(false);
        return;
      }

      if (titleEl) {
        titleEl.textContent = title;
      }

      // Set message (preserve line breaks)
      messageEl.innerHTML = message.replace(/\n/g, '<br>');

      let resolved = false;
      const closeModal = (result) => {
        if (resolved) return;
        resolved = true;
        modal.style.display = 'none';
        document.removeEventListener('keydown', keyboardHandler);
        modal.removeEventListener('click', outsideClickHandler);
        resolve(result);
      };

      const keyboardHandler = (e) => {
        if (modal.style.display === 'none') return;

        if (e.key === 'Escape') {
          e.preventDefault();
          closeModal(false);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          closeModal(true);
        } else if (e.key === 'Tab') {
          // Allow Tab navigation between buttons
          e.preventDefault();
          const activeElement = document.activeElement;
          if (activeElement === continueBtn) {
            cancelBtn.focus();
          } else if (activeElement === cancelBtn || activeElement === closeBtn) {
            continueBtn.focus();
          } else {
            continueBtn.focus();
          }
        }
      };

      const outsideClickHandler = (e) => {
        if (e.target === modal) {
          closeModal(false);
        }
      };

      // Set up event listeners
      closeBtn.onclick = () => closeModal(false);
      cancelBtn.onclick = () => closeModal(false);
      continueBtn.onclick = () => closeModal(true);
      modal.addEventListener('click', outsideClickHandler);
      document.addEventListener('keydown', keyboardHandler);

      // Focus the continue button when modal opens
      setTimeout(() => {
        continueBtn.focus();
      }, 10);

      // Show modal
      modal.style.display = 'flex';
    });
  }

  async loadSVG(svgContent) {
    try {
      // Parse SVG to get dimensions first (needed for custom mode grid resize message)
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');

      // Check for parsing errors
      const parserError = svgDoc.querySelector('parsererror');
      if (parserError) {
        throw new Error('Failed to parse SVG: ' + parserError.textContent);
      }

      const svgElement = svgDoc.querySelector('svg');
      if (!svgElement) {
        throw new Error('No SVG element found in file');
      }

      // Get SVG dimensions
      const svgWidth =
        parseFloat(svgElement.getAttribute('width')) ||
        parseFloat(svgElement.getAttribute('viewBox')?.split(' ')[2]) ||
        640;
      const svgHeight =
        parseFloat(svgElement.getAttribute('height')) ||
        parseFloat(svgElement.getAttribute('viewBox')?.split(' ')[3]) ||
        640;

      // Parse CSS styles and collect elements for cell size detection
      const cssStyleMap = this.parseSVGCSSStyles(svgDoc);
      const allRects = svgElement.querySelectorAll('rect');
      const allPaths = svgElement.querySelectorAll('path');

      // Convert paths that represent rectangles to rect-like objects
      const pathRects = [];
      allPaths.forEach((path) => {
        const pathData = this.parsePathToRect(path);
        if (pathData) {
          pathRects.push(pathData);
        }
      });

      // Combine rect and path data for cell size detection
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

      // Determine cell size by finding the most common small rect size
      const widthCounts = {};
      allRectData.forEach((data) => {
        const width = data.width;
        if (width > 0 && width < 100) {
          widthCounts[width] = (widthCounts[width] || 0) + 1;
        }
      });

      let cellSize = 10;
      let maxCount = 0;
      Object.keys(widthCounts).forEach((width) => {
        if (widthCounts[width] > maxCount) {
          maxCount = widthCounts[width];
          cellSize = parseFloat(width);
        }
      });

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

      // cssStyleMap, allRects, allPaths, pathRects, and allRectData already declared above
      // Recalculate cell size with paths included (in case paths weren't included in initial calculation)
      const widthCountsFinal = {};
      allRectData.forEach((data) => {
        const width = data.width;
        if (width > 0 && width < 100) {
          widthCountsFinal[width] = (widthCountsFinal[width] || 0) + 1;
        }
      });

      // Update cell size if paths changed the most common size
      maxCount = 0;
      let finalCellSize = cellSize;
      Object.keys(widthCountsFinal).forEach((width) => {
        if (widthCountsFinal[width] > maxCount) {
          maxCount = widthCountsFinal[width];
          finalCellSize = parseFloat(width);
        }
      });

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

      // Arrays to store pixel-aligned and background elements
      const pixelElements = [];
      const backgroundElements = [];

      // Process <rect> elements
      allRects.forEach((rect) => {
        const x = parseFloat(rect.getAttribute('x')) || 0;
        const y = parseFloat(rect.getAttribute('y')) || 0;
        const width = parseFloat(rect.getAttribute('width')) || 0;
        const height = parseFloat(rect.getAttribute('height')) || 0;

        if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) {
          return;
        }

        // Check if rect is pixel-aligned
        const tolerance = 0.1;
        const isPixelAligned =
          width > 0 &&
          width < 100 && // Reasonable pixel size
          height > 0 &&
          height < 100 &&
          Math.abs(width - finalCellSize) < tolerance &&
          Math.abs(height - finalCellSize) < tolerance &&
          Math.abs(x % finalCellSize) < tolerance &&
          Math.abs(y % finalCellSize) < tolerance;

        if (isPixelAligned) {
          pixelElements.push({ element: rect, x, y, width, height, type: 'rect' });
        } else {
          // Background element - clone the rect with all its attributes
          backgroundElements.push(rect.cloneNode(true));
        }
      });

      // Process <path> elements that represent rectangles
      pathRects.forEach((pathRect) => {
        const { x, y, width, height, element } = pathRect;

        // Check if path rect is pixel-aligned
        const tolerance = 0.1;
        const isPixelAligned =
          width > 0 &&
          width < 100 && // Reasonable pixel size
          height > 0 &&
          height < 100 &&
          Math.abs(width - finalCellSize) < tolerance &&
          Math.abs(height - finalCellSize) < tolerance &&
          Math.abs(x % finalCellSize) < tolerance &&
          Math.abs(y % finalCellSize) < tolerance;

        if (isPixelAligned) {
          pixelElements.push({ element, x, y, width, height, type: 'path' });
        } else {
          // Background element - clone the path with all its attributes
          backgroundElements.push(element.cloneNode(true));
        }
      });

      // Process pixel-aligned elements (both rects and paths)
      pixelElements.forEach(({ element, x, y, type }) => {
        let color = null;

        // Find parent group
        let parent = element.parentElement;
        while (parent && parent !== svgElement) {
          if (parent.tagName === 'g') {
            // Try to get color from group
            color = this.resolveElementColor(element, parent, cssStyleMap, type);
            if (color) break;
          }
          parent = parent.parentElement;
        }

        // If no color from group, try element itself
        if (!color) {
          color = this.resolveElementColor(element, null, cssStyleMap, type);
        }

        // Accept any valid hex color (including #000080, #0000a0, etc.)
        if (color && typeof color === 'string') {
          if (color.startsWith('#')) {
            // Normalize hex color to lowercase for consistency
            const normalizedColor = color.toLowerCase();
            // Calculate grid position from pixel coordinates
            const gridX = Math.round(x / finalCellSize);
            const gridY = Math.round(y / finalCellSize);

            // Validate bounds
            if (gridX >= 0 && gridX < finalGridWidth && gridY >= 0 && gridY < finalGridHeight) {
              pixels[gridY][gridX] = normalizedColor;
            }
          } else {
            // Try to convert named color to hex using browser API
            if (this.isValidColor(color)) {
              const hexColor = this.namedColorToHex(color);
              if (hexColor && hexColor.startsWith('#')) {
                const normalizedColor = hexColor.toLowerCase();
                const gridX = Math.round(x / finalCellSize);
                const gridY = Math.round(y / finalCellSize);

                if (gridX >= 0 && gridX < finalGridWidth && gridY >= 0 && gridY < finalGridHeight) {
                  pixels[gridY][gridX] = normalizedColor;
                }
              }
            }
          }
        }
      });

      // Reinitialize grid with SVG dimensions if needed
      if (
        window.grid &&
        (window.grid.width !== finalGridWidth || window.grid.height !== finalGridHeight)
      ) {
        if (window.app && window.app.initializeGrid) {
          window.app.initializeGrid(finalGridWidth, finalGridHeight);
        } else {
          throw new Error('Cannot resize grid: app.initializeGrid not available');
        }
      }

      // Load background image if we have background elements
      if (window.background && backgroundElements.length > 0) {
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
          window.background.image = img;
          window.background.opacity = 1.0;
          window.background.x = 0;
          window.background.y = 0;
          window.background.scale = 1.0;
          window.background.rotation = 0;

          // Update opacity slider UI
          const opacitySlider = document.getElementById('bgOpacity');
          const opacityValue = document.getElementById('opacityValue');
          if (opacitySlider && opacityValue) {
            opacitySlider.value = 100;
            opacityValue.textContent = '100%';
          }

          window.background.draw();
          if (window.background.updateImportButtonIcon) {
            window.background.updateImportButtonIcon();
          }
        };
        img.src = backgroundDataURL;
      } else {
        // Clear background if no background elements
        if (window.background) {
          window.background.removeImage();
          const opacitySlider = document.getElementById('bgOpacity');
          const opacityValue = document.getElementById('opacityValue');
          if (opacitySlider && opacityValue) {
            opacitySlider.value = 100;
            opacityValue.textContent = '100%';
          }
        }
      }

      // Reset settings to defaults
      if (window.grid) {
        window.grid.showGrid = true;
        window.grid.backgroundColor = '#ffffff';
        window.grid.setFadeToBlack(100);
        const fadeSlider = document.getElementById('bgFadeToBlack');
        const fadeValueEl = document.getElementById('fadeValue');
        if (fadeSlider && fadeValueEl) {
          fadeSlider.value = 100;
          fadeValueEl.textContent = '100%';
        }
      }

      // Reset zoom using app's setZoomLevel to properly sync all components
      if (window.app && window.app.setZoomLevel) {
        window.app.setZoomLevel(0.5); // Default zoom for Custom is 50%
      } else if (window.grid) {
        window.grid.setZoom(0.5);
        if (window.background && window.background.setZoom) {
          window.background.setZoom(0.5);
        }
        if (window.ruler && window.ruler.setZoom) {
          window.ruler.setZoom(0.5);
        }
        const zoomLevel = document.getElementById('zoomLevel');
        if (zoomLevel) {
          zoomLevel.textContent = '50%';
        }
      }

      // Load pixel data (this will trigger scanPixels and rebuild layers)
      if (window.grid) {
        window.grid.setPixelData(pixels);
      }

      // Force a zoom refresh to ensure all components are synchronized
      // This fixes the issue where canvas appears small until user zooms
      setTimeout(() => {
        if (window.app && window.app.setZoomLevel) {
          const currentZoom = window.grid ? window.grid.zoom : 0.5;
          // Trigger a tiny zoom change to force redraw
          window.app.setZoomLevel(currentZoom + 0.001);
          setTimeout(() => {
            window.app.setZoomLevel(currentZoom);
          }, 10);
        }
      }, 100);

      // All layers will be visible by default (scanPixels sets this)
      // Reset current color to black
      if (window.palette) {
        window.palette.setCurrentColor('#000000');
        document.querySelectorAll('.palette-color.selected').forEach((el) => {
          el.classList.remove('selected');
        });
      }

      // Clear history after loading
      if (window.historyManager) {
        window.historyManager.history = [];
        window.historyManager.historyIndex = -1;
        window.historyManager.updateButtons();
      }

      console.info('SVG loaded successfully');
    } catch (error) {
      console.error('Error loading SVG:', error);
      this.showStatusMessage('Error loading SVG: ' + error.message, 'error', 4500);
    }
  }

  parseSVGCSSStyles(svgDoc) {
    const cssMap = {};
    const styleElements = svgDoc.querySelectorAll('defs style, style');

    styleElements.forEach((styleElement) => {
      const cssText = styleElement.textContent || styleElement.innerHTML;
      // Match CSS rules like .st27 { fill: #cd9575; } or .st27 {fill:#cd9575}
      const rulePattern = /\.(\w+)\s*\{\s*fill\s*:\s*([^;]+)\s*;?\s*\}/g;
      let match;
      while ((match = rulePattern.exec(cssText)) !== null) {
        const className = match[1];
        const fillValue = match[2].trim();
        // Handle color values (hex, rgb, named colors)
        if (fillValue.startsWith('#')) {
          // Normalize hex colors to lowercase
          cssMap[className] = fillValue.toLowerCase();
        } else if (fillValue.startsWith('rgb') || fillValue.startsWith('rgba')) {
          // Convert rgb/rgba to hex (simplified - may need enhancement)
          cssMap[className] = fillValue;
        } else {
          // Named color or other - try to use as is or convert
          cssMap[className] = fillValue;
        }
      }
    });

    return cssMap;
  }

  parsePathToRect(path) {
    // Parse SVG path data to extract rectangle coordinates
    // Format: m<x> <y>h<width>v<height>h-<width>z (or similar variations)
    const pathData = path.getAttribute('d');
    if (!pathData) return null;

    // Match patterns like: m280 10h10v10h-10z
    // This represents: move to (280,10), h10 (right 10), v10 (down 10), h-10 (left 10), z (close)
    const match = pathData.match(
      /m\s*([-\d.]+)\s+([-\d.]+)\s*h\s*([-\d.]+)\s*v\s*([-\d.]+)\s*h\s*-([-\d.]+)\s*z/i
    );
    if (match) {
      const x = parseFloat(match[1]);
      const y = parseFloat(match[2]);
      const width = parseFloat(match[3]);
      const height = parseFloat(match[4]);

      // Verify it's a valid rectangle (width/height should match)
      if (
        Math.abs(width - parseFloat(match[5])) < 0.1 &&
        width > 0 &&
        height > 0 &&
        !isNaN(x) &&
        !isNaN(y) &&
        !isNaN(width) &&
        !isNaN(height)
      ) {
        return { x, y, width, height, element: path };
      }
    }

    // Try alternative pattern: m<x> <y>v<height>h<width>v-<height>h-<width>z
    const match2 = pathData.match(
      /m\s*([-\d.]+)\s+([-\d.]+)\s*v\s*([-\d.]+)\s*h\s*([-\d.]+)\s*v\s*-([-\d.]+)\s*h\s*-([-\d.]+)\s*z/i
    );
    if (match2) {
      const x = parseFloat(match2[1]);
      const y = parseFloat(match2[2]);
      const height = parseFloat(match2[3]);
      const width = parseFloat(match2[4]);

      if (
        Math.abs(height - parseFloat(match2[5])) < 0.1 &&
        Math.abs(width - parseFloat(match2[6])) < 0.1 &&
        width > 0 &&
        height > 0 &&
        !isNaN(x) &&
        !isNaN(y) &&
        !isNaN(width) &&
        !isNaN(height)
      ) {
        return { x, y, width, height, element: path };
      }
    }

    return null;
  }

  resolveElementColor(element, group, cssStyleMap, elementType) {
    // For paths, we use resolvePathColor; for rects, we use resolveRectColor logic
    if (elementType === 'path') {
      return this.resolvePathColor(element, group, cssStyleMap);
    } else {
      return this.resolveRectColor(element, group, cssStyleMap);
    }
  }

  resolvePathColor(path, group, cssStyleMap) {
    // 1. Try path's class attribute (resolve from CSS)
    const pathClass = path.getAttribute('class');
    if (pathClass && cssStyleMap[pathClass]) {
      const color = cssStyleMap[pathClass];
      if (color.startsWith('#')) {
        return color.toLowerCase();
      } else if (this.isValidColor(color)) {
        return this.namedColorToHex(color);
      }
    }

    // 2. Try path's fill attribute
    let color = path.getAttribute('fill');
    if (color) {
      color = color.trim();
      // Check for 'none' or empty string
      if (color === 'none' || color === '') {
        // Skip to next check
      } else if (color.startsWith('#')) {
        // Direct hex color - normalize to lowercase
        return color.toLowerCase();
      } else if (this.isValidColor(color)) {
        return this.namedColorToHex(color);
      }
    }

    // 3. Try group's class attribute (resolve from CSS)
    if (group) {
      const groupClass = group.getAttribute('class');
      if (groupClass && cssStyleMap[groupClass]) {
        color = cssStyleMap[groupClass];
        if (color.startsWith('#')) {
          return color.toLowerCase();
        } else if (this.isValidColor(color)) {
          return this.namedColorToHex(color);
        }
      }
    }

    // 4. Try group's fill attribute
    if (group) {
      color = group.getAttribute('fill');
      if (color) {
        color = color.trim();
        if (color === 'none' || color === '') {
          // Skip
        } else if (color.startsWith('#')) {
          // Direct hex color - normalize to lowercase
          return color.toLowerCase();
        } else if (this.isValidColor(color)) {
          return this.namedColorToHex(color);
        }
      }
    }

    // 5. Try group's ID (handle escaped format like _x23_000000)
    if (group) {
      const groupId = group.getAttribute('id');
      if (groupId) {
        color = this.convertEscapedID(groupId);
        if (color && color.startsWith('#')) {
          return color.toLowerCase();
        }
      }
    }

    // 6. Check parent chain for any fill/color
    let parent = path.parentElement;
    while (parent && parent.tagName !== 'svg') {
      if (parent.tagName === 'g') {
        const parentFill = parent.getAttribute('fill');
        if (parentFill) {
          const trimmedFill = parentFill.trim();
          if (trimmedFill !== 'none' && trimmedFill !== '') {
            if (trimmedFill.startsWith('#')) {
              // Direct hex color - normalize to lowercase
              return trimmedFill.toLowerCase();
            } else if (this.isValidColor(trimmedFill)) {
              return this.namedColorToHex(trimmedFill);
            }
          }
        }
        const parentId = parent.getAttribute('id');
        if (parentId) {
          const idColor = this.convertEscapedID(parentId);
          if (idColor && idColor.startsWith('#')) {
            return idColor.toLowerCase();
          }
        }
      }
      parent = parent.parentElement;
    }

    // 7. Default to black if no color found (SVG default for paths without fill is black)
    return '#000000';
  }

  resolveRectColor(rect, group, cssStyleMap) {
    // 1. Try rect's class attribute (resolve from CSS)
    const rectClass = rect.getAttribute('class');
    if (rectClass && cssStyleMap[rectClass]) {
      const color = cssStyleMap[rectClass];
      if (color.startsWith('#')) {
        return color.toLowerCase();
      } else if (this.isValidColor(color)) {
        return this.namedColorToHex(color);
      }
    }

    // 2. Try rect's fill attribute
    let color = rect.getAttribute('fill');
    if (color) {
      color = color.trim();
      if (color === 'none' || color === '') {
        // Skip
      } else if (color.startsWith('#')) {
        return color.toLowerCase();
      } else if (this.isValidColor(color)) {
        return this.namedColorToHex(color);
      }
    }

    // 3. Try group's class attribute (resolve from CSS)
    if (group) {
      const groupClass = group.getAttribute('class');
      if (groupClass && cssStyleMap[groupClass]) {
        color = cssStyleMap[groupClass];
        if (color.startsWith('#')) {
          return color.toLowerCase();
        } else if (this.isValidColor(color)) {
          return this.namedColorToHex(color);
        }
      }
    }

    // 4. Try group's fill attribute
    if (group) {
      color = group.getAttribute('fill');
      if (color) {
        color = color.trim();
        if (color === 'none' || color === '') {
          // Skip
        } else if (color.startsWith('#')) {
          return color.toLowerCase();
        } else if (this.isValidColor(color)) {
          return this.namedColorToHex(color);
        }
      }
    }

    // 5. Try group's ID (handle escaped format like _x23_000000)
    if (group) {
      const groupId = group.getAttribute('id');
      if (groupId) {
        color = this.convertEscapedID(groupId);
        if (color && color.startsWith('#')) {
          return color.toLowerCase();
        }
      }
    }

    return null;
  }

  convertEscapedID(id) {
    // Handle escaped IDs like _x23_000000 or _x0023_000000
    // _x23 = # (2-digit hex) or _x0023 = # (4-digit hex)
    // Format: _x[hex]_[color] where hex represents # character
    const match2 = id.match(/^_x([0-9a-fA-F]{2})_(.+)$/);
    if (match2) {
      const hexCode = String.fromCharCode(parseInt(match2[1], 16));
      const colorValue = match2[2];
      return hexCode + colorValue;
    }
    const match4 = id.match(/^_x([0-9a-fA-F]{4})_(.+)$/);
    if (match4) {
      const hexCode = String.fromCharCode(parseInt(match4[1], 16));
      const colorValue = match4[2];
      return hexCode + colorValue;
    }
    // If it already starts with #, return as is
    if (id.startsWith('#')) {
      return id;
    }
    return null;
  }

  isValidColor(color) {
    // Check if it's a valid CSS color (named color, rgb, etc.)
    const s = new Option().style;
    s.color = color;
    return s.color !== '';
  }

  namedColorToHex(color) {
    // Convert named colors to hex using browser's CSS color parsing
    // This handles all CSS named colors including "navy" (#000080)
    const tempElement = document.createElement('div');
    document.body.appendChild(tempElement); // Add to DOM temporarily
    tempElement.style.color = color;
    const computedColor = window.getComputedStyle(tempElement).color;
    document.body.removeChild(tempElement); // Remove from DOM

    if (computedColor && computedColor.startsWith('rgb')) {
      // Convert rgb(r, g, b) to hex
      const rgbMatch = computedColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (rgbMatch) {
        const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
        const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
        const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
        const hex = `#${r}${g}${b}`.toLowerCase();
        return hex;
      }
    }

    // Fallback: basic mapping for common colors
    const namedColors = {
      white: '#ffffff',
      black: '#000000',
      red: '#ff0000',
      green: '#00ff00',
      blue: '#0000ff',
      yellow: '#ffff00',
      cyan: '#00ffff',
      magenta: '#ff00ff',
      maroon: '#800000',
      navy: '#000080',
      aqua: '#00ffff',
      teal: '#008080'
    };
    // Fallback to basic dictionary if browser API didn't work
    const lowerColor = color.toLowerCase().trim();
    if (namedColors[lowerColor]) {
      return namedColors[lowerColor];
    }

    // Last resort: return original color (shouldn't happen if isValidColor worked)
    return color;
  }

  createBackgroundSVG(svgElement, backgroundElements, width, height) {
    const viewBox = svgElement.getAttribute('viewBox') || `0 0 ${width} ${height}`;
    const xmlns = svgElement.getAttribute('xmlns') || 'http://www.w3.org/2000/svg';

    // Clone the defs (contains styles)
    const defs = svgElement.querySelector('defs');
    let defsString = '';
    if (defs) {
      defsString = defs.outerHTML;
    }

    // Build background SVG
    let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    svg += `<svg xmlns="${xmlns}" width="${width}" height="${height}" viewBox="${viewBox}">\n`;
    if (defsString) {
      svg += defsString + '\n';
    }
    backgroundElements.forEach((element) => {
      svg += element.outerHTML + '\n';
    });
    svg += `</svg>`;

    return svg;
  }
}

window.saveLoad = new SaveLoad();
