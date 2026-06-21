const { PanelController } = require('../src/main/panel');

describe('PanelController._enrichData', () => {
  const panel = new PanelController();

  it('passes marketState through unchanged', () => {
    const result = panel._enrichData({ price: 75000, fearGreed: 26, mayerMultiple: 0.89, marketState: 'GREEDY' });
    expect(result.marketState).toBe('GREEDY');
  });

  it('returns null for marketState when omitted', () => {
    const result = panel._enrichData({ price: 75000, fearGreed: 26, mayerMultiple: 0.89 });
    expect(result.marketState).toBeNull();
  });

  it('still computes fearGreedLabel and mayerLabel correctly', () => {
    const result = panel._enrichData({ price: 75000, fearGreed: 26, mayerMultiple: 0.89, marketState: null });
    // fearGreed 26 → band max:45 → 'Fear'
    expect(result.fearGreedLabel).toBe('Fear');
    // mayerMultiple 0.89 → band max:1.0 → 'Fair Value'
    expect(result.mayerLabel).toBe('Fair Value');
  });

  it('all null inputs return null labels and null marketState', () => {
    const result = panel._enrichData({ price: null, fearGreed: null, mayerMultiple: null, marketState: null });
    expect(result.fearGreedLabel).toBeNull();
    expect(result.mayerLabel).toBeNull();
    expect(result.marketState).toBeNull();
  });

  it('passes mvrvZScore through in result', () => {
    const result = panel._enrichData({ price: 75000, fearGreed: 26, mayerMultiple: 0.89, mvrvZScore: 2.5 });
    expect(result.mvrvZScore).toBe(2.5);
  });

  it('passes mvrvLabel and mvrvColor through unchanged (classification happens upstream, not in the controller)', () => {
    const result = panel._enrichData({
      price: 75000, fearGreed: 26, mayerMultiple: 0.89, mvrvZScore: 0.5,
      mvrvLabel: 'Accumulation', mvrvColor: 'green',
    });
    expect(result.mvrvLabel).toBe('Accumulation');
    expect(result.mvrvColor).toBe('green');
  });

  it('defaults mvrvLabel to dash and mvrvColor to gray when omitted', () => {
    const result = panel._enrichData({ price: 75000, fearGreed: 26, mayerMultiple: 0.89, mvrvZScore: null });
    expect(result.mvrvLabel).toBe('—');
    expect(result.mvrvColor).toBe('gray');
  });

  it('defaults mvrvLabel and mvrvColor when entirely omitted', () => {
    const result = panel._enrichData({ price: 75000, fearGreed: 26, mayerMultiple: 0.89 });
    expect(result.mvrvLabel).toBe('—');
    expect(result.mvrvColor).toBe('gray');
  });
});
