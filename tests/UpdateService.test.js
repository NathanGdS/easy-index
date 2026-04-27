const { UpdateService } = require('../src/main/services/UpdateService');

describe('UpdateService', () => {
  let service;
  let mockAutoUpdater;

  beforeEach(() => {
    mockAutoUpdater = {
      checkForUpdatesAndNotify: jest.fn(),
      on: jest.fn(),
    };
    service = new UpdateService({ autoUpdater: mockAutoUpdater });
  });

  it('checkForUpdates() calls autoUpdater.checkForUpdatesAndNotify', () => {
    service.checkForUpdates();
    expect(mockAutoUpdater.checkForUpdatesAndNotify).toHaveBeenCalledTimes(1);
  });

  it('onUpdateAvailable registers listener for update-available event', () => {
    const cb = jest.fn();
    service.onUpdateAvailable(cb);
    expect(mockAutoUpdater.on).toHaveBeenCalledWith('update-available', cb);
  });

  it('onUpdateDownloaded registers listener for update-downloaded event', () => {
    const cb = jest.fn();
    service.onUpdateDownloaded(cb);
    expect(mockAutoUpdater.on).toHaveBeenCalledWith('update-downloaded', cb);
  });

  it('onError registers listener for error event', () => {
    const cb = jest.fn();
    service.onError(cb);
    expect(mockAutoUpdater.on).toHaveBeenCalledWith('error', cb);
  });
});
