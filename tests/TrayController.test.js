const { Menu } = require('electron');
const { TrayController, formatTrayLabel } = require('../src/main/tray');

function makeController(opts = {}) {
  return new TrayController({
    onQuit: jest.fn(),
    onTogglePanel: jest.fn(),
    onToggleWidget: jest.fn(),
    startupService: null,
    ...opts,
  });
}

describe('TrayController menu', () => {
  beforeEach(() => {
    Menu.buildFromTemplate.mockClear();
  });

  it('includes "Check for Updates" item when onCheckForUpdates provided', () => {
    const cb = jest.fn();
    makeController({ onCheckForUpdates: cb });
    const [template] = Menu.buildFromTemplate.mock.calls[0];
    const item = template.find(i => i.label === 'Check for Updates');
    expect(item).toBeDefined();
  });

  it('omits "Check for Updates" item when onCheckForUpdates is null', () => {
    makeController({ onCheckForUpdates: null });
    const [template] = Menu.buildFromTemplate.mock.calls[0];
    const item = template.find(i => i.label === 'Check for Updates');
    expect(item).toBeUndefined();
  });

  it('"Check for Updates" click fires onCheckForUpdates callback', () => {
    const cb = jest.fn();
    makeController({ onCheckForUpdates: cb });
    const [template] = Menu.buildFromTemplate.mock.calls[0];
    const item = template.find(i => i.label === 'Check for Updates');
    item.click();
    expect(cb).toHaveBeenCalledTimes(1);
  });
});

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
