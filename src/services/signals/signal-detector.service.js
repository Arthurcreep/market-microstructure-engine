const detectSignal = (metrics) => {
  const signals = [];

  const { volumeDelta, obiTop5, microPrice, midPrice } = metrics;

  // 1. Volume spike (сильно ослабили порог)
  if (Math.abs(volumeDelta) > 0.001) {
    signals.push({
      type: "VOLUME_SPIKE",
      direction: volumeDelta > 0 ? "buy" : "sell"
    });
  }

  // 2. OBI pressure (ослабили)
  if (obiTop5 > 0.1) {
    signals.push({
      type: "OBI_BUY_PRESSURE"
    });
  }

  if (obiTop5 < -0.1) {
    signals.push({
      type: "OBI_SELL_PRESSURE"
    });
  }

  // 3. Microprice bias (оставляем как есть)
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