jest.useFakeTimers();

const { DataScheduler } = require('../src/main/services/DataScheduler');

describe('DataScheduler', () => {
  let scheduler;
  let mockFetchPrice;
  let mockFetchFearGreed;
  let mockFetchHistorical;
  let mockFetchMVRVZScore;

  beforeEach(() => {
    mockFetchPrice = jest.fn().mockResolvedValue(67000);
    mockFetchFearGreed = jest.fn().mockResolvedValue({ value: 24, label: 'Fear' });
    mockFetchHistorical = jest.fn().mockResolvedValue([50000, 51000]);
    mockFetchMVRVZScore = jest.fn().mockResolvedValue(2.5);

    scheduler = new DataScheduler({
      fetchPrice: mockFetchPrice,
      fetchFearGreed: mockFetchFearGreed,
      fetchHistorical: mockFetchHistorical,
      fetchMVRVZScore: mockFetchMVRVZScore,
    });
  });

  afterEach(() => {
    scheduler.stop();
    jest.clearAllMocks();
  });

  describe('price polling interval', () => {
    it('fetches price immediately on start', async () => {
      scheduler.start();
      await Promise.resolve();
      expect(mockFetchPrice).toHaveBeenCalledTimes(1);
    });

    it('fetches price again after 60 seconds', async () => {
      scheduler.start();
      await Promise.resolve();
      jest.advanceTimersByTime(60000);
      await Promise.resolve();
      expect(mockFetchPrice).toHaveBeenCalledTimes(2);
    });

    it('does not fetch price before 60 seconds elapse', async () => {
      scheduler.start();
      await Promise.resolve();
      jest.advanceTimersByTime(59000);
      await Promise.resolve();
      expect(mockFetchPrice).toHaveBeenCalledTimes(1);
    });

    it('fetches price 3 times after 2 full intervals', async () => {
      scheduler.start();
      await Promise.resolve();
      jest.advanceTimersByTime(120000);
      await Promise.resolve();
      expect(mockFetchPrice).toHaveBeenCalledTimes(3);
    });
  });

  describe('daily polling (F&G and historical)', () => {
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    it('fetches F&G once on start', async () => {
      scheduler.start();
      await Promise.resolve();
      expect(mockFetchFearGreed).toHaveBeenCalledTimes(1);
    });

    it('does not re-fetch F&G within same day', async () => {
      scheduler.start();
      await Promise.resolve();
      jest.advanceTimersByTime(ONE_DAY_MS - 1);
      await Promise.resolve();
      expect(mockFetchFearGreed).toHaveBeenCalledTimes(1);
    });

    it('re-fetches F&G after 24 hours', async () => {
      scheduler.start();
      await Promise.resolve();
      jest.advanceTimersByTime(ONE_DAY_MS);
      await Promise.resolve();
      expect(mockFetchFearGreed).toHaveBeenCalledTimes(2);
    });

    it('fetches historical prices once on start', async () => {
      scheduler.start();
      await Promise.resolve();
      expect(mockFetchHistorical).toHaveBeenCalledTimes(1);
    });

    it('does not re-fetch historical prices within same day', async () => {
      scheduler.start();
      await Promise.resolve();
      jest.advanceTimersByTime(ONE_DAY_MS - 1);
      await Promise.resolve();
      expect(mockFetchHistorical).toHaveBeenCalledTimes(1);
    });
  });

  describe('over-fetch prevention', () => {
    it('rapid successive start calls do not multiply API calls', async () => {
      scheduler.start();
      scheduler.start(); // second call ignored
      await Promise.resolve();
      expect(mockFetchPrice).toHaveBeenCalledTimes(1);
    });
  });

  describe('retry and fallback', () => {
    it('retries on first price fetch failure', async () => {
      mockFetchPrice
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue(67000);

      scheduler.start();
      await Promise.resolve();
      await Promise.resolve(); // allow retry microtask
      expect(mockFetchPrice).toHaveBeenCalledTimes(2);
    });

    it('emits price-updated event with last cached value on total failure', async () => {
      const handler = jest.fn();
      scheduler.on('price-updated', handler);

      // Provide initial successful fetch to populate cache
      mockFetchPrice.mockResolvedValueOnce(67000);
      scheduler.start();
      await Promise.resolve();

      // Next poll fails entirely
      mockFetchPrice.mockRejectedValue(new Error('fail'));
      jest.advanceTimersByTime(60000);
      await Promise.resolve();
      await Promise.resolve();

      // handler should have been called at least once with 67000
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ price: 67000 }));
    });
  });

  describe('MVRV polling', () => {
    const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
    // Drain the async chain: _pollPrice (1 await) -> _pollMVRVIfNeeded (1 await) -> fetchMVRVZScore (1 await)
    const flush = async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    };

    it('fetches MVRV on first tick and emits mvrv-updated', async () => {
      const handler = jest.fn();
      scheduler.on('mvrv-updated', handler);

      scheduler.start();
      await flush();

      expect(mockFetchMVRVZScore).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ mvrvZScore: 2.5 });
    });

    it('does not re-fetch MVRV within 4 hours but re-emits cached value', async () => {
      const handler = jest.fn();
      scheduler.on('mvrv-updated', handler);

      scheduler.start();
      await flush();

      // Advance one 60s tick (still within 4h window)
      jest.advanceTimersByTime(60000);
      await flush();

      expect(mockFetchMVRVZScore).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenLastCalledWith({ mvrvZScore: 2.5 });
    });

    it('re-fetches MVRV after 4 hours', async () => {
      mockFetchMVRVZScore
        .mockResolvedValueOnce(2.5)
        .mockResolvedValueOnce(3.1);

      const handler = jest.fn();
      scheduler.on('mvrv-updated', handler);

      scheduler.start();
      await flush();

      // Advance to just before 4h (still within cache window) — stays at 1 fetch
      jest.advanceTimersByTime(FOUR_HOURS_MS - 60000);
      await flush();
      expect(mockFetchMVRVZScore).toHaveBeenCalledTimes(1);

      // Advance one more tick, crossing the 4h threshold — triggers second fetch
      jest.advanceTimersByTime(60000);
      await flush();

      expect(mockFetchMVRVZScore).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenLastCalledWith({ mvrvZScore: 3.1 });
    });

    it('re-emits cached MVRV on fetch failure', async () => {
      const handler = jest.fn();
      scheduler.on('mvrv-updated', handler);

      scheduler.start();
      await flush();

      // Simulate failure on second fetch (after 4h)
      mockFetchMVRVZScore.mockRejectedValue(new Error('API down'));
      jest.advanceTimersByTime(FOUR_HOURS_MS);
      await flush();

      expect(handler).toHaveBeenLastCalledWith({ mvrvZScore: 2.5 });
    });
  });
});
