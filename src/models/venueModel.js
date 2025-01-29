const { DataTypes } = require("sequelize");

function model(sequelize) {
  const attributes = {
    venueId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      required: true,
    },
    address: {
      type: DataTypes.STRING,
      required: true,
    },
    addressUrl: {
      type: DataTypes.STRING,
      required: true,
    },
    description: {
      type: DataTypes.TEXT,
      required: true,
    },
    amenities: {
      type: DataTypes.TEXT,
      required: true,
    },
    cancellationPolicy: {
      type: DataTypes.TEXT,
      required: true,
    },
    images: {
      type: DataTypes.TEXT("long"),
      required: true,
    },
    ownerName: {
      type: DataTypes.STRING,
      required: true,
    },
    email: {
      type: DataTypes.STRING,
      required: true,
    },
    phoneNo: {
      type: DataTypes.STRING,
      required: true,
    },
    alternativePhoneNo: {
      type: DataTypes.STRING,
      required: true,
    },
    locationId: {
      type: DataTypes.INTEGER,
      required: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      required: true,
    },
    preamount: {
      type: DataTypes.STRING,
      required: true,
    },
    maxdays: {
      type: DataTypes.STRING,
      required: true,
    },
    position: {
      type: DataTypes.INTEGER,
      required: true,
    },
    isBookable: {
      type: DataTypes.BOOLEAN,
      required: true,
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      required: true,
    },
  };

  const Venue = sequelize.define("venue", attributes, {
    indexes: [
      {
        unique: true,
        fields: ["venueId"],
      },
    ],
    freezeTableName: true,
  });

  Venue.belongsTo(sequelize.models.users, {
    foreignKey: "userId",
    as: "users",
  });
  Venue.belongsTo(sequelize.models.location, {
    foreignKey: "locationId",
    as: "location",
  });
  Venue.hasMany(sequelize.models.venue_court, {
    foreignKey: "venueId",
    as: "venueCourt",
  });
  Venue.hasMany(sequelize.models.venue_sport, {
    foreignKey: "venueId",
    as: "venueSport",
  });
  Venue.hasMany(sequelize.models.venue_rating, {
    foreignKey: "venueId",
    as: "venueRating",
  });

  return Venue;
}

module.exports = model;
