let prevMetrics = null;

const detectDeltaSignal = (metrics) => {
  const signals = [];

  if (!prevMetrics) {
    prevMetrics = metrics;
    return signals;
  }

  const deltaObi = metrics.obiTop5 - prevMetrics.obiTop5;
  const deltaVolume = metrics.volumeDelta - prevMetrics.volumeDelta;
  const deltaMicro = metrics.microPrice - prevMetrics.microPrice;

  if (deltaObi > 0.1 && deltaVolume > 0 && deltaMicro > 0) {
    signals.push({
      type: "DELTA_BUY"
    });
  }

  if (deltaObi < -0.1 && deltaVolume < 0 && deltaMicro < 0) {
    signals.push({
      type: "DELTA_SELL"
    });
  }

  prevMetrics = metrics;

  return signals;
};

module.exports = { detectDeltaSignal };