const { logger } = require("../../utils/logger");

const lastTrades = {
  binance: null,
  bybit: null
};

const SPREAD_THRESHOLD_BPS = 1;

const updateLastTrade = (trade) => {
  lastTrades[trade.exchange] = {
    exchange: trade.exchange,
    symbol: trade.symbol,
    price: Number(trade.price),
    size: Number(trade.size),
    side: trade.side,
    exchangeTimestamp: trade.exchangeTimestamp,
    receivedAt: trade.receivedAt
  };

  detectCrossExchangeSpread();
};

const detectCrossExchangeSpread = () => {
  const binance = lastTrades.binance;
  const bybit = lastTrades.bybit;

  if (!binance || !bybit) {
    return null;
  }

  const mid = (binance.price + bybit.price) / 2;
  const spread = binance.price - bybit.price;
  const spreadBps = (spread / mid) * 10000;

  const signal = {
    binancePrice: binance.price,
    bybitPrice: bybit.price,
    spread,
    spreadBps,
    direction: null
  };

  if (spreadBps > SPREAD_THRESHOLD_BPS) {
    signal.direction = "BUY_BYBIT_SELL_BINANCE";
  }

  if (spreadBps < -SPREAD_THRESHOLD_BPS) {
    signal.direction = "BUY_BINANCE_SELL_BYBIT";
  }

  if (signal.direction) {
    logger.info(signal, "Cross-exchange spread signal");
  }

  return signal;
};

module.exports = {
  updateLastTrade,
  detectCrossExchangeSpread
};