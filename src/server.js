const { app } = require("./app");
const { env } = require("./config/env");
const { connectDb, sequelize } = require("./config/db");
const { logger } = require("./utils/logger");

require("./models/raw-trade.model");
require("./models/raw-orderbook.model");

const { startBinanceTradesStream } = require("./services/ingestion/binance.ws.service");
const { startBinanceOrderbookStream } = require("./services/ingestion/binance.orderbook.ws.service");
const { startBybitTradesStream } = require("./services/ingestion/bybit.ws.service");
const { processBuckets } = require("./services/aggregation/bucket-processor.service");

let server;

const startServer = async () => {
  try {
    await connectDb();

    await sequelize.sync();

    startBinanceTradesStream();
    startBinanceOrderbookStream();
    startBybitTradesStream();

    setInterval(() => {
      processBuckets();
    }, 1000);

    server = app.listen(env.port, () => {
      logger.info(`Server started on port ${env.port}`);
    });
  } catch (error) {
    logger.error({ error }, "Failed to start server");
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  logger.info({ signal }, "Shutting down server");

  if (server) {
    server.close(async () => {
      await sequelize.close();
      logger.info("HTTP server and DB connection closed");
      process.exit(0);
    });

    return;
  }

  await sequelize.close();
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServer();