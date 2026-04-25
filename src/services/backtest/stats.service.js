const stats = {
  totalSignals: 0,
  returns1s: [],
  returns5s: [],
  returns10s: []
};

const recordSignalResult = (signals, futureReturn1s, futureReturn5s, futureReturn10s) => {
  if (signals.length) {
    stats.totalSignals += signals.length;
  }

  if (futureReturn1s) {
    stats.returns1s.push(futureReturn1s.returnValue);
  }

  if (futureReturn5s) {
    stats.returns5s.push(futureReturn5s.returnValue);
  }

  if (futureReturn10s) {
    stats.returns10s.push(futureReturn10s.returnValue);
  }

  if (stats.returns1s.length > 5000) stats.returns1s.shift();
  if (stats.returns5s.length > 5000) stats.returns5s.shift();
  if (stats.returns10s.length > 5000) stats.returns10s.shift();
};

const getAverage = (values) => {
  if (!values.length) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const getWinRate = (values) => {
  if (!values.length) {
    return null;
  }

  const wins = values.filter((value) => value > 0).length;

  return wins / values.length;
};

const getStats = () => {
  return {
    totalSignals: stats.totalSignals,

    samples1s: stats.returns1s.length,
    avgReturn1s: getAverage(stats.returns1s),
    winRate1s: getWinRate(stats.returns1s),

    samples5s: stats.returns5s.length,
    avgReturn5s: getAverage(stats.returns5s),
    winRate5s: getWinRate(stats.returns5s),

    samples10s: stats.returns10s.length,
    avgReturn10s: getAverage(stats.returns10s),
    winRate10s: getWinRate(stats.returns10s)
  };
};

module.exports = {
  recordSignalResult,
  getStats
};