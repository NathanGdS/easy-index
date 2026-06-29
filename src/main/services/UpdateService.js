class UpdateService {
  constructor({ autoUpdater }) {
    this._updater = autoUpdater;
    this._manualCheck = false;
  }

  checkForUpdates() {
    this._manualCheck = true;
    this._updater.checkForUpdatesAndNotify();
  }

  startPeriodicCheck(intervalMs = 60 * 60 * 1000) {
    this._updater.checkForUpdates();
    setInterval(() => this._updater.checkForUpdates(), intervalMs);
  }

  onUpdateAvailable(cb) {
    this._updater.on('update-available', cb);
  }

  onUpdateDownloaded(cb) {
    this._updater.on('update-downloaded', cb);
  }

  onUpdateNotAvailable(cb) {
    this._updater.on('update-not-available', () => {
      if (this._manualCheck) cb();
      this._manualCheck = false;
    });
  }

  onError(cb) {
    this._updater.on('error', cb);
  }
}

module.exports = { UpdateService };
