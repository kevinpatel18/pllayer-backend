const { DataTypes } = require("sequelize");

function model(sequelize) {
  const attributes = {
    locationId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  };

  return sequelize.define("location", attributes, {
    indexes: [
      {
        unique: true,
        fields: ['locationId'],
      },
    ],
    freezeTableName: true,
  });
}

module.exports = model;
