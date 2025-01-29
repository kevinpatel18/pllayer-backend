const { DataTypes } = require("sequelize");

function CancelBookingVenueModel(sequelize) {
  const attributes = {
    cancelBookingVenueId: {
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
    date: {
      type: DataTypes.DATEONLY,
      required: true,
    },
    status: {
      type: DataTypes.STRING,
      required: true,
    },
  };

  const CancelBookingVenue = sequelize.define(
    "cancel_booking_venue",
    attributes,
    {
      indexes: [
        {
          unique: true,
          fields: ["cancelBookingVenueId"],
        },
      ],
      freezeTableName: true,
    }
  );

  CancelBookingVenue.belongsTo(sequelize.models.venue, {
    foreignKey: "venueId",
    as: "venue",
  });

  CancelBookingVenue.belongsTo(sequelize.models.venue_court, {
    foreignKey: "venueCourtId",
    as: "venueCourt",
  });

  CancelBookingVenue.belongsTo(sequelize.models.sport, {
    foreignKey: "venueSportId",
    as: "venueSport",
  });

  CancelBookingVenue.belongsTo(sequelize.models.users, {
    foreignKey: "userId",
    as: "users",
  });

  return CancelBookingVenue;
}

module.exports = CancelBookingVenueModel;
