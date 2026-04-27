const ALERT_MESSAGES = {
  STRONG_BUY: {
    title: 'Strong Buy Signal',
    body: 'Extreme Fear + Undervalued: F&G < 20 and Mayer < 0.8',
  },
  OVERHEATED: {
    title: 'Overheated Market',
    body: 'Extreme Greed + Overvalued: F&G > 80 and Mayer > 1.5',
  },
};

class AlertService {
  constructor({ notify, cooldownMs = 3600000 } = {}) {
    this._notify = notify;
    this._cooldownMs = cooldownMs;
    this._lastFired = {};
  }

  trigger(type) {
    if (!type || !ALERT_MESSAGES[type]) return;

    const now = Date.now();
    const last = this._lastFired[type] || 0;
    if (now - last < this._cooldownMs) return;

    this._lastFired[type] = now;
    this._notify({ type, ...ALERT_MESSAGES[type] });
  }
}

module.exports = { AlertService };
