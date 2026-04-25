const WebSocket = require("ws");
const { logger } = require("../../utils/logger");
const { RawTrade } = require("../../models/raw-trade.model");
const { updateLastTrade } = require("../cross-exchange/cross-exchange.service");
const { addPricePoint } = require("../lead-lag/lead-lag.service");

const BYBIT_WS_URL = "wss://stream.bybit.com/v5/public/linear";

const startBybitTradesStream = () => {
  const ws = new WebSocket(BYBIT_WS_URL);

  ws.on("open", () => {
    logger.info("Bybit Trades WS connected");

    ws.send(
      JSON.stringify({
        op: "subscribe",
        args: ["publicTrade.BTCUSDT"]
      })
    );
  });

  ws.on("message", async (data) => {
    try {
      const parsed = JSON.parse(data.toString());

      if (parsed.op === "subscribe") {
        logger.info({ parsed }, "Bybit subscribed");
        return;
      }

      if (!parsed.topic || !parsed.topic.startsWith("publicTrade")) {
        return;
      }

      if (!Array.isArray(parsed.data)) {
        return;
      }

      const trades = parsed.data.map((item) => ({
        exchange: "bybit",
        symbol: item.s,
        price: item.p,
        size: item.v,
        side: item.S === "Buy" ? "buy" : "sell",
        exchangeTimestamp: item.T,
        receivedAt: Date.now()
      }));

      trades.forEach((trade) => {
        updateLastTrade(trade);
        addPricePoint(trade);
      });

      await RawTrade.bulkCreate(trades);
    } catch (error) {
      logger.error(
        {
          message: error.message,
          name: error.name,
          stack: error.stack
        },
        "Failed to process Bybit trade"
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
      "Bybit Trades WS error"
    );
  });

  ws.on("close", () => {
    logger.warn("Bybit Trades WS closed. Reconnecting...");
    setTimeout(startBybitTradesStream, 3000);
  });
};

module.exports = { startBybitTradesStream };