class UpdateService {
  constructor({ autoUpdater }) {
    this._updater = autoUpdater;
  }

  checkForUpdates() {
    this._updater.checkForUpdatesAndNotify();
  }

  startPeriodicCheck(intervalMs = 60 * 60 * 1000) {
    this.checkForUpdates();
    setInterval(() => this.checkForUpdates(), intervalMs);
  }

  onUpdateAvailable(cb) {
    this._updater.on('update-available', cb);
  }

  onUpdateDownloaded(cb) {
    this._updater.on('update-downloaded', cb);
  }

  onError(cb) {
    this._updater.on('error', cb);
  }
}

module.exports = { UpdateService };
