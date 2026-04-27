class StartupService {
  constructor({ app, cache }) {
    this._app = app;
    this._cache = cache;
    this._enabled = cache.get('openAtLogin') ?? false;
  }

  isEnabled() {
    return this._enabled;
  }

  setEnabled(bool) {
    this._enabled = bool;
    this._app.setLoginItemSettings({ openAtLogin: bool });
    this._cache.set('openAtLogin', bool);
  }
}

module.exports = { StartupService };
