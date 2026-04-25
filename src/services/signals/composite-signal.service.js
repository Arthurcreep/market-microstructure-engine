const detectCompositeSignal = (metrics) => {
  const signals = [];

  const { obiTop5, volumeDelta, microPrice, midPrice, spread } = metrics;

  if (
    obiTop5 > 0.2 &&
    volumeDelta > 0 &&
    microPrice > midPrice &&
    spread < 1
  ) {
    signals.push({
      type: "STRONG_BUY"
    });
  }

  if (
    obiTop5 < -0.2 &&
    volumeDelta < 0 &&
    microPrice < midPrice &&
    spread < 1
  ) {
    signals.push({
      type: "STRONG_SELL"
    });
  }

  return signals;
};

module.exports = { detectCompositeSignal };