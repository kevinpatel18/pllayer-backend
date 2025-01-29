const db = require("../db/sequelizeClient");
const { Op, where } = require("sequelize");

async function list(user) {
  const sqlQuery = {
    order: [["createdAt", "DESC"]],
    distinct: true, // Ensuring only distinct rows are counted
  };

  const list = await db.versionApp.findOne(sqlQuery);

  //   return the Data
  return list;
}

module.exports = { list };
