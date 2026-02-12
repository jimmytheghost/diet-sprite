class Tools {
  constructor() {
    this.currentTool = 'brush';
    this.previousTool = 'brush'; // Store tool before Command eraser toggle
    this.isCommandEraserActive = false; // Track if Command eraser is active
    this.init();
  }

  init() {
    this.setupToolButtons();
    this.setupCommandEraserToggle();
  }

  setupToolButtons() {
    const toolButtons = document.querySelectorAll('.tool-btn');
    toolButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const tool = btn.dataset.tool;
        this.selectTool(tool);
      });
    });

    // Clear button
    this.setupClearCanvasModal();
    document.getElementById('tool-clear').addEventListener('click', () => {
      this.showClearCanvasModal();
    });
  }

  selectTool(tool) {
    this.currentTool = tool;
    window.currentTool = tool;

    // Update UI
    document.querySelectorAll('.tool-btn').forEach((btn) => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tool="${tool}"]`).classList.add('active');

    // Change cursor
    const canvas = document.getElementById('gridCanvas');
    // Small circle cursor SVG (white circle with black outline for visibility)
    const circleCursor =
      'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5" fill="none" stroke="%23ffffff" stroke-width="1.5"/><circle cx="6" cy="6" r="5" fill="none" stroke="%23000000" stroke-width="0.5"/></svg>\') 6 6, auto';

    if (tool === 'brush') {
      canvas.style.cursor = circleCursor;
    } else if (tool === 'eraser') {
      canvas.style.cursor = circleCursor; // Use circle for eraser too
    } else if (tool === 'eyedropper') {
      canvas.style.cursor = 'crosshair';
    } else if (tool === 'fill') {
      canvas.style.cursor = circleCursor; // Use circle for fill too
    } else {
      canvas.style.cursor = circleCursor; // Default to circle
    }
  }

  getCurrentTool() {
    return this.currentTool;
  }

  setupClearCanvasModal() {
    if (window.ModalUtils) {
      this.clearCanvasModal = window.ModalUtils.create({
        modalId: 'confirmClearCanvasModal',
        closeIds: ['confirmClearCanvasClose'],
        cancelIds: ['confirmClearCanvasCancel'],
        confirmId: 'confirmClearCanvasConfirm',
        trapFocusIds: [
          'confirmClearCanvasConfirm',
          'confirmClearCanvasCancel',
          'confirmClearCanvasClose'
        ],
        enterConfirms: true,
        onClose: () => {
          this.selectTool('brush');
        },
        onConfirm: () => {
          if (window.grid) {
            window.grid.clear();
          }
          return true;
        }
      });
      return;
    }

    // Fallback if ModalUtils is unavailable
    const modal = document.getElementById('confirmClearCanvasModal');
    if (!modal) return;
    this.clearCanvasModal = {
      open: () => {
        modal.style.display = 'flex';
      },
      close: () => {
        modal.style.display = 'none';
        this.selectTool('brush');
      }
    };
  }

  showClearCanvasModal() {
    if (this.clearCanvasModal) {
      this.clearCanvasModal.open();
    }
  }

  setupCommandEraserToggle() {
    // Command key (metaKey on Mac) toggles eraser temporarily
    document.addEventListener('keydown', (e) => {
      // Don't activate if user is typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Only activate if Command is pressed alone (not with other keys like Z for undo)
      if (e.metaKey && !e.ctrlKey && !this.isCommandEraserActive) {
        // Don't interfere with Command+Z (undo), Command+Y (redo), or Command+Space (panning)
        if (e.key !== 'z' && e.key !== 'y' && e.key !== ' ') {
          // Store current tool before switching to eraser
          if (this.currentTool !== 'eraser') {
            this.previousTool = this.currentTool;
          }
          this.isCommandEraserActive = true;
          this.selectTool('eraser');
        }
      }
    });

    document.addEventListener('keyup', (e) => {
      // When Command is released, switch back to previous tool
      if (e.key === 'Meta' && this.isCommandEraserActive) {
        this.isCommandEraserActive = false;
        this.selectTool(this.previousTool);
      }
    });
  }
}

const tools = new Tools();
window.tools = tools;
