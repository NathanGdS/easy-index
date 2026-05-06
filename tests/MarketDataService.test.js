jest.mock('node-fetch');

const fetch = require('node-fetch');
const { MarketDataService } = require('../src/main/services/MarketDataService');

describe('MarketDataService.fetchMVRVZScore', () => {
  let service;

  beforeEach(() => {
    service = new MarketDataService();
    jest.clearAllMocks();
  });

  it('returns mvrvZscore when called with a YYYY-MM-DD string', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ mvrvZscore: 2.34 }),
    });

    const result = await service.fetchMVRVZScore('2024-01-15');

    expect(result).toBe(2.34);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.bitcoin-data.com/v1/mvrv-zscore/2024-01-15',
      expect.objectContaining({ signal: expect.any(Object) })
    );
  });

  it('formats a Date object as YYYY-MM-DD before calling the API', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ mvrvZscore: 1.1 }),
    });

    const date = new Date('2024-03-20T00:00:00.000Z');
    await service.fetchMVRVZScore(date);

    expect(fetch).toHaveBeenCalledWith(
      'https://api.bitcoin-data.com/v1/mvrv-zscore/2024-03-20',
      expect.anything()
    );
  });

  it('throws when the API returns a non-ok HTTP status', async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 500 });

    await expect(service.fetchMVRVZScore('2024-01-15')).rejects.toThrow('HTTP 500');
  });

  it('propagates network errors', async () => {
    fetch.mockRejectedValueOnce(new Error('network failure'));

    await expect(service.fetchMVRVZScore('2024-01-15')).rejects.toThrow('network failure');
  });
});
