/* exported Grid */
class Grid {
  constructor(width = 64, height = 64) {
    this.width = width;
    this.height = height;
    this.cellSize = 10;
    this.canvas = null;
    this.ctx = null;
    this.pixels = [];
    this.showGrid = true;
    this.zoom = 1;
    this.isDrawing = false;
    this.backgroundColor = '#ffffff'; // Canvas background color (default white)
    this.fadeToBlack = 100; // 0-100, 100 = full color, 0 = black (inverted for opacity)
    this.gridColor = '#00ffff'; // Grid line color (default cyan - RGB 0, 255, 255)

    this.init();
  }

  init() {
    this.canvas = document.getElementById('gridCanvas');
    this.ctx = this.canvas.getContext('2d');

    // Initialize pixel data (height x width array)
    this.pixels = Array(this.height)
      .fill(null)
      .map(() => Array(this.width).fill(null));

    this.setupCanvas();
    this.setupEventListeners();
    this.setupGridColorPicker();
    this.draw();
  }

  setupCanvas() {
    const canvasWidth = this.width * this.cellSize;
    const canvasHeight = this.height * this.cellSize;
    // Set canvas resolution to match zoom level for sharp rendering
    this.canvas.width = canvasWidth * this.zoom;
    this.canvas.height = canvasHeight * this.zoom;
    // Set CSS size to match (1:1 pixel ratio)
    this.canvas.style.width = `${canvasWidth * this.zoom}px`;
    this.canvas.style.height = `${canvasHeight * this.zoom}px`;
    this.updateBackgroundColor();
    this.updateCanvasInfo();
  }

  // Calculate GCD for aspect ratio simplification
  gcd(a, b) {
    return b === 0 ? a : this.gcd(b, a % b);
  }

  // Update canvas info display (aspect ratio and grid cells)
  updateCanvasInfo() {
    const canvasInfo = document.getElementById('canvasInfo');
    if (!canvasInfo) return;

    const arElement = canvasInfo.querySelector('.canvas-info-ar');
    const pixElement = canvasInfo.querySelector('.canvas-info-pix');
    if (!arElement || !pixElement) return;

    const width = this.width;
    const height = this.height;

    // Calculate aspect ratio
    const divisor = this.gcd(width, height);
    const arWidth = width / divisor;
    const arHeight = height / divisor;

    // Format display
    arElement.textContent = `${arWidth}x${arHeight}`;
    pixElement.textContent = `${width}x${height}`;
  }

  resizeGrid(newWidth, newHeight) {
    // Save existing pixel data
    const oldPixels = this.pixels;
    const oldWidth = this.width;
    const oldHeight = this.height;

    // Update dimensions
    this.width = newWidth;
    this.height = newHeight;

    // Create new pixel array
    this.pixels = Array(this.height)
      .fill(null)
      .map(() => Array(this.width).fill(null));

    // Copy existing pixels to new array (preserve what fits)
    const minWidth = Math.min(oldWidth, newWidth);
    const minHeight = Math.min(oldHeight, newHeight);

    for (let y = 0; y < minHeight; y++) {
      for (let x = 0; x < minWidth; x++) {
        this.pixels[y][x] = oldPixels[y][x];
      }
    }

    // Update layers to reflect new pixel data
    if (window.layers) {
      // Rebuild layers from current pixel data
      window.layers.rebuildLayers();
    }

    // Update canvas and redraw
    this.setupCanvas();
    this.draw();

    // Update canvas info display
    this.updateCanvasInfo();
  }

  updateBackgroundColor() {
    const canvasWrapper = document.getElementById('canvasWrapper');
    if (canvasWrapper) {
      const blendedColor = this.blendColorWithBlack(this.backgroundColor, this.fadeToBlack);
      canvasWrapper.style.backgroundColor = blendedColor;
    }
  }

  blendColorWithBlack(color, opacityPercent) {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Blend with black (0, 0, 0) based on opacity percentage
    // opacityPercent 100 = full color, opacityPercent 0 = black
    const blendFactor = opacityPercent / 100;
    const blendedR = Math.round(r * blendFactor);
    const blendedG = Math.round(g * blendFactor);
    const blendedB = Math.round(b * blendFactor);

    // Convert back to hex
    return `#${blendedR.toString(16).padStart(2, '0')}${blendedG.toString(16).padStart(2, '0')}${blendedB.toString(16).padStart(2, '0')}`;
  }

