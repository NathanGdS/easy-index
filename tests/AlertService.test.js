const { AlertService } = require('../src/main/services/AlertService');

describe('AlertService', () => {
  let service;
  let mockNotify;

  beforeEach(() => {
    jest.useFakeTimers();
    mockNotify = jest.fn();
    service = new AlertService({ notify: mockNotify, cooldownMs: 10000 });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('fires notification for STRONG_BUY alert', () => {
    service.trigger('STRONG_BUY');
    expect(mockNotify).toHaveBeenCalledTimes(1);
    expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ type: 'STRONG_BUY' }));
  });

  it('fires notification for OVERHEATED alert', () => {
    service.trigger('OVERHEATED');
    expect(mockNotify).toHaveBeenCalledTimes(1);
    expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ type: 'OVERHEATED' }));
  });

  it('does not repeat same alert within cooldown window', () => {
    service.trigger('STRONG_BUY');
    service.trigger('STRONG_BUY');
    expect(mockNotify).toHaveBeenCalledTimes(1);
  });

  it('fires again after cooldown expires', () => {
    service.trigger('STRONG_BUY');
    jest.advanceTimersByTime(10001);
    service.trigger('STRONG_BUY');
    expect(mockNotify).toHaveBeenCalledTimes(2);
  });

  it('different alert types have independent cooldowns', () => {
    service.trigger('STRONG_BUY');
    service.trigger('OVERHEATED');
    expect(mockNotify).toHaveBeenCalledTimes(2);
  });

  it('does not fire for null/undefined type', () => {
    service.trigger(null);
    service.trigger(undefined);
    expect(mockNotify).not.toHaveBeenCalled();
  });
});
