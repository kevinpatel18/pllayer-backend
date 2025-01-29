const { DataTypes } = require("sequelize");

function model(sequelize) {
  const attributes = {
    venueSportId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    venueId: {
      type: DataTypes.INTEGER,
      required: true,
    },
    sportId: {
      type: DataTypes.INTEGER,
    },
    venueCourtId: {
      type: DataTypes.INTEGER,
      required: true,
    },
    pricePerHour: {
      type: DataTypes.INTEGER,
      required: true,
    },
  };

  const VenueSport = sequelize.define("venue_sport", attributes, {
    indexes: [
      {
        unique: true,
        fields: ["venueSportId"],
      },
    ],
    freezeTableName: true,
  });

  VenueSport.belongsTo(sequelize.models.sport, {
    foreignKey: "sportId",
    as: "sport",
  });
  VenueSport.belongsTo(sequelize.models.venue_court, {
    foreignKey: "venueCourtId",
    as: "venueCourt",
  });

  return VenueSport;
}

module.exports = model;
