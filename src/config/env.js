const dotenv = require("dotenv");
const Joi = require("joi");

dotenv.config();

const schema = Joi.object({
  NODE_ENV: Joi.string().valid("development", "test", "production").default("development"),
  PORT: Joi.number().default(3000),
  LOG_LEVEL: Joi.string().default("info"),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_NAME: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow("").required()
}).unknown(true);

const { value, error } = schema.validate(process.env);

if (error) {
  throw new Error(`Env validation error: ${error.message}`);
}

const env = {
  nodeEnv: value.NODE_ENV,
  port: value.PORT,
  logLevel: value.LOG_LEVEL,

  db: {
    host: value.DB_HOST,
    port: value.DB_PORT,
    name: value.DB_NAME,
    user: value.DB_USER,
    password: value.DB_PASSWORD
  }
};

module.exports = { env };