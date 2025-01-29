const { DataTypes } = require("sequelize");

function model(sequelize) {
  const attributes = {
    transactionId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    venueId: {
      type: DataTypes.INTEGER,
      required: true,
    },
    bookingVenueId: {
      type: DataTypes.TEXT("long"),
      required: true,
    },
    bookingDate: {
      type: DataTypes.DATEONLY,
      required: true,
    },
    sportId: {
      type: DataTypes.INTEGER,
      required: true,
    },
    venueCourtDetails: {
      type: DataTypes.TEXT("long"),
      required: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      required: true,
    },
    totalPriceplayerAmount: {
      type: DataTypes.INTEGER,
      required: true,
    },
    totalPriceGroundAmount: {
      type: DataTypes.INTEGER,
      required: true,
    },
    message: {
      type: DataTypes.STRING,
      defaultValue: false,
    },
    totalSlot: {
      type: DataTypes.INTEGER,
      required: true,
    },
  };

  const Transaction = sequelize.define("transaction", attributes, {
    freezeTableName: true,
  });

  Transaction.belongsTo(sequelize.models.venue_court, {
    foreignKey: "venueCourtId",
    as: "venueCourt",
  });
  Transaction.belongsTo(sequelize.models.venue, {
    foreignKey: "venueId",
    as: "venue",
  });
  Transaction.belongsTo(sequelize.models.sport, {
    foreignKey: "sportId",
    as: "sport",
  });
  Transaction.belongsTo(sequelize.models.users, {
    foreignKey: "userId",
    as: "users",
  });
  Transaction.hasMany(sequelize.models.transaction_items, {
    foreignKey: "transactionId",
    as: "transactionItem",
  });

  return Transaction;
}

module.exports = model;
