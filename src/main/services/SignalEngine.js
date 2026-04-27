const STATES = {
  STRONG_BUY: 'STRONG_BUY',
  OVERHEATED: 'OVERHEATED',
  FEARFUL: 'FEARFUL',
  GREEDY: 'GREEDY',
  NEUTRAL: 'NEUTRAL',
};

class SignalEngine {
  static classifyMarketState(fearGreed, mayerMultiple) {
    if (fearGreed == null || mayerMultiple == null) return null;

    if (fearGreed < 20 && mayerMultiple < 0.8) return STATES.STRONG_BUY;
    if (fearGreed > 80 && mayerMultiple > 1.5) return STATES.OVERHEATED;
    if (fearGreed < 30) return STATES.FEARFUL;
    if (fearGreed > 70) return STATES.GREEDY;
    return STATES.NEUTRAL;
  }

  static shouldAlert(marketState) {
    if (marketState === STATES.STRONG_BUY || marketState === STATES.OVERHEATED) {
      return { shouldAlert: true, type: marketState };
    }
    return { shouldAlert: false, type: null };
  }
}

module.exports = { SignalEngine, STATES };
