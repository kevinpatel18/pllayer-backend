const { DataTypes } = require("sequelize");

function model(sequelize) {
  const attributes = {
    amenitiesId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      required: true,
    },
    image: {
      type: DataTypes.STRING,
      required: true,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  };

  return sequelize.define("amenities", attributes, {
    indexes: [
      {
        unique: true,
        fields: ["amenitiesId"],
      },
    ],
    freezeTableName: true,
  });
}

module.exports = model;
