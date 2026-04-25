const { logger } = require("../utils/logger");

const errorMiddleware = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;

  logger.error(
    {
      name: error.name,
      code: error.code,
      message: error.message,
      context: error.context,
      stack: error.stack
    },
    "Request error"
  );

  res.status(statusCode).json({
    success: false,
    error: {
      name: error.name || "Error",
      code: error.code || "INTERNAL_SERVER_ERROR",
      message: error.isOperational ? error.message : "Internal server error",
      context: error.context || {}
    }
  });
};

module.exports = { errorMiddleware };