class MayerMultipleEngine {
  static computeMA200(prices) {
    if (!prices || prices.length < 200) return null;
    const last200 = prices.slice(-200);
    const sum = last200.reduce((acc, p) => acc + p, 0);
    return sum / 200;
  }

  static computeMayerMultiple(currentPrice, ma200) {
    if (currentPrice == null || ma200 == null || ma200 === 0) return null;
    return currentPrice / ma200;
  }

  static computeFromHistoricalPrices(historicalPrices, currentPrice) {
    const ma200 = MayerMultipleEngine.computeMA200(historicalPrices);
    const mayerMultiple = MayerMultipleEngine.computeMayerMultiple(currentPrice, ma200);
    return { ma200, mayerMultiple };
  }
}

module.exports = { MayerMultipleEngine };
