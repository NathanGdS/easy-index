const { MVRVZScoreEngine } = require('../src/main/services/MVRVZScoreEngine');

describe('MVRVZScoreEngine', () => {
  describe('classifyZone', () => {
    it('classifies score 0 as ACCUMULATION', () => {
      expect(MVRVZScoreEngine.classifyZone(0)).toEqual({
        zone: 'ACCUMULATION',
        label: 'Accumulation',
        color: 'green',
      });
    });

    it('classifies score 0.5 as ACCUMULATION', () => {
      expect(MVRVZScoreEngine.classifyZone(0.5)).toEqual({
        zone: 'ACCUMULATION',
        label: 'Accumulation',
        color: 'green',
      });
    });

    it('classifies score 1 as DISTRIBUTION', () => {
      expect(MVRVZScoreEngine.classifyZone(1)).toEqual({
        zone: 'DISTRIBUTION',
        label: 'Distribution',
        color: '#f5a623',
      });
    });

    it('classifies score 2.0 as DISTRIBUTION', () => {
      expect(MVRVZScoreEngine.classifyZone(2.0)).toEqual({
        zone: 'DISTRIBUTION',
        label: 'Distribution',
        color: '#f5a623',
      });
    });

    it('classifies score 3 as BUBBLE', () => {
      expect(MVRVZScoreEngine.classifyZone(3)).toEqual({
        zone: 'BUBBLE',
        label: 'Bubble',
        color: 'red',
      });
    });

    it('classifies score 3.5 as BUBBLE', () => {
      expect(MVRVZScoreEngine.classifyZone(3.5)).toEqual({
        zone: 'BUBBLE',
        label: 'Bubble',
        color: 'red',
      });
    });

    it('classifies score 4 as BUBBLE', () => {
      expect(MVRVZScoreEngine.classifyZone(4)).toEqual({
        zone: 'BUBBLE',
        label: 'Bubble',
        color: 'red',
      });
    });

    it('classifies score 5 as BUBBLE — no upper cap', () => {
      expect(MVRVZScoreEngine.classifyZone(5)).toEqual({
        zone: 'BUBBLE',
        label: 'Bubble',
        color: 'red',
      });
    });

    it('returns null for null score', () => {
      expect(MVRVZScoreEngine.classifyZone(null)).toBeNull();
    });

    it('returns null for undefined score', () => {
      expect(MVRVZScoreEngine.classifyZone(undefined)).toBeNull();
    });

    it('returns null for NaN score', () => {
      expect(MVRVZScoreEngine.classifyZone(NaN)).toBeNull();
    });
  });
});
