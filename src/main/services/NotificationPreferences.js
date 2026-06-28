const DEFAULTS = {
  muted: { STRONG_BUY: false, OVERHEATED: false },
  lastFired: { STRONG_BUY: 0, OVERHEATED: 0 },
};

class NotificationPreferences {
  constructor({ store, cooldownMs = 28_800_000 } = {}) {
    this._store = store;
    this._cooldownMs = cooldownMs;
    this._muted = { ...DEFAULTS.muted, ...(store.get('notifications.muted') || {}) };
    this._lastFired = { ...DEFAULTS.lastFired, ...(store.get('notifications.lastFired') || {}) };
  }

  toggleMute(type) {
    this._muted[type] = !this._muted[type];
    this._store.set('notifications.muted', this._muted);
  }

  isMuted(type) {
    return !!this._muted[type];
  }

  getLastFired(type) {
    return this._lastFired[type] || 0;
  }

  setLastFired(type, ts) {
    this._lastFired[type] = ts;
    this._store.set('notifications.lastFired', this._lastFired);
  }

  isOnCooldown(type) {
    return Date.now() - this.getLastFired(type) < this._cooldownMs;
  }
}

module.exports = { NotificationPreferences };
