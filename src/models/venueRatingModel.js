const { DataTypes } = require("sequelize");

function model(sequelize) {
  const attributes = {
    venueRatingId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    venueId: {
      type: DataTypes.INTEGER,
      required: true,
    },
    starRating: {
      type: DataTypes.INTEGER,
      required: true,
    },
    review: {
      type: DataTypes.TEXT,
      required: true,
    },
    userName: {
      type: DataTypes.STRING,
      required: true,
    },
    phoneNumber: {
      type: DataTypes.BIGINT,
      required: true,
    },
  };

  const VenueRating = sequelize.define("venue_rating", attributes, {
    indexes: [
      {
        unique: true,
        fields: ["venueRatingId"],
      },
    ],
    freezeTableName: true,
  });

  return VenueRating;
}

module.exports = model;
