const { DataTypes } = require("sequelize");

function model(sequelize) {
  const attributes = {
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING,
      required: true,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      required: true,
    },
    password: {
      type: DataTypes.STRING,
      required: true,
    },
    role: {
      type: DataTypes.STRING,
      required: true,
    },
    isblocked: {
      type: DataTypes.BOOLEAN,
      required: true,
    },

    isDeleted: {
      type: DataTypes.BOOLEAN,
      required: true,
    },
    createdBy: {
      type: DataTypes.STRING,
      required: true,
    },
    updatedBy: {
      type: DataTypes.STRING,
      required: true,
    },
  };

  return sequelize.define("users", attributes, {
    freezeTableName: true,
  });
}

module.exports = model;
