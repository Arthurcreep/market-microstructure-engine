const history = [];

const addToHistory = (metrics) => {
  history.push(metrics);

  if (history.length > 10000) {
    history.shift();
  }
};

const evaluateSignal = (metrics, horizonMs = 1000) => {
  const future = history.find(
    (item) => item.startTime === metrics.startTime + horizonMs
  );

  if (!future) {
    return null;
  }

  return {
    horizonMs,
    returnValue: (future.midPrice - metrics.midPrice) / metrics.midPrice,
    currentMidPrice: metrics.midPrice,
    futureMidPrice: future.midPrice
  };
};

module.exports = {
  addToHistory,
  evaluateSignal
};