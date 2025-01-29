const { DataTypes } = require("sequelize");

function model(sequelize) {
  const attributes = {
    venueCourtId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    venueId: {
      type: DataTypes.INTEGER,
      required: true,
    },
    courtName: {
      type: DataTypes.STRING,
      required: true,
    },
  };

  const VenueCourt = sequelize.define("venue_court", attributes, {
    indexes: [
      {
        unique: true,
        fields: ["venueCourtId"],
      },
    ],
    freezeTableName: true,
  });


  return VenueCourt;
}

module.exports = model;