  setFadeToBlack(value) {
    this.fadeToBlack = value;
    this.updateBackgroundColor();
  }

  setupEventListeners() {
    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
    this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());

    // Touch events for mobile
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleMouseDown(e.touches[0]);
    });
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      this.handleMouseMove(e.touches[0]);
    });
    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.handleMouseUp();
    });
  }

  getCellFromEvent(e) {
    const rect = this.canvas.getBoundingClientRect();

    // getBoundingClientRect() gives the canvas position AFTER the wrapper's transform
    // So rect.left/rect.top already account for the pan transform
    // We just need to calculate relative position and convert to grid coordinates
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;

    // Convert to grid coordinates accounting for zoom
    // The canvas size is cellSize * width/height * zoom, so each cell is cellSize * zoom pixels
    const x = Math.floor(relativeX / (this.cellSize * this.zoom));
    const y = Math.floor(relativeY / (this.cellSize * this.zoom));

    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      return { x, y };
    }
    return null;
  }

  handleMouseDown(e) {
    // Don't draw if panning
    if (window.app && window.app.isPanning) {
      return;
    }
    const cell = this.getCellFromEvent(e);
    if (cell) {
      this.isDrawing = true;
      this.drawCell(cell.x, cell.y);
    }
  }

  handleMouseMove(e) {
    if (this.isDrawing) {
      const cell = this.getCellFromEvent(e);
      if (cell) {
        this.drawCell(cell.x, cell.y);
      }
    }
  }

  handleMouseUp() {
    this.isDrawing = false;
  }

  drawCell(x, y) {
    const tool = window.currentTool || 'brush';
    const color = palette.getCurrentColor();

    // Store previous state for undo
    const previousColor = this.pixels[y][x];

    if (tool === 'brush') {
      this.pixels[y][x] = color;
      // Update layers
      if (previousColor !== color) {
        if (previousColor && window.layers) {
          window.layers.updateColorCount(previousColor, -1);
        }
        if (color && window.layers) {
          window.layers.addColor(color);
          window.layers.updateColorCount(color, 1);
        }
      }
    } else if (tool === 'eraser') {
      this.pixels[y][x] = null;
      // Update layers
      if (previousColor && window.layers) {
        window.layers.updateColorCount(previousColor, -1);
      }
    } else if (tool === 'fill') {
      this.floodFill(x, y, color);
      return; // floodFill handles drawing
    } else if (tool === 'eyedropper') {
      // First check if there's a drawn pixel at this location
      let pickedColor = this.pixels[y][x];

      // If no drawn pixel, check the background image
      if (!pickedColor && window.background && window.background.image) {
        pickedColor = this.getColorFromBackgroundImage(x, y);
      }

      if (pickedColor) {
        palette.setCurrentColor(pickedColor);
        // Switch back to brush mode after picking a color
        if (window.tools) {
          window.tools.selectTool('brush');
        }
      }
      return;
    }

    // Add to history if color changed
    if (previousColor !== this.pixels[y][x]) {
      window.historyManager?.addAction({
        type: 'paint',
        x,
        y,
        oldColor: previousColor,
        newColor: this.pixels[y][x]
      });
    }

    this.draw();
  }

  floodFill(startX, startY, fillColor) {
    const targetColor = this.pixels[startY][startX];

    // If target color is same as fill color, do nothing
    if (targetColor === fillColor) return;

    const changes = [];
    const stack = [{ x: startX, y: startY }];
    const visited = new Set();

    while (stack.length > 0) {
      const { x, y } = stack.pop();
      const key = `${x},${y}`;

      if (visited.has(key)) continue;
      if (x < 0 || x >= this.width || y < 0 || y >= this.height) continue;
      if (this.pixels[y][x] !== targetColor) continue;

      visited.add(key);
      const oldColor = this.pixels[y][x];
      changes.push({ x, y, oldColor: oldColor, newColor: fillColor });
      this.pixels[y][x] = fillColor;

      // Update layers
      if (window.layers) {
        if (oldColor) {
          window.layers.updateColorCount(oldColor, -1);
        }
        if (fillColor) {
          window.layers.addColor(fillColor);
          window.layers.updateColorCount(fillColor, 1);
        }
      }

      // Add neighbors
      stack.push({ x: x + 1, y });
      stack.push({ x: x - 1, y });
      stack.push({ x, y: y + 1 });
      stack.push({ x, y: y - 1 });
    }

    // Add to history
    if (changes.length > 0) {
      window.historyManager?.addAction({
        type: 'fill',
        changes
      });
    }

    this.draw();
  }

  clear() {
    const previousPixels = JSON.parse(JSON.stringify(this.pixels));
    this.pixels = Array(this.height)
      .fill(null)
      .map(() => Array(this.width).fill(null));
    window.historyManager?.addAction({
      type: 'clear',
      previousPixels: previousPixels
    });
    // Clear all layers
    if (window.layers) {
      window.layers.layers.clear();
      window.layers.renderLayers();
    }
    this.draw();
  }

  draw() {
    // Save context state
    this.ctx.save();

    // Reset transform to clear properly
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Clear canvas using actual canvas dimensions
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply zoom scale for drawing
    this.ctx.scale(this.zoom, this.zoom);

    // Draw pixels (respecting layer visibility)
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const color = this.pixels[y][x];
        if (color) {
          // Check if this color's layer is visible
          if (window.layers && !window.layers.isVisible(color)) {
            continue; // Skip hidden layers
          }
          this.ctx.fillStyle = color;
          this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
        }
      }
    }

    // Draw grid lines - use 1px line width scaled for sharp rendering
    if (this.showGrid) {
      this.ctx.strokeStyle = this.gridColor;
      // Use 1 pixel line width (will be scaled by zoom for sharpness)
      this.ctx.lineWidth = 1 / this.zoom;

      const canvasWidth = this.width * this.cellSize;
      const canvasHeight = this.height * this.cellSize;

      // Draw vertical lines
      for (let i = 0; i <= this.width; i++) {
        const pos = i * this.cellSize;
        this.ctx.beginPath();
        this.ctx.moveTo(pos, 0);
        this.ctx.lineTo(pos, canvasHeight);
        this.ctx.stroke();
      }

      // Draw horizontal lines
      for (let i = 0; i <= this.height; i++) {
        const pos = i * this.cellSize;
        this.ctx.beginPath();
        this.ctx.moveTo(0, pos);
        this.ctx.lineTo(canvasWidth, pos);
        this.ctx.stroke();
      }
    }

    // Restore context state
    this.ctx.restore();
  }

  toggleGrid() {
    this.showGrid = !this.showGrid;
    this.draw();
  }

  setupGridColorPicker() {
    const gridColorBtn = document.getElementById('gridColorBtn');
    const gridColorPreview = document.getElementById('gridColorPreview');

    if (!gridColorBtn || !gridColorPreview) return;

    // Set initial color preview
    gridColorPreview.style.backgroundColor = this.gridColor;

    // Open color picker when clicked
    gridColorBtn.addEventListener('click', () => {
      if (window.layers) {
        window.layers.openColorPickerForGrid(this.gridColor);
      }
    });
  }

  setGridColor(color) {
    this.gridColor = color;
    // Update preview thumbnail
    const gridColorPreview = document.getElementById('gridColorPreview');
    if (gridColorPreview) {
      gridColorPreview.style.backgroundColor = color;
    }
    // Redraw grid with new color
    this.draw();
  }

  updateGridColorPreview() {
    const gridColorPreview = document.getElementById('gridColorPreview');
    if (gridColorPreview) {
      gridColorPreview.style.backgroundColor = this.gridColor;
    }
  }

  setZoom(level) {
    this.zoom = level;
    const canvasWidth = this.width * this.cellSize;
    const canvasHeight = this.height * this.cellSize;

    // Scale the actual canvas resolution, not just CSS size
    // This ensures grid lines and pixels remain sharp at all zoom levels
    this.canvas.width = canvasWidth * this.zoom;
    this.canvas.height = canvasHeight * this.zoom;

    // Set CSS size to match actual resolution (1:1 pixel ratio)
    this.canvas.style.width = `${canvasWidth * this.zoom}px`;
    this.canvas.style.height = `${canvasHeight * this.zoom}px`;

    // Redraw everything at the new resolution
    this.draw();
  }

  getPixelData() {
    return this.pixels;
  }

  setPixelData(data) {
    // Validate data structure
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.error('setPixelData: Invalid data - must be a non-empty 2D array');
      return;
    }

    // Validate it's a 2D array
    if (!Array.isArray(data[0])) {
      console.error('setPixelData: Invalid data - must be a 2D array');
      return;
    }

    // Ensure data size matches grid size
    if (data.length !== this.height || (data[0] && data[0].length !== this.width)) {
      console.warn(
        `setPixelData: Data size (${data.length}x${data[0] ? data[0].length : 0}) doesn't match grid size (${this.height}x${this.width}). Resizing...`
      );
      // Resize data to match grid size
      const resizedData = Array(this.height)
        .fill(null)
        .map(() => Array(this.width).fill(null));
      const minY = Math.min(data.length, this.height);
      const minX = Math.min(data[0] ? data[0].length : 0, this.width);
      for (let y = 0; y < minY; y++) {
        if (data[y] && Array.isArray(data[y])) {
          for (let x = 0; x < minX; x++) {
            resizedData[y][x] = data[y][x] || null;
          }
        }
      }
      this.pixels = resizedData;
    } else {
      this.pixels = data;
    }

    // Rescan layers after setting pixel data
    if (window.layers) {
      window.layers.scanPixels();
    }
    this.draw();
  }

  shiftPixels(deltaX, deltaY) {
    // Shift all pixels by grid cells (deltaX and deltaY are in grid cells, not pixels)
    const newPixels = Array(this.height)
      .fill(null)
      .map(() => Array(this.width).fill(null));

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const newX = x + deltaX;
        const newY = y + deltaY;

        // Only copy pixels that are within bounds
        if (newX >= 0 && newX < this.width && newY >= 0 && newY < this.height) {
          newPixels[newY][newX] = this.pixels[y][x];
        }
      }
    }

    this.pixels = newPixels;
    // Rescan layers after shifting
    if (window.layers) {
      window.layers.scanPixels();
    }
    this.draw();
  }

  getColorFromBackgroundImage(gridX, gridY) {
    // Get color from background canvas at the specified grid cell
    if (!window.background || !window.background.canvas || !window.background.image) {
      return null;
    }

    const bgCanvas = window.background.canvas;
    const pixelX = gridX * this.cellSize + Math.floor(this.cellSize / 2); // Center of the cell
    const pixelY = gridY * this.cellSize + Math.floor(this.cellSize / 2);

    // Get pixel data from background canvas
    const imageData = bgCanvas.getContext('2d').getImageData(pixelX, pixelY, 1, 1);
    const [r, g, b, a] = imageData.data;

    // If pixel is transparent, return null
    if (a === 0) {
      return null;
    }

    // Convert RGB to hex
    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    return hex;
  }

  // Color distance calculation using Euclidean distance in RGB space
  colorDistance(r1, g1, b1, r2, g2, b2) {
    return Math.sqrt(Math.pow(r2 - r1, 2) + Math.pow(g2 - g1, 2) + Math.pow(b2 - b1, 2));
  }

  // Find closest palette color to given RGB color
  findClosestPaletteColor(r, g, b) {
    if (!window.SNES_PALETTE) {
      // Fallback: try to get from palette.js
      console.error('SNES_PALETTE not found');
      return '#000000';
    }

    let minDistance = Infinity;
    let closestColor = '#000000';

    window.SNES_PALETTE.forEach((hexColor) => {
      // Convert hex to RGB
      const hex = hexColor.replace('#', '');
      const paletteR = parseInt(hex.substring(0, 2), 16);
      const paletteG = parseInt(hex.substring(2, 4), 16);
      const paletteB = parseInt(hex.substring(4, 6), 16);

      const distance = this.colorDistance(r, g, b, paletteR, paletteG, paletteB);
      if (distance < minDistance) {
        minDistance = distance;
        closestColor = hexColor;
      }
    });

    return closestColor;
  }

  // Sample background image at a grid cell, accounting for transforms and sampling at 100% opacity
  sampleBackgroundImageAtCell(gridX, gridY) {
    if (!window.background || !window.background.image) {
      return null;
    }

    const bg = window.background;
    const image = bg.image;
    const canvasWidth = this.width * this.cellSize;
    const canvasHeight = this.height * this.cellSize;
    const canvasSize = Math.max(canvasWidth, canvasHeight); // Use max for square temp canvas

    // Calculate cell bounds in canvas coordinates
    const cellLeft = gridX * this.cellSize;
    const cellTop = gridY * this.cellSize;
    const cellRight = cellLeft + this.cellSize;
    const cellBottom = cellTop + this.cellSize;

    // Sample points: center + 4 corners = 5 samples
    const samplePoints = [
      { x: cellLeft + this.cellSize / 2, y: cellTop + this.cellSize / 2 }, // Center
      { x: cellLeft + 2, y: cellTop + 2 }, // Top-left
      { x: cellRight - 2, y: cellTop + 2 }, // Top-right
      { x: cellLeft + 2, y: cellBottom - 2 }, // Bottom-left
      { x: cellRight - 2, y: cellBottom - 2 } // Bottom-right
    ];

    // Create temporary canvas to draw image at 100% opacity with transforms
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvasSize;
    tempCanvas.height = canvasSize;
    const tempCtx = tempCanvas.getContext('2d');

    // Draw image with transforms at 100% opacity (ignoring bg.opacity)
    tempCtx.save();
    tempCtx.globalAlpha = 1.0; // Always sample at 100% opacity

    // Canvas center point
    const canvasCenterX = canvasSize / 2;
    const canvasCenterY = canvasSize / 2;

    // Calculate base scale to fit image to canvas (maintain aspect ratio)
    const imageAspect = image.width / image.height;
    let baseWidth = canvasSize;
    let baseHeight = canvasSize;

    if (image.width > image.height) {
      baseHeight = canvasSize / imageAspect;
    } else {
      baseWidth = canvasSize * imageAspect;
    }

    // Apply transforms in order: translate, rotate, scale
    tempCtx.translate(canvasCenterX + bg.x, canvasCenterY + bg.y);
    tempCtx.rotate(bg.rotation);
    tempCtx.scale(bg.scale, bg.scale);

    // Draw image centered at origin
    tempCtx.drawImage(image, -baseWidth / 2, -baseHeight / 2, baseWidth, baseHeight);

    tempCtx.restore();

    // Sample pixels from temporary canvas
    let totalR = 0;
    let totalG = 0;
    let totalB = 0;
    let validSamples = 0;

    samplePoints.forEach((point) => {
      const imageData = tempCtx.getImageData(Math.floor(point.x), Math.floor(point.y), 1, 1);
      const [r, g, b, a] = imageData.data;

      // Only count non-transparent pixels
      if (a > 0) {
        totalR += r;
        totalG += g;
        totalB += b;
        validSamples++;
      }
    });

    // If no valid samples, return null
    if (validSamples === 0) {
      return null;
    }

    // Calculate average color
    const avgR = Math.round(totalR / validSamples);
    const avgG = Math.round(totalG / validSamples);
    const avgB = Math.round(totalB / validSamples);

    return { r: avgR, g: avgG, b: avgB };
  }

  // Check if a color is primarily white (to skip white background pixels)
  isPrimarilyWhite(r, g, b, threshold = 240) {
    // If all RGB values are above threshold, consider it white/very light
    // Default threshold of 240 catches white and very light colors
    return r >= threshold && g >= threshold && b >= threshold;
  }

  // Show trace progress modal
  showTraceProgress() {
    const modal = document.getElementById('traceProgressModal');
    if (modal) {
      modal.style.display = 'flex';
      const progressBar = document.getElementById('traceProgressBar');
      const progressText = document.getElementById('traceProgressText');
      const progressPercent = document.getElementById('traceProgressPercent');
      const statusText = document.getElementById('traceStatusText');
      if (progressBar) progressBar.style.width = '0%';
      if (progressText) progressText.textContent = 'Processing...';
      if (progressPercent) progressPercent.textContent = '0%';
      if (statusText) statusText.textContent = 'Starting trace operation...';
    }
  }

  // Hide trace progress modal
  hideTraceProgress() {
    const modal = document.getElementById('traceProgressModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  // Update trace progress
  updateTraceProgress(processed, total, drawn, skipped) {
    const progressBar = document.getElementById('traceProgressBar');
    const progressText = document.getElementById('traceProgressText');
    const progressPercent = document.getElementById('traceProgressPercent');
    const statusText = document.getElementById('traceStatusText');

    const percent = Math.round((processed / total) * 100);

    if (progressBar) progressBar.style.width = `${percent}%`;
    if (progressPercent) progressPercent.textContent = `${percent}%`;
    if (progressText)
      progressText.textContent = `Processed ${processed.toLocaleString()} of ${total.toLocaleString()} pixels`;
    if (statusText)
      statusText.textContent = `${drawn} pixels drawn, ${skipped} white pixels skipped`;
  }

  // Show trace confirmation modal
  showTraceConfirmation() {
    const modal = document.getElementById('traceConfirmModal');
    if (modal) {
      modal.style.display = 'flex';
      // Focus the Begin Trace button (Yes) when modal opens
      const beginBtn = document.getElementById('traceConfirmBegin');
      if (beginBtn) {
        // Use setTimeout to ensure modal is visible before focusing
        setTimeout(() => {
          beginBtn.focus();
        }, 10);
      }
    }
  }

  // Hide trace confirmation modal
  hideTraceConfirmation() {
    const modal = document.getElementById('traceConfirmModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  // Stop trace operation
  stopTrace() {
    if (this.traceCancelled !== undefined) {
      this.traceCancelled = true;
      this.hideTraceProgress();
    }
  }

  // Trace background image: sample each cell and draw matching palette colors (batched for performance)
  traceBackgroundImage() {
    if (!window.background || !window.background.image) {
      return;
    }

    // Show progress modal
    this.showTraceProgress();

    // Reset cancellation flag
    this.traceCancelled = false;

    const changes = [];
    let skippedWhitePixels = 0;
    const totalPixels = this.width * this.height;
    let processedPixels = 0;

    // Create array of all pixel coordinates to process
    const pixelsToProcess = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        pixelsToProcess.push({ x, y });
      }
    }

    // Process in batches to avoid blocking the UI
    const BATCH_SIZE = 1000; // Process 1000 pixels per batch (increased from 500 for better performance)
    let currentIndex = 0;

    const processBatch = () => {
      // Check if trace was cancelled
      if (this.traceCancelled) {
        return;
      }

      const batchEnd = Math.min(currentIndex + BATCH_SIZE, pixelsToProcess.length);

      for (let i = currentIndex; i < batchEnd; i++) {
        // Check for cancellation during batch
        if (this.traceCancelled) {
          return;
        }

        const { x, y } = pixelsToProcess[i];
        processedPixels++;

        // Sample background image at this cell
        const sampledColor = this.sampleBackgroundImageAtCell(x, y);

        if (sampledColor) {
          // Skip white/very light pixels (white backgrounds)
          if (this.isPrimarilyWhite(sampledColor.r, sampledColor.g, sampledColor.b)) {
            skippedWhitePixels++;
            continue;
          }

          // Find closest palette color
          const paletteColor = this.findClosestPaletteColor(
            sampledColor.r,
            sampledColor.g,
            sampledColor.b
          );

          // Store previous color for undo
          const previousColor = this.pixels[y][x];

          // Only draw if color would change
          if (previousColor !== paletteColor) {
            // Set pixel color
            this.pixels[y][x] = paletteColor;

            // Update layers
            if (previousColor && window.layers) {
              window.layers.updateColorCount(previousColor, -1);
            }
            if (paletteColor && window.layers) {
              window.layers.addColor(paletteColor);
              window.layers.updateColorCount(paletteColor, 1);
            }

            // Track change for undo/redo
            changes.push({
              x,
              y,
              oldColor: previousColor,
              newColor: paletteColor
            });
          }
        }
      }

      currentIndex = batchEnd;

      // Update progress
      this.updateTraceProgress(processedPixels, totalPixels, changes.length, skippedWhitePixels);

      // Continue processing if there are more pixels and not cancelled
      if (currentIndex < pixelsToProcess.length && !this.traceCancelled) {
        // Use setTimeout with minimal delay (0ms) to yield control back to browser
        setTimeout(processBatch, 0);
      } else {
        // All pixels processed or cancelled - finish up
        if (!this.traceCancelled) {
          this.finishTrace(changes, skippedWhitePixels);
        } else {
          // If cancelled, still save what was done so far
          if (changes.length > 0) {
            window.historyManager?.addAction({
              type: 'trace',
              changes
            });
            if (window.layers) {
              window.layers.renderLayers();
            }
            this.draw();
          }
          this.hideTraceProgress();
        }
      }
    };

    // Start processing
    setTimeout(processBatch, 0);
  }

  // Finish trace operation
  finishTrace(changes, skippedWhitePixels) {
    // Add to history as batch action
    if (changes.length > 0) {
      window.historyManager?.addAction({
        type: 'trace',
        changes
      });
    }

    // Update layers UI
    if (window.layers) {
      window.layers.renderLayers();
    }

    // Redraw grid
    this.draw();

    // Update final progress
    const totalPixels = this.width * this.height;
    this.updateTraceProgress(totalPixels, totalPixels, changes.length, skippedWhitePixels);

    // Hide progress modal after a brief delay
    setTimeout(() => {
      this.hideTraceProgress();
    }, 500);
  }
}

// Grid will be initialized after canvas size modal confirms dimensions
// window.grid will be set in app.js after modal confirmation
