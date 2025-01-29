const { DataTypes } = require("sequelize");

function model(sequelize) {
  const attributes = {
    versionId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    version: {
      type: DataTypes.INTEGER,
      required: true,
    },
  };

  const AppVersion = sequelize.define("version_app", attributes, {
    freezeTableName: true,
  });

  return AppVersion;
}

module.exports = model;
