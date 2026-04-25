const detectSignal = (metrics) => {
  const signals = [];

  const { volumeDelta, obiTop5, microPrice, midPrice } = metrics;

  if (Math.abs(volumeDelta) > 0.01) {
    signals.push({
      type: "VOLUME_SPIKE",
      direction: volumeDelta > 0 ? "buy" : "sell"
    });
  }

  if (obiTop5 > 0.4) {
    signals.push({
      type: "OBI_BUY_PRESSURE"
    });
  }

  if (obiTop5 < -0.4) {
    signals.push({
      type: "OBI_SELL_PRESSURE"
    });
  }

  if (microPrice > midPrice) {
    signals.push({
      type: "MICRO_UP"
    });
  }

  if (microPrice < midPrice) {
    signals.push({
      type: "MICRO_DOWN"
    });
  }

  return signals;
};

module.exports = { detectSignal };