const { MayerMultipleEngine } = require('../src/main/services/MayerMultipleEngine');

describe('MayerMultipleEngine', () => {
  describe('computeMA200', () => {
    it('returns null when prices array is empty', () => {
      expect(MayerMultipleEngine.computeMA200([])).toBeNull();
    });

    it('returns null when fewer than 200 prices provided', () => {
      const prices = Array(199).fill(50000);
      expect(MayerMultipleEngine.computeMA200(prices)).toBeNull();
    });

    it('computes average of exactly 200 prices', () => {
      const prices = Array(200).fill(50000);
      expect(MayerMultipleEngine.computeMA200(prices)).toBe(50000);
    });

    it('uses last 200 prices when more than 200 provided', () => {
      // first 100 prices = 10000, last 200 = 50000
      const prices = [...Array(100).fill(10000), ...Array(200).fill(50000)];
      expect(MayerMultipleEngine.computeMA200(prices)).toBe(50000);
    });

    it('computes correct average for varied prices', () => {
      const prices = Array(200).fill(0).map((_, i) => i + 1); // 1..200
      const expected = (200 * 201) / 2 / 200; // 100.5
      expect(MayerMultipleEngine.computeMA200(prices)).toBeCloseTo(expected, 5);
    });
  });

  describe('computeMayerMultiple', () => {
    it('returns null when currentPrice is missing', () => {
      expect(MayerMultipleEngine.computeMayerMultiple(null, 50000)).toBeNull();
    });

    it('returns null when ma200 is null', () => {
      expect(MayerMultipleEngine.computeMayerMultiple(67000, null)).toBeNull();
    });

    it('returns null when ma200 is zero', () => {
      expect(MayerMultipleEngine.computeMayerMultiple(67000, 0)).toBeNull();
    });

    it('computes mayer multiple correctly', () => {
      expect(MayerMultipleEngine.computeMayerMultiple(67000, 50000)).toBeCloseTo(1.34, 2);
    });

    it('returns value below 1 for undervalued scenario', () => {
      expect(MayerMultipleEngine.computeMayerMultiple(40000, 50000)).toBeCloseTo(0.8, 2);
    });
  });

  describe('computeFromHistoricalPrices', () => {
    it('returns null result when insufficient data', () => {
      const result = MayerMultipleEngine.computeFromHistoricalPrices([], 67000);
      expect(result.ma200).toBeNull();
      expect(result.mayerMultiple).toBeNull();
    });

    it('returns computed values with sufficient historical data', () => {
      const prices = Array(200).fill(50000);
      const result = MayerMultipleEngine.computeFromHistoricalPrices(prices, 67000);
      expect(result.ma200).toBe(50000);
      expect(result.mayerMultiple).toBeCloseTo(1.34, 2);
    });
  });
});
