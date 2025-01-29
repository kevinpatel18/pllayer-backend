const db = require("../db/sequelizeClient");
const { Op, where } = require("sequelize");

const isValidPhoneNumber = (phoneNumber) => {
  return /^\d{10}$/.test(phoneNumber);
};

async function register(data, user) {
  const { venueid, starrating, review, username, phonenumber } = data;
  // Validate phone number
  if (!isValidPhoneNumber(phonenumber)) {
    throw new Error("Invalid phone number. Must be 10 digits.");
  }

  // Check if a rating from this phone number already exists
  let existingRating = await db.venueRating.findOne({
    where: {
      phoneNumber: phonenumber,
      venueId: venueid,
    },
  });

  if (existingRating) {
    // Update existing rating
    existingRating.starRating = starrating;
    existingRating.review = review;
    existingRating.userName = username;
    return await existingRating.save();
  } else {
    // Create new rating
    return await db.venueRating.create({
      venueId: venueid,
      starRating: starrating,
      review,
      userName: username,
      phoneNumber: phonenumber,
    });
  }
}

async function list(user) {
  const sqlQuery = {
    order: [["createdAt", "DESC"]],
    distinct: true, // Ensuring only distinct rows are counted
  };

  const list = await db.venueRating.findAndCountAll(sqlQuery);

  //   return the Data
  return list?.rows;
}


async function listByVenueId(venueId, user) {
  const sqlQuery = {
    where: { venueId: venueId },
    order: [["createdAt", "DESC"]],
    distinct: true, // Ensuring only distinct rows are counted
  };

  const list = await db.venueRating.findAndCountAll(sqlQuery);

  //   return the Data
  return list?.rows;
}

module.exports = { list, register, listByVenueId };
