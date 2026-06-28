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
  constructor({ notify, prefs } = {}) {
    this._notify = notify;
    this._prefs = prefs;
  }

  trigger(type) {
    if (!type || !ALERT_MESSAGES[type]) return;
    if (this._prefs.isMuted(type)) return;
    if (this._prefs.isOnCooldown(type)) return;

    this._prefs.setLastFired(type, Date.now());
    this._notify({ type, ...ALERT_MESSAGES[type] });
  }
}

module.exports = { AlertService };
