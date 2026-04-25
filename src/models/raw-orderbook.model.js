const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const RawOrderbook = sequelize.define(
  "RawOrderbook",
  {
    exchange: {
      type: DataTypes.STRING,
      allowNull: false
    },
    symbol: {
      type: DataTypes.STRING,
      allowNull: false
    },
    bids: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    asks: {
      type: DataTypes.JSONB,
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
    tableName: "raw_orderbooks",
    timestamps: true
  }
);

module.exports = { RawOrderbook };