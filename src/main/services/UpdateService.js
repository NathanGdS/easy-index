class UpdateService {
  constructor({ autoUpdater }) {
    this._updater = autoUpdater;
  }

  checkForUpdates() {
    this._updater.checkForUpdatesAndNotify();
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
