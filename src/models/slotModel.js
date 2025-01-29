const { DataTypes } = require("sequelize");

function model(sequelize) {
  const attributes = {
    slotId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    venueCourtId: {
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
    date: {
      type: DataTypes.DATEONLY,
      required: true,
    },
    day: {
      type: DataTypes.STRING,
      required: true,
    },
    price: {
      type: DataTypes.INTEGER,
      required: true,
    },
    isavailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    slotDuration: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  };

  const Slot = sequelize.define("slot", attributes, {
    indexes: [
      {
        unique: true,
        fields: ["slotId"],
      },
    ],
    freezeTableName: true,
  });

  Slot.belongsTo(sequelize.models.venue_court, {
    foreignKey: "venueCourtId",
    as: "venueCourt",
  });

  return Slot;
}

module.exports = model;
