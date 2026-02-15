class AppContext {
  static get(name) {
    return window[name];
  }

  static set(name, value) {
    window[name] = value;
    return value;
  }

  static getApp() {
    return this.get('app');
  }

  static setApp(app) {
    return this.set('app', app);
  }

  static getGrid() {
    return this.get('grid');
  }

  static setGrid(grid) {
    return this.set('grid', grid);
  }

  static getHistoryManager() {
    return this.get('historyManager');
  }

  static setHistoryManager(historyManager) {
    return this.set('historyManager', historyManager);
  }

  static getPalette() {
    return this.get('palette');
  }

  static setPalette(palette) {
    return this.set('palette', palette);
  }

  static getLayers() {
    return this.get('layers');
  }

  static setLayers(layers) {
    return this.set('layers', layers);
  }

  static getBackground() {
    return this.get('background');
  }

  static setBackground(background) {
    return this.set('background', background);
  }

  static getRuler() {
    return this.get('ruler');
  }

  static setRuler(ruler) {
    return this.set('ruler', ruler);
  }

  static getCanvasSizeModal() {
    return this.get('canvasSizeModal');
  }

  static setCanvasSizeModal(canvasSizeModal) {
    return this.set('canvasSizeModal', canvasSizeModal);
  }

  static getTools() {
    return this.get('tools');
  }

  static setTools(tools) {
    return this.set('tools', tools);
  }

  static getCurrentTool() {
    return this.get('currentTool');
  }

  static setCurrentTool(tool) {
    return this.set('currentTool', tool);
  }

  static getExportManager() {
    return this.get('exportManager');
  }

  static setExportManager(exportManager) {
    return this.set('exportManager', exportManager);
  }

  static getSaveLoadManager() {
    return this.get('saveLoad');
  }

  static setSaveLoadManager(saveLoad) {
    return this.set('saveLoad', saveLoad);
  }

  static getModalUtils() {
    return this.get('ModalUtils');
  }

  static getSaveLoadSVGUtils() {
    return this.get('SaveLoadSVGUtils');
  }

  static getSNESPalette() {
    return this.get('SNES_PALETTE');
  }
}

window.AppContext = AppContext;
