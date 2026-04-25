const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const RawTrade = sequelize.define(
  "RawTrade",
  {
    exchange: {
      type: DataTypes.STRING,
      allowNull: false
    },
    symbol: {
      type: DataTypes.STRING,
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    size: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    side: {
      type: DataTypes.STRING,
      allowNull: false
    },
    exchangeTimestamp: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    receivedAt: {
      type: DataTypes.BIGINT,
      allowNull: false
    }
  },
  {
    tableName: "raw_trades",
    timestamps: true
  }
);

module.exports = { RawTrade };