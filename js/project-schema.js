class ProjectSchema {
  static get VERSION() {
    return '1.0';
  }

  static getContextValue(name) {
    if (window.AppContext && typeof window.AppContext.get === 'function') {
      return window.AppContext.get(name);
    }
    return window[name];
  }

  static createBaseProject() {
    return {
      version: ProjectSchema.VERSION,
      savedAt: new Date().toISOString(),
      grid: {
        width: 64,
        height: 64,
        cellSize: 10,
        pixels: []
      },
      layers: [],
      currentColor: '#000000',
      background: {
        hasImage: false,
        opacity: 1,
        imageData: null,
        x: 0,
        y: 0,
        scale: 1.0,
        rotation: 0
      },
      settings: {
        showGrid: true,
        zoom: 1,
        backgroundColor: '#ffffff',
        fadeToBlack: 100
      }
    };
  }

  static serializeBackgroundImage(background) {
    if (!background || !background.image) {
      return null;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = background.image.width;
      canvas.height = background.image.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(background.image, 0, 0);
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.warn('Could not serialize background image:', error);
      return null;
    }
  }

  static serializeProjectState(state = {}) {
    const grid = state.grid || this.getContextValue('grid');
    const layers = state.layers || this.getContextValue('layers');
    const palette = state.palette || this.getContextValue('palette');
    const background = state.background || this.getContextValue('background');

    if (!grid) {
      throw new Error('Grid is not initialized');
    }

    const base = this.createBaseProject();
    const project = {
      ...base,
      version: this.VERSION,
      savedAt: new Date().toISOString(),
      grid: {
        width: grid.width,
        height: grid.height,
        cellSize: grid.cellSize,
        pixels: grid.getPixelData()
      },
      layers: layers ? layers.getAllLayers() : [],
      currentColor: palette ? palette.getCurrentColor() : base.currentColor,
      background: {
        hasImage: !!(background && background.image),
        opacity: background ? background.opacity : base.background.opacity,
        imageData: null,
        x: background ? background.x : base.background.x,
        y: background ? background.y : base.background.y,
        scale: background ? background.scale : base.background.scale,
        rotation: background ? background.rotation : base.background.rotation
      },
      settings: {
        showGrid: grid.showGrid,
        zoom: grid.zoom,
        backgroundColor: grid.backgroundColor,
        fadeToBlack: grid.fadeToBlack
      }
    };

    project.background.imageData = this.serializeBackgroundImage(background);
    return project;
  }

  static normalizeProjectData(inputData) {
    const base = this.createBaseProject();
    const source = inputData || {};
    const sourceGrid = source.grid || {};
    const sourcePixels = sourceGrid.pixels;

    if (
      !Array.isArray(sourcePixels) ||
      sourcePixels.length === 0 ||
      !Array.isArray(sourcePixels[0])
    ) {
      throw new Error('Invalid project file format');
    }

    const derivedHeight = sourcePixels.length;
    const derivedWidth = sourcePixels[0].length;

    const width = sourceGrid.width || sourceGrid.size || derivedWidth;
    const height = sourceGrid.height || sourceGrid.size || derivedHeight;

    const version = typeof source.version === 'string' ? source.version : base.version;

    return {
      ...base,
      version,
      savedAt: source.savedAt || base.savedAt,
      grid: {
        width,
        height,
        cellSize: sourceGrid.cellSize || base.grid.cellSize,
        pixels: sourcePixels
      },
      layers: Array.isArray(source.layers) ? source.layers : base.layers,
      currentColor: source.currentColor || base.currentColor,
      background: {
        hasImage:
          source.background && typeof source.background.hasImage === 'boolean'
            ? source.background.hasImage
            : base.background.hasImage,
        opacity:
          source.background && source.background.opacity !== undefined
            ? source.background.opacity
            : base.background.opacity,
        imageData:
          source.background && typeof source.background.imageData === 'string'
            ? source.background.imageData
            : null,
        x:
          source.background && source.background.x !== undefined
            ? source.background.x
            : base.background.x,
        y:
          source.background && source.background.y !== undefined
            ? source.background.y
            : base.background.y,
        scale:
          source.background && source.background.scale !== undefined
            ? source.background.scale
            : base.background.scale,
        rotation:
          source.background && source.background.rotation !== undefined
            ? source.background.rotation
            : base.background.rotation
      },
      settings: {
        showGrid:
          source.settings && source.settings.showGrid !== undefined
            ? source.settings.showGrid
            : base.settings.showGrid,
        zoom:
          source.settings && source.settings.zoom !== undefined
            ? source.settings.zoom
            : base.settings.zoom,
        backgroundColor:
          source.settings && source.settings.backgroundColor !== undefined
            ? source.settings.backgroundColor
            : base.settings.backgroundColor,
        fadeToBlack:
          source.settings && source.settings.fadeToBlack !== undefined
            ? source.settings.fadeToBlack
            : base.settings.fadeToBlack
      }
    };
  }
}

window.ProjectSchema = ProjectSchema;
