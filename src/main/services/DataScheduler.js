const { EventEmitter } = require('events');

const PRICE_INTERVAL_MS = 60 * 1000;
const DAILY_MS = 24 * 60 * 60 * 1000;
const MVRV_INTERVAL_MS = 4 * 60 * 60 * 1000;
const MAX_RETRIES = 2;

class DataScheduler extends EventEmitter {
  constructor({ fetchPrice, fetchFearGreed, fetchHistorical, fetchMVRVZScore } = {}) {
    super();
    this._fetchPrice = fetchPrice;
    this._fetchFearGreed = fetchFearGreed;
    this._fetchHistorical = fetchHistorical;
    this._fetchMVRVZScore = fetchMVRVZScore;

    this._running = false;
    this._priceTimer = null;
    this._dailyTimer = null;

    this._cache = {
      price: null,
      fearGreed: null,
      historical: null,
      lastDailyFetch: null,
    };

    this._lastMVRVFetch = 0;
    this._cachedMVRV = null;
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._pollPrice();
    this._pollDaily();
    this._priceTimer = setInterval(() => this._pollPrice(), PRICE_INTERVAL_MS);
    this._dailyTimer = setInterval(() => this._pollDailyIfNeeded(), PRICE_INTERVAL_MS);
  }

  stop() {
    this._running = false;
    if (this._priceTimer) clearInterval(this._priceTimer);
    if (this._dailyTimer) clearInterval(this._dailyTimer);
    this._priceTimer = null;
    this._dailyTimer = null;
  }

  async _pollPrice() {
    let result = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        result = await this._fetchPrice();
        break;
      } catch (_) {
        // retry
      }
    }

    if (result !== null) {
      this._cache.price = result;
    }

    if (this._cache.price !== null) {
      this.emit('price-updated', { price: this._cache.price });
    }

    await this._pollMVRVIfNeeded();
  }

  async _pollMVRVIfNeeded() {
    const now = Date.now();
    if (this._lastMVRVFetch !== 0 && (now - this._lastMVRVFetch) < MVRV_INTERVAL_MS) {
      this.emit('mvrv-updated', { mvrvZScore: this._cachedMVRV });
      return;
    }
    try {
      // MarketDataService.fetchMVRVZScore(date) requires a date argument to build the URL path
      const score = await this._fetchMVRVZScore(new Date());
      this._cachedMVRV = score;
      this._lastMVRVFetch = now;
      this.emit('mvrv-updated', { mvrvZScore: score });
    } catch (_) {
      // Update _lastMVRVFetch on failure so the 4h throttle still applies
      this._lastMVRVFetch = now;
      this.emit('mvrv-updated', { mvrvZScore: this._cachedMVRV });
    }
  }

  async _pollDaily() {
    this._cache.lastDailyFetch = Date.now();
    await Promise.all([
      this._fetchFearGreed().then(v => { this._cache.fearGreed = v; }).catch(() => {}),
      this._fetchHistorical().then(v => { this._cache.historical = v; }).catch(() => {}),
    ]);
    this.emit('daily-updated', {
      fearGreed: this._cache.fearGreed,
      historical: this._cache.historical,
    });
  }

  _pollDailyIfNeeded() {
    const last = this._cache.lastDailyFetch;
    if (!last || Date.now() - last >= DAILY_MS) {
      this._pollDaily();
    }
  }
}

module.exports = { DataScheduler };
