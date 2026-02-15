class SaveLoadSVGUtils {
  static parseSVGCSSStyles(svgDoc) {
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

  static parsePathToRect(path) {
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

  static resolveElementColor(element, group, cssStyleMap, elementType) {
    // For paths, use resolvePathColor; for rects, use resolveRectColor
    if (elementType === 'path') {
      return SaveLoadSVGUtils.resolvePathColor(element, group, cssStyleMap);
    }
    return SaveLoadSVGUtils.resolveRectColor(element, group, cssStyleMap);
  }

  static resolvePathColor(path, group, cssStyleMap) {
    // 1. Try path's class attribute (resolve from CSS)
    const pathClass = path.getAttribute('class');
    if (pathClass && cssStyleMap[pathClass]) {
      const color = cssStyleMap[pathClass];
      if (color.startsWith('#')) {
        return color.toLowerCase();
      }
      if (SaveLoadSVGUtils.isValidColor(color)) {
        return SaveLoadSVGUtils.namedColorToHex(color);
      }
    }

    // 2. Try path's fill attribute
    let color = path.getAttribute('fill');
    if (color) {
      color = color.trim();
      if (color !== 'none' && color !== '') {
        if (color.startsWith('#')) {
          return color.toLowerCase();
        }
        if (SaveLoadSVGUtils.isValidColor(color)) {
          return SaveLoadSVGUtils.namedColorToHex(color);
        }
      }
    }

    // 3. Try group's class attribute (resolve from CSS)
    if (group) {
      const groupClass = group.getAttribute('class');
      if (groupClass && cssStyleMap[groupClass]) {
        color = cssStyleMap[groupClass];
        if (color.startsWith('#')) {
          return color.toLowerCase();
        }
        if (SaveLoadSVGUtils.isValidColor(color)) {
          return SaveLoadSVGUtils.namedColorToHex(color);
        }
      }
    }

    // 4. Try group's fill attribute
    if (group) {
      color = group.getAttribute('fill');
      if (color) {
        color = color.trim();
        if (color !== 'none' && color !== '') {
          if (color.startsWith('#')) {
            return color.toLowerCase();
          }
          if (SaveLoadSVGUtils.isValidColor(color)) {
            return SaveLoadSVGUtils.namedColorToHex(color);
          }
        }
      }
    }

    // 5. Try group's ID (handle escaped format like _x23_000000)
    if (group) {
      const groupId = group.getAttribute('id');
      if (groupId) {
        color = SaveLoadSVGUtils.convertEscapedID(groupId);
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
              return trimmedFill.toLowerCase();
            }
            if (SaveLoadSVGUtils.isValidColor(trimmedFill)) {
              return SaveLoadSVGUtils.namedColorToHex(trimmedFill);
            }
          }
        }
        const parentId = parent.getAttribute('id');
        if (parentId) {
          const idColor = SaveLoadSVGUtils.convertEscapedID(parentId);
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

  static resolveRectColor(rect, group, cssStyleMap) {
    // 1. Try rect's class attribute (resolve from CSS)
    const rectClass = rect.getAttribute('class');
    if (rectClass && cssStyleMap[rectClass]) {
      const color = cssStyleMap[rectClass];
      if (color.startsWith('#')) {
        return color.toLowerCase();
      }
      if (SaveLoadSVGUtils.isValidColor(color)) {
        return SaveLoadSVGUtils.namedColorToHex(color);
      }
    }

    // 2. Try rect's fill attribute
    let color = rect.getAttribute('fill');
    if (color) {
      color = color.trim();
      if (color !== 'none' && color !== '') {
        if (color.startsWith('#')) {
          return color.toLowerCase();
        }
        if (SaveLoadSVGUtils.isValidColor(color)) {
          return SaveLoadSVGUtils.namedColorToHex(color);
        }
      }
    }

    // 3. Try group's class attribute (resolve from CSS)
    if (group) {
      const groupClass = group.getAttribute('class');
      if (groupClass && cssStyleMap[groupClass]) {
        color = cssStyleMap[groupClass];
        if (color.startsWith('#')) {
          return color.toLowerCase();
        }
        if (SaveLoadSVGUtils.isValidColor(color)) {
          return SaveLoadSVGUtils.namedColorToHex(color);
        }
      }
    }

    // 4. Try group's fill attribute
    if (group) {
      color = group.getAttribute('fill');
      if (color) {
        color = color.trim();
        if (color !== 'none' && color !== '') {
          if (color.startsWith('#')) {
            return color.toLowerCase();
          }
          if (SaveLoadSVGUtils.isValidColor(color)) {
            return SaveLoadSVGUtils.namedColorToHex(color);
          }
        }
      }
    }

    // 5. Try group's ID (handle escaped format like _x23_000000)
    if (group) {
      const groupId = group.getAttribute('id');
      if (groupId) {
        color = SaveLoadSVGUtils.convertEscapedID(groupId);
        if (color && color.startsWith('#')) {
          return color.toLowerCase();
        }
      }
    }

    return null;
  }

  static convertEscapedID(id) {
    // Handle escaped IDs like _x23_000000 or _x0023_000000
    // _x23 = # (2-digit hex) or _x0023 = # (4-digit hex)
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
    if (id.startsWith('#')) {
      return id;
    }
    return null;
  }

  static isValidColor(color) {
    const s = new Option().style;
    s.color = color;
    return s.color !== '';
  }

  static namedColorToHex(color) {
    const tempElement = document.createElement('div');
    document.body.appendChild(tempElement);
    tempElement.style.color = color;
    const computedColor = window.getComputedStyle(tempElement).color;
    document.body.removeChild(tempElement);

    if (computedColor && computedColor.startsWith('rgb')) {
      const rgbMatch = computedColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (rgbMatch) {
        const r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, '0');
        const g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, '0');
        const b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`.toLowerCase();
      }
    }

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

    const lowerColor = color.toLowerCase().trim();
    if (namedColors[lowerColor]) {
      return namedColors[lowerColor];
    }

    return color;
  }

  static createBackgroundSVG(svgElement, backgroundElements, width, height) {
    const viewBox = svgElement.getAttribute('viewBox') || `0 0 ${width} ${height}`;
    const xmlns = svgElement.getAttribute('xmlns') || 'http://www.w3.org/2000/svg';

    const defs = svgElement.querySelector('defs');
    let defsString = '';
    if (defs) {
      defsString = defs.outerHTML;
    }

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

window.SaveLoadSVGUtils = SaveLoadSVGUtils;
