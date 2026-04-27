const fetch = require('node-fetch');

const COINGECKO_PRICE = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd';
const BINANCE_PRICE = 'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT';
const FEAR_GREED_URL = 'https://api.alternative.me/fng/?limit=1';
const HISTORICAL_URL = 'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=200&interval=daily';

async function fetchWithTimeout(url, ms = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

class MarketDataService {
  async fetchPrice() {
    try {
      const data = await fetchWithTimeout(COINGECKO_PRICE);
      return data.bitcoin.usd;
    } catch (_) {
      const data = await fetchWithTimeout(BINANCE_PRICE);
      return parseFloat(data.price);
    }
  }

  async fetchFearGreed() {
    const data = await fetchWithTimeout(FEAR_GREED_URL);
    const entry = data.data[0];
    return { value: parseInt(entry.value, 10), label: entry.value_classification };
  }

  async fetchHistoricalPrices() {
    const data = await fetchWithTimeout(HISTORICAL_URL);
    return data.prices.map(([, price]) => price);
  }
}

module.exports = { MarketDataService };
