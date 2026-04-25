const { getCompletedBuckets } = require("./aggregator.service");
const { logger } = require("../../utils/logger");
const { detectSignal } = require("../signals/signal-detector.service");
const { addToHistory, evaluateSignal } = require("../backtest/backtest.service");
const { recordSignalResult, getStats } = require("../backtest/stats.service");

const getTopLevelsVolume = (levels, depth = 5) => {
  return levels
    .slice(0, depth)
    .reduce((sum, level) => sum + Number(level[1]), 0);
};

const getBestPrice = (levels) => {
  return Number(levels[0][0]);
};

const getBestSize = (levels) => {
  return Number(levels[0][1]);
};

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
      const signals = detectSignal(metrics);

      addToHistory(metrics);

      const futureReturn1s = evaluateSignal(metrics, 1000);
      const futureReturn5s = evaluateSignal(metrics, 5000);
      const futureReturn10s = evaluateSignal(metrics, 10000);

      recordSignalResult(signals, futureReturn1s);

      const signalStats = getStats();

      logger.info(
        {
          ...metrics,
          signals,
          futureReturn1s,
          futureReturn5s,
          futureReturn10s,
          signalStats
        },
        "Processed bucket with signal statistics"
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