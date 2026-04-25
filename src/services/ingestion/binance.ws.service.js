const WebSocket = require("ws");
const { logger } = require("../../utils/logger");
const { RawTrade } = require("../../models/raw-trade.model");
const { addTradeToBucket } = require("../aggregation/aggregator.service");

const BINANCE_WS_URL = "wss://stream.binance.com:9443/ws/btcusdt@trade";

const startBinanceTradesStream = () => {
  const ws = new WebSocket(BINANCE_WS_URL);

  ws.on("open", () => {
    logger.info("Binance Trades WS connected");
  });

  ws.on("message", async (data) => {
    try {
      const parsed = JSON.parse(data.toString());

      const trade = {
        exchange: "binance",
        symbol: parsed.s,
        price: parsed.p,
        size: parsed.q,
        side: parsed.m ? "sell" : "buy",
        exchangeTimestamp: parsed.T,
        receivedAt: Date.now()
      };

      if (!trade.symbol || !trade.price || !trade.size || !trade.exchangeTimestamp) {
        logger.warn({ parsed }, "Invalid Binance trade payload");
        return;
      }

      addTradeToBucket(trade);

      await RawTrade.create(trade);
    } catch (error) {
      logger.error(
        {
          message: error.message,
          name: error.name,
          stack: error.stack
        },
        "Failed to process Binance trade"
      );
    }
  });

  ws.on("error", (error) => {
    logger.error(
      {
        message: error.message,
        name: error.name,
        stack: error.stack
      },
      "Binance Trades WS error"
    );
  });

  ws.on("close", () => {
    logger.warn("Binance Trades WS closed. Reconnecting...");
    setTimeout(startBinanceTradesStream, 3000);
  });
};

module.exports = { startBinanceTradesStream };