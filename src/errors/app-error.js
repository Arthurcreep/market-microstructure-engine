class AppError extends Error {
  constructor({ message, code, statusCode = 500, context = {}, isOperational = true }) {
    super(message);

    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { AppError };