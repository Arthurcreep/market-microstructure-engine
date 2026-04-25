const stats = {
  totalSignals: 0,
  returns1s: []
};

const recordSignalResult = (signals, futureReturn1s) => {
  if (!signals.length || !futureReturn1s) {
    return;
  }

  stats.totalSignals += signals.length;
  stats.returns1s.push(futureReturn1s.returnValue);

  if (stats.returns1s.length > 5000) {
    stats.returns1s.shift();
  }
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
    winRate1s: getWinRate(stats.returns1s)
  };
};

module.exports = {
  recordSignalResult,
  getStats
};