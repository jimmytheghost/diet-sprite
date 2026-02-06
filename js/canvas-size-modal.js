class CanvasSizeModal {
    constructor() {
        this.modal = null;
        this.aspectRatio = '1x1';
        this.width = 64;
        this.height = 64;
        this.onConfirm = null;
        this.init();
    }

    init() {
        this.modal = document.getElementById('canvasSizeModal');
        if (!this.modal) {
            console.error('Canvas size modal not found');
            return;
        }

        // Get initial aspect ratio from select element
        const aspectRatioSelect = document.getElementById('aspectRatioSelect');
        if (aspectRatioSelect) {
            this.aspectRatio = aspectRatioSelect.value;
            console.log('Initial aspect ratio:', this.aspectRatio);
        }

        this.setupEventListeners();
        this.show();
        
        console.log('CanvasSizeModal initialized');
    }

    setupEventListeners() {
        const aspectRatioSelect = document.getElementById('aspectRatioSelect');
        const widthInput = document.getElementById('canvasWidthInput');
        const heightInput = document.getElementById('canvasHeightInput');
        const okBtn = document.getElementById('canvasSizeOk');
        const cancelBtn = document.getElementById('canvasSizeCancel');

        if (!aspectRatioSelect || !widthInput || !heightInput) {
            console.error('Canvas size modal: Required elements not found', {
                aspectRatioSelect: !!aspectRatioSelect,
                widthInput: !!widthInput,
                heightInput: !!heightInput
            });
            return;
        }

        // Store initial aspect ratio
        this.aspectRatio = aspectRatioSelect.value;
        console.log('Event listeners setup, aspect ratio:', this.aspectRatio);

        // Aspect ratio change handler
        aspectRatioSelect.addEventListener('change', (e) => {
            this.aspectRatio = e.target.value;
            // Read current width from input before calculating
            const currentWidth = parseInt(widthInput.value) || 8;
            this.width = Math.max(8, Math.min(1024, currentWidth));
            widthInput.value = this.width;
            this.updateHeightInput();
        });

        // Width input handler - update height in real-time (no clamping during typing)
        const updateWidthAndHeight = (e) => {
            // Always read current aspect ratio from select to ensure we have latest value
            const currentAspectRatio = aspectRatioSelect.value;
            this.aspectRatio = currentAspectRatio;
            
            // Read value from the input element - allow any value during typing
            const value = widthInput.value;
            
            // Store raw value for height calculation (use 0 if empty/invalid for calculation)
            const numValue = parseInt(value);
            const widthForCalc = isNaN(numValue) ? 0 : numValue;
            
            console.log('Width changed:', { 
                rawValue: value,
                parsedValue: numValue,
                widthForCalc: widthForCalc,
                aspectRatio: this.aspectRatio 
            });
            
            // Immediately update height if not in custom mode (only if we have a valid number)
            if (this.aspectRatio !== 'custom' && !isNaN(numValue)) {
                // Use setTimeout to ensure value is set before calculating
                setTimeout(() => {
                    this.updateHeightInput();
                }, 0);
            }
        };
        
        widthInput.addEventListener('input', updateWidthAndHeight);
        widthInput.addEventListener('keyup', updateWidthAndHeight);

        // Height input handler (only when custom aspect ratio) - allow free typing
        heightInput.addEventListener('input', (e) => {
            // Allow any value to be typed - validation happens on confirm
        });

        // OK button
        okBtn.addEventListener('click', () => {
            this.confirm();
        });

        // Cancel button
        cancelBtn.addEventListener('click', () => {
            this.cancel();
        });

        // Close button
        const closeBtn = document.getElementById('canvasSizeClose');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.cancel();
            });
        }

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display !== 'none') {
                this.cancel();
            }
        });

        // Click outside to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.cancel();
            }
        });

        // Enter key to confirm
        widthInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.confirm();
            }
        });
        heightInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.confirm();
            }
        });
    }

    updateHeightInput() {
        const heightInput = document.getElementById('canvasHeightInput');
        const widthInput = document.getElementById('canvasWidthInput');
        const aspectRatioSelect = document.getElementById('aspectRatioSelect');
        
        if (!heightInput || !widthInput) {
            console.error('Canvas size modal: Height or width input not found');
            return;
        }

        // Always read current aspect ratio from select element
        if (aspectRatioSelect) {
            this.aspectRatio = aspectRatioSelect.value;
        }

        if (this.aspectRatio === 'custom') {
            heightInput.disabled = false;
            return;
        }

        // Read current width from input - use 0 if empty/invalid for calculation
        const currentWidth = parseInt(widthInput.value);
        if (isNaN(currentWidth) || currentWidth <= 0) {
            // Don't update height if width is invalid
            return;
        }

        // Calculate height based on aspect ratio (don't clamp during typing)
        let calculatedHeight = currentWidth;
        
        switch (this.aspectRatio) {
            case '1x1':
                calculatedHeight = currentWidth;
                break;
            case '16:9':
                calculatedHeight = Math.round(currentWidth * (9 / 16));
                break;
            case '9:16':
                calculatedHeight = Math.round(currentWidth * (16 / 9));
                break;
            case '2:3':
                calculatedHeight = Math.round(currentWidth * (3 / 2));
                break;
            case '4:5':
                calculatedHeight = Math.round(currentWidth * (5 / 4));
                break;
        }
        
        // Update height input value (but don't clamp - validation happens on confirm)
        heightInput.disabled = false;
        heightInput.value = String(calculatedHeight);
        heightInput.disabled = true;
        
        console.log('Height updated:', { 
            width: currentWidth, 
            aspectRatio: this.aspectRatio, 
            calculatedHeight: calculatedHeight
        });
    }

    show() {
        if (this.modal) {
            this.modal.style.display = 'flex';
            // Initialize height based on current width and aspect ratio
            const widthInput = document.getElementById('canvasWidthInput');
            if (widthInput) {
                // Read initial width from input (default to 64 if empty)
                const initialWidth = parseInt(widthInput.value);
                if (isNaN(initialWidth) || initialWidth < 8 || initialWidth > 1024) {
                    widthInput.value = '64';
                }
                // Update height based on aspect ratio
                this.updateHeightInput();
                setTimeout(() => {
                    widthInput.focus();
                    widthInput.select();
                }, 100);
            }
        }
    }

    hide() {
        if (this.modal) {
            this.modal.style.display = 'none';
        }
    }

    confirm() {
        const widthInput = document.getElementById('canvasWidthInput');
        const heightInput = document.getElementById('canvasHeightInput');

        if (widthInput && heightInput) {
            const width = parseInt(widthInput.value);
            const height = parseInt(heightInput.value);

            // Validate - check if values are valid numbers
            if (isNaN(width) || isNaN(height)) {
                alert('Please enter valid numbers for width and height.');
                widthInput.focus();
                return;
            }

            // Validate range
            if (width < 8 || width > 1024) {
                alert('Width must be between 8 and 1024 pixels.');
                widthInput.focus();
                widthInput.select();
                return;
            }

            if (height < 8 || height > 1024) {
                alert('Height must be between 8 and 1024 pixels.');
                heightInput.focus();
                heightInput.select();
                return;
            }

            this.width = width;
            this.height = height;

            this.hide();

            // Call callback if set
            if (this.onConfirm) {
                this.onConfirm(this.width, this.height);
            }
        }
    }

    cancel() {
        this.hide();
        // Only navigate away if this is the initial load (modal shown on page load)
        // If grid already exists, user clicked canvas info, so just close modal
        if (!window.grid) {
            // Navigate back to previous page
            const referrer = document.referrer;
            if (referrer && (referrer.includes('/pfp/') || referrer.includes('/sprite/'))) {
                window.location.href = referrer;
            } else {
                // Default to sprite if no referrer
                window.location.href = '/pages/other/diet-sprite-3-2-9/sprite/index.html';
            }
        }
    }

    setOnConfirm(callback) {
        this.onConfirm = callback;
    }
}


