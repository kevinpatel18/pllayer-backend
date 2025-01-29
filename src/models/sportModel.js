const { DataTypes } = require("sequelize");

function model(sequelize) {
  const attributes = {
    sportId: {
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
    image2: {
      type: DataTypes.STRING,
      required: true,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  };

  return sequelize.define("sport", attributes, {
    indexes: [
      {
        unique: true,
        fields: ["sportId"],
      },
    ],
    freezeTableName: true,
  });
}

module.exports = model;
