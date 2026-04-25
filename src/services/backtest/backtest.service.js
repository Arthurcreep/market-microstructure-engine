const history = [];

const getSignalDirection = (signal) => {
  if (!signal) return null;

  if (signal.direction === "buy") return "buy";
  if (signal.direction === "sell") return "sell";

  if (signal.type.includes("BUY") || signal.type.includes("UP")) return "buy";
  if (signal.type.includes("SELL") || signal.type.includes("DOWN")) return "sell";

  return null;
};

const addToHistory = (metrics) => {
  history.push(metrics);

  if (history.length > 10000) {
    history.shift();
  }
};

const evaluateSignalFromHistory = (signal, horizonMs = 1000) => {
  const direction = getSignalDirection(signal);

  if (!direction) {
    return [];
  }

  const results = [];

  history.forEach((current) => {
    const targetTime = current.startTime + horizonMs;
    const future = history.find((item) => item.startTime >= targetTime);

    if (!future) {
      return;
    }

    const rawReturn = (future.midPrice - current.midPrice) / current.midPrice;

    const directionalReturn =
      direction === "buy" ? rawReturn : -rawReturn;

    results.push({
      signalType: signal.type,
      direction,
      horizonMs,
      rawReturn,
      directionalReturn,
      currentMidPrice: current.midPrice,
      futureMidPrice: future.midPrice,
      currentTime: current.startTime,
      futureTime: future.startTime
    });
  });

  return results;
};

const evaluateSignalsFromHistory = (signals, horizonMs = 1000) => {
  return signals.flatMap((signal) => evaluateSignalFromHistory(signal, horizonMs));
};

module.exports = {
  addToHistory,
  evaluateSignalsFromHistory
};