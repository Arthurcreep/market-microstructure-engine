const history = [];

const addToHistory = (metrics) => {
  history.push(metrics);

  if (history.length > 10000) {
    history.shift();
  }
};

const evaluateSignal = (metrics, horizonMs = 1000) => {
  const targetTime = metrics.startTime + horizonMs;

  // ищем ближайший future bucket
  let closest = null;
  let minDiff = Infinity;

  for (const item of history) {
    const diff = Math.abs(item.startTime - targetTime);

    if (diff < minDiff) {
      minDiff = diff;
      closest = item;
    }
  }

  // если слишком далеко — игнорируем
  if (!closest || minDiff > 1500) {
    return null;
  }

  return {
    horizonMs,
    returnValue:
      (closest.midPrice - metrics.midPrice) / metrics.midPrice,
    currentMidPrice: metrics.midPrice,
    futureMidPrice: closest.midPrice
  };
};

module.exports = {
  addToHistory,
  evaluateSignal
};