const db = require("../db/sequelizeClient");
const { Op, where } = require("sequelize");

async function list(user) {
  const sqlQuery = {
    order: [["createdAt", "DESC"]],
    distinct: true, // Ensuring only distinct rows are counted
  };

  const list = await db.amenities.findAndCountAll(sqlQuery);

  //   return the Data
  return list?.rows?.map((er) =>   ({ 
    amenitiesid: er?.amenitiesId,
    image : er?.image, 
    name : er?.name
  }));
}

module.exports = { list };
