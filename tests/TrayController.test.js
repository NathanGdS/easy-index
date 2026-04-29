const { formatTrayLabel } = require('../src/main/tray');

describe('formatTrayLabel', () => {
  it('prefixes STRONG_BUY with 🔵', () => {
    expect(formatTrayLabel(75000, 26, 0.89, 'STRONG_BUY')).toMatch(/^🔵/);
  });

  it('prefixes OVERHEATED with 🔴', () => {
    expect(formatTrayLabel(75000, 26, 0.89, 'OVERHEATED')).toMatch(/^🔴/);
  });

  it('prefixes FEARFUL with 🟠', () => {
    expect(formatTrayLabel(75000, 26, 0.89, 'FEARFUL')).toMatch(/^🟠/);
  });

  it('prefixes GREEDY with 🟡', () => {
    expect(formatTrayLabel(75000, 26, 0.89, 'GREEDY')).toMatch(/^🟡/);
  });

  it('prefixes NEUTRAL with ⚪', () => {
    expect(formatTrayLabel(75000, 26, 0.89, 'NEUTRAL')).toMatch(/^⚪/);
  });

  it('null state — no badge, starts with ₿', () => {
    expect(formatTrayLabel(75000, 26, 0.89, null)).toMatch(/^₿/);
  });

  it('price has no space after ₿ symbol', () => {
    expect(formatTrayLabel(75000, null, null, null)).toContain('₿75K');
    expect(formatTrayLabel(75000, null, null, null)).not.toContain('₿ ');
  });

  it('mayer uses × prefix not M', () => {
    expect(formatTrayLabel(null, null, 0.89, null)).toContain('×0.89');
    expect(formatTrayLabel(null, null, 0.89, null)).not.toContain('M ');
  });

  it('all null returns ₿---', () => {
    expect(formatTrayLabel(null, null, null, null)).toBe('₿---');
  });

  it('F&G value ≤25 uses extreme fear emoji 😨', () => {
    expect(formatTrayLabel(75000, 20, 0.89, null)).toContain('😨');
  });

  it('full string: GREEDY state with price 75000, fearGreed 26, mayer 0.89', () => {
    // fearGreed 26 → band max:45 → emoji 😟 (Fear)
    // mayerMultiple 0.89 → band max:1.0 → 'Fair Value' (but formatMayer just uses ×0.89)
    // badge 🟡, price ₿75K, fearGreed 😟26, mayer ×0.89
    expect(formatTrayLabel(75000, 26, 0.89, 'GREEDY')).toBe('🟡 ₿75K 😟26 ×0.89');
  });
});
