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

  it('classifies mvrvZScore < 1 as Accumulation with green color', () => {
    const result = panel._enrichData({ price: 75000, fearGreed: 26, mayerMultiple: 0.89, mvrvZScore: 0.5 });
    expect(result.mvrvLabel).toBe('Accumulation');
    expect(result.mvrvColor).toBe('green');
  });

  it('classifies mvrvZScore between 1 and 3 as Distribution', () => {
    const result = panel._enrichData({ price: 75000, fearGreed: 26, mayerMultiple: 0.89, mvrvZScore: 2.0 });
    expect(result.mvrvLabel).toBe('Distribution');
    expect(result.mvrvColor).toBe('#f5a623');
  });

  it('classifies mvrvZScore >= 3 as Bubble with red color', () => {
    const result = panel._enrichData({ price: 75000, fearGreed: 26, mayerMultiple: 0.89, mvrvZScore: 4.0 });
    expect(result.mvrvLabel).toBe('Bubble');
    expect(result.mvrvColor).toBe('red');
  });

  it('sets mvrvLabel to dash and mvrvColor to gray when mvrvZScore is null', () => {
    const result = panel._enrichData({ price: 75000, fearGreed: 26, mayerMultiple: 0.89, mvrvZScore: null });
    expect(result.mvrvLabel).toBe('—');
    expect(result.mvrvColor).toBe('gray');
  });

  it('sets mvrvLabel to dash and mvrvColor to gray when mvrvZScore is undefined', () => {
    const result = panel._enrichData({ price: 75000, fearGreed: 26, mayerMultiple: 0.89 });
    expect(result.mvrvLabel).toBe('—');
    expect(result.mvrvColor).toBe('gray');
  });

  it('sets mvrvLabel to dash and mvrvColor to gray when mvrvZScore is NaN', () => {
    const result = panel._enrichData({ price: 75000, fearGreed: 26, mayerMultiple: 0.89, mvrvZScore: NaN });
    expect(result.mvrvLabel).toBe('—');
    expect(result.mvrvColor).toBe('gray');
  });

  it('classifies mvrvZScore = 0 as Accumulation with green color', () => {
    const result = panel._enrichData({ price: 75000, fearGreed: 26, mayerMultiple: 0.89, mvrvZScore: 0 });
    expect(result.mvrvLabel).toBe('Accumulation');
    expect(result.mvrvColor).toBe('green');
  });
});
