class Ruler {
    constructor(width = 64, height = 64) {
        this.canvas = null;
        this.ctx = null;
        this.showRuler = false;
        this.zoom = 1;
        this.width = width;
        this.height = height;
        this.cellSize = 10;
        
        this.init();
    }

    init() {
        this.canvas = document.getElementById('rulerCanvas');
        if (!this.canvas) {
            console.warn('Ruler canvas not found');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        // Don't setup canvas yet if grid doesn't exist - will be called from App.initializeGrid()
        // Only setup event listeners - these work without grid
        this.setupEventListeners();
    }

    setupCanvas() {
        if (!this.canvas || !this.ctx) {
            console.warn('Ruler canvas or context not available');
            return;
        }
        
        const canvasWidth = this.width * this.cellSize;
        const canvasHeight = this.height * this.cellSize;
        // Set canvas resolution to match zoom level for sharp rendering
        this.canvas.width = canvasWidth * this.zoom;
        this.canvas.height = canvasHeight * this.zoom;
        // Set CSS size to match (1:1 pixel ratio)
        this.canvas.style.width = `${canvasWidth * this.zoom}px`;
        this.canvas.style.height = `${canvasHeight * this.zoom}px`;
        
        this.draw();
    }

    setupEventListeners() {
        const rulerToggle = document.getElementById('rulerToggle');
        if (!rulerToggle) {
            console.warn('Ruler toggle button not found');
            return;
        }
        
        // Remove any existing listeners by cloning the element
        const newRulerToggle = rulerToggle.cloneNode(true);
        rulerToggle.parentNode.replaceChild(newRulerToggle, rulerToggle);
        
        // Add click listener
        newRulerToggle.addEventListener('click', () => {
            this.toggle();
        });
        
        console.log('Ruler event listeners set up');
    }

    toggle() {
        if (!window.grid) {
            console.warn('Cannot toggle ruler: Grid not initialized');
            return;
        }
        this.showRuler = !this.showRuler;
        this.updateButtonState();
        // Ensure canvas is set up before drawing
        if (this.canvas && (this.canvas.width === 0 || this.canvas.height === 0)) {
            this.setupCanvas();
        } else {
            this.draw();
        }
    }

    updateButtonState() {
        const rulerToggle = document.getElementById('rulerToggle');
        if (!rulerToggle) return;
        
        if (this.showRuler) {
            rulerToggle.classList.add('active');
        } else {
            rulerToggle.classList.remove('active');
        }
    }

    setZoom(zoom) {
        this.zoom = zoom;
        if (this.canvas && this.ctx) {
            this.setupCanvas();
        }
    }

    updateDimensions(width, height) {
        this.width = width;
        this.height = height;
        if (this.canvas && this.ctx) {
            this.setupCanvas();
        }
    }

    draw() {
        if (!this.ctx || !this.canvas) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (!this.showRuler) return;
        
        // Get grid reference for cell size and dimensions
        const grid = window.grid;
        if (!grid) return;
        
        const cellSize = grid.cellSize || this.cellSize;
        const canvasWidth = this.width * cellSize;
        const canvasHeight = this.height * cellSize;
        const centerX = (canvasWidth * this.zoom) / 2;
        const centerY = (canvasHeight * this.zoom) / 2;
        const canvasWidthPx = canvasWidth * this.zoom;
        const canvasHeightPx = canvasHeight * this.zoom;
        
        // Use same line width as grid lines
        const lineWidth = 1 / this.zoom;
        this.ctx.lineWidth = lineWidth;
        
        // Draw center lines first (black, vertical and horizontal)
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = lineWidth * 1.5; // Slightly thicker for center lines
        this.ctx.beginPath();
        // Vertical center line
        this.ctx.moveTo(centerX, 0);
        this.ctx.lineTo(centerX, canvasHeightPx);
        // Horizontal center line
        this.ctx.moveTo(0, centerY);
        this.ctx.lineTo(canvasWidthPx, centerY);
        this.ctx.stroke();
        
        // Reset line width for other lines
        this.ctx.lineWidth = lineWidth;
        
        // Draw lines at 8 grid cell increments with alternating hot pink and blue
        const hotPink = '#ff1493';
        const blue = '#0000ff';
        
        // Calculate max distance from center in grid cells
        const maxDistanceCells = Math.max(this.width, this.height) / 2;
        
        // Vertical lines at 8 grid cell increments
        // Color pattern: 8 cells=blue, 16 cells=pink, 24 cells=blue, 32 cells=pink, etc.
        for (let offsetCells = 8; offsetCells <= maxDistanceCells; offsetCells += 8) {
            // Determine color: 8 cells=blue (1), 16 cells=pink (2), 24 cells=blue (3), 32 cells=pink (4), etc.
            const lineNumber = offsetCells / 8;
            const color = lineNumber % 2 === 1 ? blue : hotPink; // Odd = blue, even = pink
            
            this.ctx.strokeStyle = color;
            this.ctx.beginPath();
            
            // Convert grid cells to screen pixels: cells * cellSize * zoom
            const offsetScreenPx = offsetCells * cellSize * this.zoom;
            
            // Left side
            const leftX = centerX - offsetScreenPx;
            if (leftX >= 0) {
                this.ctx.moveTo(leftX, 0);
                this.ctx.lineTo(leftX, canvasHeightPx);
            }
            // Right side
            const rightX = centerX + offsetScreenPx;
            if (rightX <= canvasWidthPx) {
                this.ctx.moveTo(rightX, 0);
                this.ctx.lineTo(rightX, canvasHeightPx);
            }
            this.ctx.stroke();
        }
        
        // Horizontal lines at 8 grid cell increments
        for (let offsetCells = 8; offsetCells <= maxDistanceCells; offsetCells += 8) {
            // Determine color: 8 cells=blue (1), 16 cells=pink (2), 24 cells=blue (3), 32 cells=pink (4), etc.
            const lineNumber = offsetCells / 8;
            const color = lineNumber % 2 === 1 ? blue : hotPink; // Odd = blue, even = pink
            
            this.ctx.strokeStyle = color;
            this.ctx.beginPath();
            
            // Convert grid cells to screen pixels: cells * cellSize * zoom
            const offsetScreenPx = offsetCells * cellSize * this.zoom;
            
            // Top side
            const topY = centerY - offsetScreenPx;
            if (topY >= 0) {
                this.ctx.moveTo(0, topY);
                this.ctx.lineTo(canvasWidthPx, topY);
            }
            // Bottom side
            const bottomY = centerY + offsetScreenPx;
            if (bottomY <= canvasHeightPx) {
                this.ctx.moveTo(0, bottomY);
                this.ctx.lineTo(canvasWidthPx, bottomY);
            }
            this.ctx.stroke();
        }
    }
}

