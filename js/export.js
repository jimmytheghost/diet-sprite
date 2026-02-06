class Export {
    constructor() {
        this.exportType = null; // 'png' or 'jpg'
        this.init();
    }

    init() {
        document.getElementById('exportPNG').addEventListener('click', () => this.showExportModal('png'));
        document.getElementById('exportSVG').addEventListener('click', () => this.showSVGExportModal());
        document.getElementById('exportALL').addEventListener('click', () => this.showExportAllModal());
        this.setupExportModal();
        this.setupSVGExportModal();
        this.setupExportAllModal();
    }

    setupExportModal() {
        const modal = document.getElementById('exportBgModal');
        const closeBtn = document.getElementById('exportBgClose');
        const cancelBtn = document.getElementById('exportBgCancel');

        const closeModal = () => {
            modal.style.display = 'none';
            this.exportType = null;
        };

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display !== 'none') {
                closeModal();
            }
        });
    }

    setupSVGExportModal() {
        const modal = document.getElementById('svgExportSizeModal');
        const closeBtn = document.getElementById('svgExportSizeClose');
        const cancelBtn = document.getElementById('svgExportSizeCancel');

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

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display !== 'none') {
                closeModal();
            }
        });
    }

    showExportModal(type) {
        this.exportType = type;
        const modal = document.getElementById('exportBgModal');
        const title = document.getElementById('exportBgModalTitle');
        const options = document.getElementById('exportBgOptions');
        
        title.textContent = `Export ${type.toUpperCase()} - Choose Background`;
        options.innerHTML = '';

        if (type === 'png') {
            // PNG options: transparent, background color, white, black, grey
            const bgColor = (window.grid && window.grid.backgroundColor) ? window.grid.backgroundColor : '#000000';
            const pngOptions = [
                { value: 'transparent', label: 'Transparent', color: 'transparent' },
                { value: 'bgcolor', label: 'Background Color', color: bgColor },
                { value: 'white', label: 'White', color: '#ffffff' },
                { value: 'black', label: 'Black', color: '#000000' },
                { value: 'grey', label: 'Grey', color: '#808080' }
            ];

            pngOptions.forEach(option => {
                const btn = this.createExportOptionButton(option, type);
                options.appendChild(btn);
            });
        } else if (type === 'jpg') {
            // JPG options: background color, white, black, grey
            const bgColor = (window.grid && window.grid.backgroundColor) ? window.grid.backgroundColor : '#000000';
            const jpgOptions = [
                { value: 'bgcolor', label: 'Background Color', color: bgColor },
                { value: 'white', label: 'White', color: '#ffffff' },
                { value: 'black', label: 'Black', color: '#000000' },
                { value: 'grey', label: 'Grey', color: '#808080' }
            ];

            jpgOptions.forEach(option => {
                const btn = this.createExportOptionButton(option, type);
                options.appendChild(btn);
            });
        }

        modal.style.display = 'flex';
    }

    createExportOptionButton(option, type) {
        const btn = document.createElement('button');
        btn.className = 'export-bg-option';
        btn.innerHTML = `
            <div class="export-bg-option-preview" style="background-color: ${option.color === 'transparent' ? 'transparent' : option.color}; border: 2px solid ${option.color === 'transparent' ? '#333' : option.color};"></div>
            <span>${option.label}</span>
        `;
        btn.onclick = () => {
            this.performExport(type, option.value, option.color);
            document.getElementById('exportBgModal').style.display = 'none';
        };
        return btn;
    }

    performExport(type, bgOption, bgColor) {
        if (type === 'png') {
            this.exportPNG(bgOption, bgColor);
        } else if (type === 'jpg') {
            this.exportJPG(bgColor);
        }
    }

    // Calculate bounding box of visible pixels
    getBoundingBox() {
        const pixels = grid.getPixelData();
        const gridWidth = grid.width;
        const gridHeight = grid.height;
        let minX = gridWidth;
        let minY = gridHeight;
        let maxX = -1;
        let maxY = -1;
        let hasPixels = false;

        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                const color = pixels[y][x];
                if (color && window.layers && window.layers.isVisible(color)) {
                    hasPixels = true;
                    if (x < minX) minX = x;
                    if (y < minY) minY = y;
                    if (x > maxX) maxX = x;
                    if (y > maxY) maxY = y;
                }
            }
        }

        // If no pixels found, return null (will export empty canvas)
        if (!hasPixels) {
            return null;
        }

        // Return exact bounding box of used pixels (no padding)
        return {
            minX: minX,
            minY: minY,
            maxX: maxX,
            maxY: maxY,
            width: maxX - minX + 1,
            height: maxY - minY + 1
        };
    }

    createExportCanvas(bgColor = null) {
        const pixels = grid.getPixelData();
        const gridWidth = grid.width;
        const gridHeight = grid.height;
        const cellSize = grid.cellSize;
        
        // Get bounding box of visible pixels
        const bounds = this.getBoundingBox();
        
        // If no pixels, export a 1x1 transparent canvas
        if (!bounds) {
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            if (bgColor && bgColor !== 'transparent') {
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, 1, 1);
            }
            return canvas;
        }
        
        // Create canvas sized to bounding box
        const canvas = document.createElement('canvas');
        canvas.width = bounds.width * cellSize;
        canvas.height = bounds.height * cellSize;
        const ctx = canvas.getContext('2d');
        
        // Draw background color if specified (not transparent)
        if (bgColor && bgColor !== 'transparent') {
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // Draw only pixels within the bounding box, offset by bounds origin
        for (let y = bounds.minY; y <= bounds.maxY; y++) {
            for (let x = bounds.minX; x <= bounds.maxX; x++) {
                const color = pixels[y][x];
                if (color && window.layers && window.layers.isVisible(color)) {
                    ctx.fillStyle = color;
                    const offsetX = (x - bounds.minX) * cellSize;
                    const offsetY = (y - bounds.minY) * cellSize;
                    ctx.fillRect(offsetX, offsetY, cellSize, cellSize);
                }
            }
        }
        
        return canvas;
    }

    exportPNG(bgOption = 'transparent', bgColor = null) {
        const canvas = this.createExportCanvas(bgColor);
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pixel-art-${Date.now()}.png`;
            a.click();
            URL.revokeObjectURL(url);
        }, 'image/png');
    }

    exportJPG(bgColor = '#ffffff') {
        const canvas = this.createExportCanvas(bgColor);
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pixel-art-${Date.now()}.jpg`;
            a.click();
            URL.revokeObjectURL(url);
        }, 'image/jpeg', 0.95);
    }

    showSVGExportModal() {
        const modal = document.getElementById('svgExportSizeModal');
        const options = document.getElementById('svgExportSizeOptions');
        
        options.innerHTML = '';
        
        // Get canvas dimensions for display
        const gridWidth = grid.width;
        const gridHeight = grid.height;
        const bounds = this.getBoundingBox();
        const hasPixels = bounds !== null;
        
        // Canvas Size option
        const canvasBtn = this.createSVGExportOptionButton(
            'canvas',
            'Canvas Size',
            `${gridWidth}×${gridHeight} pixels`,
            `Export the full canvas size (${gridWidth}×${gridHeight})`
        );
        options.appendChild(canvasBtn);
        
        // Image Size option (only show if there are pixels)
        if (hasPixels) {
            const imageBtn = this.createSVGExportOptionButton(
                'image',
                'Image Size',
                `${bounds.width}×${bounds.height} pixels`,
                `Export only drawn pixels (${bounds.width}×${bounds.height})`
            );
            options.appendChild(imageBtn);
        } else {
            // If no pixels, show disabled message
            const noPixelsMsg = document.createElement('div');
            noPixelsMsg.className = 'export-bg-option';
            noPixelsMsg.style.opacity = '0.5';
            noPixelsMsg.style.cursor = 'not-allowed';
            noPixelsMsg.innerHTML = `
                <div class="export-bg-option-preview" style="display: none;"></div>
                <span>Image Size (No pixels drawn)</span>
            `;
            options.appendChild(noPixelsMsg);
        }
        
        modal.style.display = 'flex';
    }

    createSVGExportOptionButton(sizeType, label, dimensions, description) {
        const btn = document.createElement('button');
        btn.className = 'export-bg-option';
        btn.innerHTML = `
            <div class="export-bg-option-preview" style="display: none;"></div>
            <div style="display: flex; flex-direction: column; align-items: flex-start;">
                <span style="font-weight: bold;">${label}</span>
                <span style="font-size: 11px; color: var(--text-secondary);">${dimensions}</span>
            </div>
        `;
        btn.title = description;
        btn.onclick = () => {
            if (sizeType === 'canvas') {
                this.exportSVGFullCanvas();
            } else if (sizeType === 'image') {
                this.exportSVGImageSize();
            }
            document.getElementById('svgExportSizeModal').style.display = 'none';
        };
        return btn;
    }

    exportSVGFullCanvas() {
        const pixels = grid.getPixelData();
        const gridWidth = grid.width;
        const gridHeight = grid.height;
        const cellSize = grid.cellSize;
        
        // Full canvas size
        const svgWidth = gridWidth * cellSize;
        const svgHeight = gridHeight * cellSize;
        
        // Group pixels by color (all pixels on canvas)
        const pixelsByColor = new Map();
        
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                const color = pixels[y][x];
                if (color && window.layers && window.layers.isVisible(color)) {
                    if (!pixelsByColor.has(color)) {
                        pixelsByColor.set(color, []);
                    }
                    // Store absolute coordinates (no offset)
                    pixelsByColor.get(color).push({ 
                        x: x, 
                        y: y 
                    });
                }
            }
        }
        
        // Get background color
        const backgroundColor = window.grid ? window.grid.backgroundColor : '#ffffff';
        
        let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">\n`;
        
        // Add background color as bottom layer (solid rectangle covering entire canvas)
        svg += `  <rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" fill="${backgroundColor}"/>\n`;
        
        // Create a group for each color
        pixelsByColor.forEach((pixelList, color) => {
            svg += `  <g id="${color}" fill="${color}">\n`;
            
            // Add all rectangles for this color with absolute coordinates
            pixelList.forEach(pixel => {
                svg += `    <rect x="${pixel.x * cellSize}" y="${pixel.y * cellSize}" width="${cellSize}" height="${cellSize}"/>\n`;
            });
            
            svg += `  </g>\n`;
        });
        
        svg += `</svg>`;
        
        // Download SVG
        const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pixel-art-${Date.now()}.svg`;
        a.click();
        URL.revokeObjectURL(url);
    }

    exportSVGImageSize() {
        const pixels = grid.getPixelData();
        const gridWidth = grid.width;
        const gridHeight = grid.height;
        const cellSize = grid.cellSize;
        
        // Get bounding box of visible pixels
        const bounds = this.getBoundingBox();
        
        // If no pixels, export a minimal 1x1 SVG with background color
        if (!bounds) {
            const backgroundColor = window.grid ? window.grid.backgroundColor : '#ffffff';
            let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
            svg += `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1" viewBox="0 0 1 1">\n`;
            svg += `  <rect x="0" y="0" width="1" height="1" fill="${backgroundColor}"/>\n`;
            svg += `</svg>`;
            
            const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pixel-art-${Date.now()}.svg`;
            a.click();
            URL.revokeObjectURL(url);
            return;
        }
        
        // Calculate cropped SVG size
        const svgWidth = bounds.width * cellSize;
        const svgHeight = bounds.height * cellSize;
        
        // Group pixels by color (only within bounds)
        const pixelsByColor = new Map();
        
        for (let y = bounds.minY; y <= bounds.maxY; y++) {
            for (let x = bounds.minX; x <= bounds.maxX; x++) {
                const color = pixels[y][x];
                if (color && window.layers && window.layers.isVisible(color)) {
                    if (!pixelsByColor.has(color)) {
                        pixelsByColor.set(color, []);
                    }
                    // Store relative coordinates (offset by bounds origin)
                    pixelsByColor.get(color).push({ 
                        x: x - bounds.minX, 
                        y: y - bounds.minY 
                    });
                }
            }
        }
        
        // Get background color
        const backgroundColor = window.grid ? window.grid.backgroundColor : '#ffffff';
        
        let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">\n`;
        
        // Add background color as bottom layer (solid rectangle covering entire cropped area)
        svg += `  <rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" fill="${backgroundColor}"/>\n`;
        
        // Create a group for each color
        pixelsByColor.forEach((pixelList, color) => {
            // Use the hex color directly as the ID (e.g., #aaaaaa)
            svg += `  <g id="${color}" fill="${color}">\n`;
            
            // Add all rectangles for this color with relative coordinates
            pixelList.forEach(pixel => {
                svg += `    <rect x="${pixel.x * cellSize}" y="${pixel.y * cellSize}" width="${cellSize}" height="${cellSize}"/>\n`;
            });
            
            svg += `  </g>\n`;
        });
        
        svg += `</svg>`;
        
        // Download SVG
        const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pixel-art-${Date.now()}.svg`;
        a.click();
        URL.revokeObjectURL(url);
    }

    exportDataFiles(pixels) {
        const gridWidth = grid.width;
        const gridHeight = grid.height;
        const cellSize = grid.cellSize;
        
        // Get bounding box of visible pixels
        const bounds = this.getBoundingBox();
        
        // Create pixel data array with relative coordinates
        const pixelData = [];
        
        if (bounds) {
            // Only include pixels within bounds, with relative coordinates
            for (let y = bounds.minY; y <= bounds.maxY; y++) {
                for (let x = bounds.minX; x <= bounds.maxX; x++) {
                    const color = pixels[y][x];
                    if (color && window.layers && window.layers.isVisible(color)) {
                        pixelData.push({
                            x: x - bounds.minX,  // Relative x coordinate
                            y: y - bounds.minY,  // Relative y coordinate
                            color: color
                        });
                    }
                }
            }
        }
        
        // Export JSON with cropped dimensions
        const jsonData = {
            version: '1.0',
            width: bounds ? bounds.width : 0,
            height: bounds ? bounds.height : 0,
            cellSize: cellSize,
            pixels: pixelData,
            exportDate: new Date().toISOString()
        };
        
        const jsonBlob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        const jsonUrl = URL.createObjectURL(jsonBlob);
        const jsonA = document.createElement('a');
        jsonA.href = jsonUrl;
        jsonA.download = `pixel-art-data-${Date.now()}.json`;
        jsonA.click();
        URL.revokeObjectURL(jsonUrl);
        
        // Export XML
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<pixelArt>\n';
        xml += `  <width>${bounds ? bounds.width : 0}</width>\n`;
        xml += `  <height>${bounds ? bounds.height : 0}</height>\n`;
        xml += `  <cellSize>${cellSize}</cellSize>\n`;
        xml += `  <exportDate>${new Date().toISOString()}</exportDate>\n`;
        xml += '  <pixels>\n';
        
        pixelData.forEach(pixel => {
            xml += `    <pixel x="${pixel.x}" y="${pixel.y}" color="${pixel.color}"/>\n`;
        });
        
        xml += '  </pixels>\n';
        xml += '</pixelArt>';
        
        const xmlBlob = new Blob([xml], { type: 'application/xml' });
        const xmlUrl = URL.createObjectURL(xmlBlob);
        const xmlA = document.createElement('a');
        xmlA.href = xmlUrl;
        xmlA.download = `pixel-art-data-${Date.now()}.xml`;
        xmlA.click();
        URL.revokeObjectURL(xmlUrl);
    }

    imageToDataUrl(img) {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        return canvas.toDataURL('image/png');
    }

    setupExportAllModal() {
        const modal = document.getElementById('exportAllModal');
        const closeBtn = document.getElementById('exportAllClose');
        const cancelBtn = document.getElementById('exportAllCancel');
        const confirmBtn = document.getElementById('exportAllConfirm');
        const fileNameInput = document.getElementById('exportAllFileName');
        const fileNamePreview = document.getElementById('exportAllFileNamePreview');

        const updatePreview = () => {
            const fileName = fileNameInput.value.trim() || 'pixel-art-project';
            fileNamePreview.textContent = `${fileName}.png, .svg, .json`;
        };

        const closeModal = () => {
            modal.style.display = 'none';
            fileNameInput.value = '';
        };

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        fileNameInput.addEventListener('input', updatePreview);
        fileNameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                confirmBtn.click();
            }
        });

        confirmBtn.addEventListener('click', async () => {
            const fileName = fileNameInput.value.trim() || 'pixel-art-project';
            await this.exportAll(fileName);
            closeModal();
        });

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display !== 'none') {
                closeModal();
            }
        });
    }

    showExportAllModal() {
        const modal = document.getElementById('exportAllModal');
        const fileNameInput = document.getElementById('exportAllFileName');
        modal.style.display = 'flex';
        // Focus the input and select any existing text
        setTimeout(() => {
            fileNameInput.focus();
            fileNameInput.select();
        }, 100);
    }

    async exportAll(baseFileName) {
        // Sanitize filename (remove invalid characters, preserve capitalization)
        const sanitizedFileName = baseFileName.replace(/[^a-z0-9\-_]/gi, '-') || 'pixel-art-project';
        
        // Check if File System Access API is available
        if ('showDirectoryPicker' in window) {
            try {
                // Use File System Access API to let user choose destination
                const directoryHandle = await window.showDirectoryPicker();
                
                // Export PNG
                const pngCanvas = this.createExportCanvas('transparent');
                pngCanvas.toBlob(async (blob) => {
                    const fileHandle = await directoryHandle.getFileHandle(`${sanitizedFileName}.png`, { create: true });
                    const writable = await fileHandle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                }, 'image/png');

                // Export SVG
                const svgContent = this.generateSVGContent();
                const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
                const svgFileHandle = await directoryHandle.getFileHandle(`${sanitizedFileName}.svg`, { create: true });
                const svgWritable = await svgFileHandle.createWritable();
                await svgWritable.write(svgBlob);
                await svgWritable.close();

                // Export JSON
                const jsonContent = this.generateJSONContent();
                const jsonBlob = new Blob([jsonContent], { type: 'application/json' });
                const jsonFileHandle = await directoryHandle.getFileHandle(`${sanitizedFileName}.json`, { create: true });
                const jsonWritable = await jsonFileHandle.createWritable();
                await jsonWritable.write(jsonBlob);
                await jsonWritable.close();

                console.log(`Exported all files to: ${sanitizedFileName}.png, .svg, .json`);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Error exporting files:', err);
                    // Fallback to downloads
                    this.exportAllToDownloads(sanitizedFileName);
                }
            }
        } else {
            // Fallback to downloads folder
            this.exportAllToDownloads(sanitizedFileName);
        }
    }

    exportAllToDownloads(baseFileName) {
        // Export PNG
        const pngCanvas = this.createExportCanvas('transparent');
        pngCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${baseFileName}.png`;
            a.click();
            URL.revokeObjectURL(url);
        }, 'image/png');

        // Export SVG
        const svgContent = this.generateSVGContent();
        const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        const svgA = document.createElement('a');
        svgA.href = svgUrl;
        svgA.download = `${baseFileName}.svg`;
        // Small delay to ensure PNG download starts first
        setTimeout(() => {
            svgA.click();
            URL.revokeObjectURL(svgUrl);
        }, 100);

        // Export JSON
        const jsonContent = this.generateJSONContent();
        const jsonBlob = new Blob([jsonContent], { type: 'application/json' });
        const jsonUrl = URL.createObjectURL(jsonBlob);
        const jsonA = document.createElement('a');
        jsonA.href = jsonUrl;
        jsonA.download = `${baseFileName}.json`;
        // Small delay to ensure SVG download starts first
        setTimeout(() => {
            jsonA.click();
            URL.revokeObjectURL(jsonUrl);
        }, 200);
    }

    generateSVGContent() {
        // Use the existing exportSVG logic but return content instead of downloading
        const pixels = grid.getPixelData();
        const gridSize = grid.size;
        const cellSize = grid.cellSize;
        
        // Get bounding box
        const bounds = this.getBoundingBox();
        
        // Get background color
        const backgroundColor = window.grid ? window.grid.backgroundColor : '#ffffff';
        
        // If no pixels, return minimal SVG with background color
        if (!bounds) {
            return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10">\n  <rect x="0" y="0" width="10" height="10" fill="${backgroundColor}"/>\n</svg>`;
        }
        
        const svgWidth = bounds.width * cellSize;
        const svgHeight = bounds.height * cellSize;
        
        // Group pixels by color
        const pixelsByColor = new Map();
        
        for (let y = bounds.minY; y <= bounds.maxY; y++) {
            for (let x = bounds.minX; x <= bounds.maxX; x++) {
                const color = pixels[y][x];
                if (color && window.layers && window.layers.isVisible(color)) {
                    if (!pixelsByColor.has(color)) {
                        pixelsByColor.set(color, []);
                    }
                    pixelsByColor.get(color).push({ 
                        x: x - bounds.minX, 
                        y: y - bounds.minY 
                    });
                }
            }
        }
        
        let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">\n`;
        
        // Add background color as bottom layer (solid rectangle covering entire cropped area)
        svg += `  <rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" fill="${backgroundColor}"/>\n`;
        
        // Create a group for each color
        pixelsByColor.forEach((pixelList, color) => {
            svg += `  <g id="${color}" fill="${color}">\n`;
            pixelList.forEach(pixel => {
                svg += `    <rect x="${pixel.x * cellSize}" y="${pixel.y * cellSize}" width="${cellSize}" height="${cellSize}"/>\n`;
            });
            svg += `  </g>\n`;
        });
        
        svg += `</svg>`;
        return svg;
    }

    generateJSONContent() {
        if (!window.grid) {
            throw new Error('Grid not available for export');
        }
        const gridSize = grid.size;
        const pixels = window.grid.getPixelData();
        
        // Ensure pixels is a proper 2D array
        if (!Array.isArray(pixels) || pixels.length === 0 || !Array.isArray(pixels[0])) {
            throw new Error('Invalid pixel data structure');
        }
        
        const projectData = {
            version: '1.0',
            savedAt: new Date().toISOString(),
            grid: {
                size: gridSize,
                cellSize: grid.cellSize,
                pixels: pixels
            },
            layers: window.layers ? window.layers.getAllLayers() : [],
            currentColor: window.palette ? window.palette.getCurrentColor() : '#000000',
            background: {
                hasImage: window.background && window.background.image ? true : false,
                opacity: window.background ? window.background.opacity : 1,
                imageData: null,
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

        return JSON.stringify(projectData, null, 2);
    }
}

const exportManager = new Export();

