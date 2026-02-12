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
}

window.AppContext = AppContext;
