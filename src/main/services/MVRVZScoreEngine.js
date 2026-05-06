class MVRVZScoreEngine {
  static classifyZone(score) {
    if (score === null || score === undefined || Number.isNaN(score)) {
      return null;
    }
    if (score < 1) {
      return { zone: 'ACCUMULATION', label: 'Accumulation', color: 'green' };
    }
    if (score < 3) {
      return { zone: 'DISTRIBUTION', label: 'Distribution', color: '#f5a623' };
    }
    return { zone: 'BUBBLE', label: 'Bubble', color: 'red' };
  }
}

module.exports = { MVRVZScoreEngine };
