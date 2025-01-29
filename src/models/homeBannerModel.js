const { DataTypes } = require("sequelize");

function model(sequelize) {
  const attributes = {
    homeBannerId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    link: {
      type: DataTypes.STRING,
      required: true,
    },
  };

  const homeBanner = sequelize.define("home_banner", attributes, {
    freezeTableName: true,
  });

  return homeBanner;
}

module.exports = model;
