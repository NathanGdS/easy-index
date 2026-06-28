const { AlertService } = require('../src/main/services/AlertService');

function makePrefs({ muted = {}, onCooldown = {} } = {}) {
  return {
    isMuted: jest.fn(type => !!muted[type]),
    isOnCooldown: jest.fn(type => !!onCooldown[type]),
    setLastFired: jest.fn(),
  };
}

describe('AlertService', () => {
  let mockNotify;

  beforeEach(() => {
    mockNotify = jest.fn();
  });

  it('fires notification for STRONG_BUY alert', () => {
    const service = new AlertService({ notify: mockNotify, prefs: makePrefs() });
    service.trigger('STRONG_BUY');
    expect(mockNotify).toHaveBeenCalledTimes(1);
    expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ type: 'STRONG_BUY' }));
  });

  it('fires notification for OVERHEATED alert', () => {
    const service = new AlertService({ notify: mockNotify, prefs: makePrefs() });
    service.trigger('OVERHEATED');
    expect(mockNotify).toHaveBeenCalledTimes(1);
    expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ type: 'OVERHEATED' }));
  });

  it('suppressed when type is muted', () => {
    const service = new AlertService({
      notify: mockNotify,
      prefs: makePrefs({ muted: { STRONG_BUY: true } }),
    });
    service.trigger('STRONG_BUY');
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it('suppressed when on cooldown', () => {
    const service = new AlertService({
      notify: mockNotify,
      prefs: makePrefs({ onCooldown: { STRONG_BUY: true } }),
    });
    service.trigger('STRONG_BUY');
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it('calls setLastFired on successful fire', () => {
    const prefs = makePrefs();
    const service = new AlertService({ notify: mockNotify, prefs });
    service.trigger('STRONG_BUY');
    expect(prefs.setLastFired).toHaveBeenCalledWith('STRONG_BUY', expect.any(Number));
  });

  it('does not call setLastFired when suppressed by mute', () => {
    const prefs = makePrefs({ muted: { STRONG_BUY: true } });
    const service = new AlertService({ notify: mockNotify, prefs });
    service.trigger('STRONG_BUY');
    expect(prefs.setLastFired).not.toHaveBeenCalled();
  });

  it('does not fire for null/undefined type', () => {
    const service = new AlertService({ notify: mockNotify, prefs: makePrefs() });
    service.trigger(null);
    service.trigger(undefined);
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it('different alert types have independent cooldowns', () => {
    const prefs = makePrefs({ muted: { STRONG_BUY: true } });
    const service = new AlertService({ notify: mockNotify, prefs });
    service.trigger('STRONG_BUY');
    service.trigger('OVERHEATED');
    expect(mockNotify).toHaveBeenCalledTimes(1);
    expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ type: 'OVERHEATED' }));
  });
});
