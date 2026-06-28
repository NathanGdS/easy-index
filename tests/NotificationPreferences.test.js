const { NotificationPreferences } = require('../src/main/services/NotificationPreferences');

function makeStore(initial = {}) {
  const data = { ...initial };
  return {
    get: jest.fn(key => data[key]),
    set: jest.fn((key, val) => { data[key] = val; }),
  };
}

describe('NotificationPreferences', () => {
  it('isMuted returns false by default', () => {
    const prefs = new NotificationPreferences({ store: makeStore() });
    expect(prefs.isMuted('STRONG_BUY')).toBe(false);
    expect(prefs.isMuted('OVERHEATED')).toBe(false);
  });

  it('toggleMute flips mute state', () => {
    const prefs = new NotificationPreferences({ store: makeStore() });
    prefs.toggleMute('STRONG_BUY');
    expect(prefs.isMuted('STRONG_BUY')).toBe(true);
    prefs.toggleMute('STRONG_BUY');
    expect(prefs.isMuted('STRONG_BUY')).toBe(false);
  });

  it('toggleMute persists to store', () => {
    const store = makeStore();
    const prefs = new NotificationPreferences({ store });
    prefs.toggleMute('STRONG_BUY');
    expect(store.set).toHaveBeenCalledWith(
      'notifications.muted',
      expect.objectContaining({ STRONG_BUY: true })
    );
  });

  it('mute state is independent per type', () => {
    const prefs = new NotificationPreferences({ store: makeStore() });
    prefs.toggleMute('STRONG_BUY');
    expect(prefs.isMuted('OVERHEATED')).toBe(false);
  });

  it('getLastFired returns 0 by default', () => {
    const prefs = new NotificationPreferences({ store: makeStore() });
    expect(prefs.getLastFired('STRONG_BUY')).toBe(0);
  });

  it('setLastFired persists to store', () => {
    const store = makeStore();
    const prefs = new NotificationPreferences({ store });
    prefs.setLastFired('STRONG_BUY', 12345);
    expect(store.set).toHaveBeenCalledWith(
      'notifications.lastFired',
      expect.objectContaining({ STRONG_BUY: 12345 })
    );
  });

  it('isOnCooldown true when within cooldown window', () => {
    const prefs = new NotificationPreferences({ store: makeStore(), cooldownMs: 1000 });
    prefs.setLastFired('STRONG_BUY', Date.now() - 500);
    expect(prefs.isOnCooldown('STRONG_BUY')).toBe(true);
  });

  it('isOnCooldown false when beyond cooldown window', () => {
    const prefs = new NotificationPreferences({ store: makeStore(), cooldownMs: 1000 });
    prefs.setLastFired('STRONG_BUY', Date.now() - 2000);
    expect(prefs.isOnCooldown('STRONG_BUY')).toBe(false);
  });

  it('isOnCooldown false when never fired', () => {
    const prefs = new NotificationPreferences({ store: makeStore(), cooldownMs: 1000 });
    expect(prefs.isOnCooldown('STRONG_BUY')).toBe(false);
  });

  it('restores muted state from cache on construction', () => {
    const store = makeStore({
      'notifications.muted': { STRONG_BUY: true, OVERHEATED: false },
    });
    const prefs = new NotificationPreferences({ store });
    expect(prefs.isMuted('STRONG_BUY')).toBe(true);
    expect(prefs.isMuted('OVERHEATED')).toBe(false);
  });

  it('restores lastFired from cache on construction', () => {
    const ts = Date.now() - 100;
    const store = makeStore({
      'notifications.lastFired': { STRONG_BUY: ts, OVERHEATED: 0 },
    });
    const prefs = new NotificationPreferences({ store });
    expect(prefs.getLastFired('STRONG_BUY')).toBe(ts);
  });
});
