const { getCompletedBuckets } = require("./aggregator.service");
const { logger } = require("../../utils/logger");
const { detectSignal } = require("../signals/signal-detector.service");
const { detectCompositeSignal } = require("../signals/composite-signal.service");
const { detectDeltaSignal } = require("../signals/delta-signal.service");
const { addToHistory, evaluateSignalsFromHistory } = require("../backtest/backtest.service");
const { recordSignalResult, getStats } = require("../backtest/stats.service");

const getTopLevelsVolume = (levels, depth = 5) => {
  return levels
    .slice(0, depth)
    .reduce((sum, level) => sum + Number(level[1]), 0);
};

const getBestPrice = (levels) => Number(levels[0][0]);

const getBestSize = (levels) => Number(levels[0][1]);

const calculateBucketMetrics = (bucket) => {
  const trades = bucket.trades;
  const orderbook = bucket.lastOrderbook;

  const buyVolume = trades
    .filter((trade) => trade.side === "buy")
    .reduce((sum, trade) => sum + Number(trade.size), 0);

  const sellVolume = trades
    .filter((trade) => trade.side === "sell")
    .reduce((sum, trade) => sum + Number(trade.size), 0);

  const volumeDelta = buyVolume - sellVolume;

  const buyTrades = trades.filter((trade) => trade.side === "buy").length;
  const sellTrades = trades.filter((trade) => trade.side === "sell").length;
  const tradeCount = trades.length;

  const tradeCountImbalance =
    tradeCount === 0 ? 0 : (buyTrades - sellTrades) / tradeCount;

  const bestBid = getBestPrice(orderbook.bids);
  const bestAsk = getBestPrice(orderbook.asks);
  const bestBidSize = getBestSize(orderbook.bids);
  const bestAskSize = getBestSize(orderbook.asks);

  const midPrice = (bestBid + bestAsk) / 2;
  const spread = bestAsk - bestBid;

  const microPrice =
    (bestAsk * bestBidSize + bestBid * bestAskSize) /
    (bestBidSize + bestAskSize);

  const bidVolumeTop5 = getTopLevelsVolume(orderbook.bids, 5);
  const askVolumeTop5 = getTopLevelsVolume(orderbook.asks, 5);

  const obiTop5 =
    bidVolumeTop5 + askVolumeTop5 === 0
      ? 0
      : (bidVolumeTop5 - askVolumeTop5) / (bidVolumeTop5 + askVolumeTop5);

  return {
    startTime: bucket.startTime,
    endTime: bucket.endTime,

    tradesCount: tradeCount,
    buyVolume,
    sellVolume,
    volumeDelta,
    buyTrades,
    sellTrades,
    tradeCountImbalance,

    bestBid,
    bestAsk,
    bestBidSize,
    bestAskSize,
    midPrice,
    microPrice,
    spread,

    bidVolumeTop5,
    askVolumeTop5,
    obiTop5
  };
};

const processBuckets = () => {
  const completedBuckets = getCompletedBuckets();

  completedBuckets.forEach((bucket) => {
    try {
      if (!bucket.trades.length || !bucket.lastOrderbook) {
        return;
      }

      const metrics = calculateBucketMetrics(bucket);

      const baseSignals = detectSignal(metrics);
      const compositeSignals = detectCompositeSignal(metrics);
      const deltaSignals = detectDeltaSignal(metrics);

      const signals = [
        ...baseSignals,
        ...compositeSignals,
        ...deltaSignals
      ];

      addToHistory(metrics);

      const results1s = evaluateSignalsFromHistory(signals, 1000);
      const results5s = evaluateSignalsFromHistory(signals, 5000);
      const results10s = evaluateSignalsFromHistory(signals, 10000);

      results1s.forEach((result) => {
        recordSignalResult(signals, { returnValue: result.directionalReturn }, null, null);
      });

      results5s.forEach((result) => {
        recordSignalResult(signals, null, { returnValue: result.directionalReturn }, null);
      });

      results10s.forEach((result) => {
        recordSignalResult(signals, null, null, { returnValue: result.directionalReturn });
      });

      const signalStats = getStats();

      logger.info(
        {
          ...metrics,
          baseSignals,
          compositeSignals,
          deltaSignals,
          signals,
          directionAware: {
            samples1s: results1s.length,
            samples5s: results5s.length,
            samples10s: results10s.length
          },
          signalStats
        },
        "Processed bucket with direction-aware backtest"
      );
    } catch (error) {
      logger.error(
        {
          message: error.message,
          name: error.name,
          stack: error.stack,
          bucketStartTime: bucket.startTime
        },
        "Failed to process bucket"
      );
    }
  });
};

module.exports = {
  processBuckets,
  calculateBucketMetrics
};