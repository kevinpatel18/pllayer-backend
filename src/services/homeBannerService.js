const db = require("../db/sequelizeClient");
const { Op, where } = require("sequelize");

async function list(user) {
  const sqlQuery = {
    order: [["createdAt", "DESC"]],
    distinct: true, // Ensuring only distinct rows are counted
  };

  const list = await db.homeBanner.findOne(sqlQuery);

  let obj = {
    homeBannerId: list?.homeBannerId,
    link: JSON?.parse(list?.link),
  };

  //   return the Data
  return obj;
}

module.exports = { list };
