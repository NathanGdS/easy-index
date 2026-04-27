const { StartupService } = require('../src/main/services/StartupService');

describe('StartupService', () => {
  let service;
  let mockApp;
  let mockCache;

  beforeEach(() => {
    mockApp = { setLoginItemSettings: jest.fn() };
    mockCache = { get: jest.fn().mockReturnValue(undefined), set: jest.fn() };
    service = new StartupService({ app: mockApp, cache: mockCache });
  });

  it('isEnabled() returns false by default when cache is empty', () => {
    expect(service.isEnabled()).toBe(false);
  });

  it('setEnabled(true) calls app.setLoginItemSettings with openAtLogin true', () => {
    service.setEnabled(true);
    expect(mockApp.setLoginItemSettings).toHaveBeenCalledWith({ openAtLogin: true });
  });

  it('setEnabled(false) calls app.setLoginItemSettings with openAtLogin false', () => {
    service.setEnabled(false);
    expect(mockApp.setLoginItemSettings).toHaveBeenCalledWith({ openAtLogin: false });
  });

  it('setEnabled persists value to cache under openAtLogin key', () => {
    service.setEnabled(true);
    expect(mockCache.set).toHaveBeenCalledWith('openAtLogin', true);
  });

  it('isEnabled() returns the persisted cached value', () => {
    mockCache.get.mockReturnValue(true);
    service = new StartupService({ app: mockApp, cache: mockCache });
    expect(service.isEnabled()).toBe(true);
  });
});
