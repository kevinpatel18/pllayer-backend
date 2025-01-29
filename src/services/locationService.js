const db = require("../db/sequelizeClient");
const { Op, where } = require("sequelize");

async function list(user) {
  const sqlQuery = {
    order: [["createdAt", "DESC"]],
    distinct: true, // Ensuring only distinct rows are counted
  };

  const list = await db.location.findAndCountAll(sqlQuery);

  //   return the Data
  return list?.rows?.map((er) =>   ({ 
    locationid: er?.locationId,
    name : er?.name
  }));
}

module.exports = { list };
