const { DataTypes } = require("sequelize");

function model(sequelize) {
  const attributes = {
    transactionItemId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    transactionId: {
      type: DataTypes.INTEGER,
      required: true,
    },
    bookingVenueId: {
      type: DataTypes.INTEGER,
      required: true,
    },
    venueCourtId: {
      type: DataTypes.INTEGER,
      required: true,
    },
  };

  const TransactionItem = sequelize.define("transaction_items", attributes, {
    freezeTableName: true,
  });

  TransactionItem.belongsTo(sequelize.models.booking_venue, {
    foreignKey: "bookingVenueId",
    as: "bookingVenue",
  });
  TransactionItem.belongsTo(sequelize.models.venue_court, {
    foreignKey: "venueCourtId",
    as: "venueCourt",
  });

  return TransactionItem;
}

module.exports = model;
