const WebSocket = require("ws");
const { logger } = require("../../utils/logger");
const { RawOrderbook } = require("../../models/raw-orderbook.model");
const { addOrderbookToBucket } = require("../aggregation/aggregator.service");

const BINANCE_DEPTH_URL = "wss://stream.binance.com:9443/ws/btcusdt@depth10@100ms";

const startBinanceOrderbookStream = () => {
  const ws = new WebSocket(BINANCE_DEPTH_URL);

  ws.on("open", () => {
    logger.info("Binance OrderBook WS connected");
  });

  ws.on("message", async (data) => {
    try {
      const parsed = JSON.parse(data.toString());

      const bids = parsed.bids || parsed.b || [];
      const asks = parsed.asks || parsed.a || [];

      const orderbook = {
        exchange: "binance",
        symbol: "BTCUSDT",
        bids,
        asks,
        exchangeTimestamp: parsed.E || Date.now(),
        receivedAt: Date.now()
      };

      if (!orderbook.bids.length || !orderbook.asks.length) {
        logger.warn({ parsed }, "Empty Binance orderbook payload");
        return;
      }

      addOrderbookToBucket(orderbook);

      await RawOrderbook.create(orderbook);
    } catch (error) {
      logger.error(
        {
          message: error.message,
          name: error.name,
          stack: error.stack
        },
        "Failed to process Binance orderbook"
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
      "Binance OrderBook WS error"
    );
  });

  ws.on("close", () => {
    logger.warn("Binance OrderBook WS closed. Reconnecting...");
    setTimeout(startBinanceOrderbookStream, 3000);
  });
};

module.exports = { startBinanceOrderbookStream };