const { Sequelize } = require("sequelize");
const { env } = require("./env");
const { logger } = require("../utils/logger");

const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: "postgres",
  logging: (message) => logger.debug(message),
  pool: {
    max: 10,
    min: 0,
    acquire: 5000,
    idle: 30000
  }
});

const connectDb = async () => {
  try {
    await sequelize.authenticate();
    logger.info("PostgreSQL connected via Sequelize");
  } catch (error) {
    logger.error({ error }, "PostgreSQL connection failed");
    throw error;
  }
};

module.exports = { sequelize, connectDb };