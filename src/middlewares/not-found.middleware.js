const { AppError } = require("../errors/app-error");

const notFoundMiddleware = (req, res, next) => {
  next(
    new AppError({
      message: `Route not found: ${req.method} ${req.originalUrl}`,
      code: "ROUTE_NOT_FOUND",
      statusCode: 404
    })
  );
};

module.exports = { notFoundMiddleware };