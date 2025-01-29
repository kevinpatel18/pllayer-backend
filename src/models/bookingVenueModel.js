const { DataTypes } = require("sequelize");

function model(sequelize) {
  const attributes = {
    bookingVenueId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    venueId: {
      type: DataTypes.INTEGER,
      required: true,
    },
    venueCourtId: {
      type: DataTypes.INTEGER,
      required: true,
    },
    venueSportId: {
      type: DataTypes.INTEGER,
      required: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      required: true,
    },
    startTime: {
      type: DataTypes.STRING,
      required: true,
    },
    endTime: {
      type: DataTypes.STRING,
      required: true,
    },
    price: {
      type: DataTypes.STRING,
      required: true,
    },
    groundAmount: {
      type: DataTypes.INTEGER,
      required: true,
    },
    playerAmount: {
      type: DataTypes.INTEGER,
      required: true,
    },
    pendingAmount: {
      type: DataTypes.INTEGER,
      required: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      required: true,
    },
    ispartialpayment: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isCancelBooking: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    status: {
      type: DataTypes.STRING,
      required: true,
    },
  };

  const BookingVenue = sequelize.define("booking_venue", attributes, {
    indexes: [
      {
        unique: true,
        fields: ["bookingVenueId"],
      },
    ],
    freezeTableName: true,
  });

  BookingVenue.belongsTo(sequelize.models.venue, {
    foreignKey: "venueId",
    as: "venue",
  });

  BookingVenue.belongsTo(sequelize.models.venue_court, {
    foreignKey: "venueCourtId",
    as: "venueCourt",
  });

  BookingVenue.belongsTo(sequelize.models.sport, {
    foreignKey: "venueSportId",
    as: "venueSport",
  });

  BookingVenue.belongsTo(sequelize.models.users, {
    foreignKey: "userId",
    as: "users",
  });

  return BookingVenue;
}

module.exports = model;
