const { SignalEngine } = require('../src/main/services/SignalEngine');

describe('SignalEngine', () => {
  describe('classifyMarketState', () => {
    it('returns Strong Buy when F&G < 20 AND Mayer < 0.8', () => {
      expect(SignalEngine.classifyMarketState(15, 0.7)).toBe('STRONG_BUY');
    });

    it('returns Strong Buy at exact boundary: F&G = 19, Mayer = 0.79', () => {
      expect(SignalEngine.classifyMarketState(19, 0.79)).toBe('STRONG_BUY');
    });

    it('does NOT return Strong Buy when only F&G condition met', () => {
      expect(SignalEngine.classifyMarketState(15, 1.0)).not.toBe('STRONG_BUY');
    });

    it('does NOT return Strong Buy when only Mayer condition met', () => {
      expect(SignalEngine.classifyMarketState(50, 0.7)).not.toBe('STRONG_BUY');
    });

    it('returns Overheated when F&G > 80 AND Mayer > 1.5', () => {
      expect(SignalEngine.classifyMarketState(85, 1.6)).toBe('OVERHEATED');
    });

    it('returns Overheated at exact boundary: F&G = 81, Mayer = 1.51', () => {
      expect(SignalEngine.classifyMarketState(81, 1.51)).toBe('OVERHEATED');
    });

    it('does NOT return Overheated when only F&G condition met', () => {
      expect(SignalEngine.classifyMarketState(85, 1.0)).not.toBe('OVERHEATED');
    });

    it('does NOT return Overheated when only Mayer condition met', () => {
      expect(SignalEngine.classifyMarketState(50, 1.6)).not.toBe('OVERHEATED');
    });

    it('returns Neutral for normal market conditions', () => {
      expect(SignalEngine.classifyMarketState(50, 1.0)).toBe('NEUTRAL');
    });

    it('returns null when inputs are missing', () => {
      expect(SignalEngine.classifyMarketState(null, 1.0)).toBeNull();
      expect(SignalEngine.classifyMarketState(50, null)).toBeNull();
    });

    it('returns Fearful when F&G 20-30 range neutral Mayer', () => {
      expect(SignalEngine.classifyMarketState(25, 1.0)).toBe('FEARFUL');
    });

    it('returns Greedy when F&G 70-80 range neutral Mayer', () => {
      expect(SignalEngine.classifyMarketState(75, 1.2)).toBe('GREEDY');
    });
  });

  describe('shouldAlert', () => {
    it('returns alert for STRONG_BUY state', () => {
      const result = SignalEngine.shouldAlert('STRONG_BUY');
      expect(result.shouldAlert).toBe(true);
      expect(result.type).toBe('STRONG_BUY');
    });

    it('returns alert for OVERHEATED state', () => {
      const result = SignalEngine.shouldAlert('OVERHEATED');
      expect(result.shouldAlert).toBe(true);
      expect(result.type).toBe('OVERHEATED');
    });

    it('returns no alert for NEUTRAL state', () => {
      expect(SignalEngine.shouldAlert('NEUTRAL').shouldAlert).toBe(false);
    });

    it('returns no alert for FEARFUL state', () => {
      expect(SignalEngine.shouldAlert('FEARFUL').shouldAlert).toBe(false);
    });

    it('returns no alert for GREEDY state', () => {
      expect(SignalEngine.shouldAlert('GREEDY').shouldAlert).toBe(false);
    });
  });
});
