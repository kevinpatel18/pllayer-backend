const config = require("config");
const mysql = require("mysql2/promise");
const { Sequelize } = require("sequelize");

module.exports = db = {};

initialize();

async function initialize() {
  const { host, port, user, password, database } = config.db;
  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
  });
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);

  var sequelize = new Sequelize(database, user, password, {
    host: host,
    port: port,
    logging: false,
    maxConcurrentQueries: 100,
    dialect: "mysql",
    // dialectOptions: {
    //   ssl: "Amazon RDS",
    // },

    language: "en",
  });

  sequelize
    .authenticate()
    .then(() => {
      console.log("connected to mysql");
    })
    .catch((err) => {
      console.log(err);
    });

  // Initialize all models with camelCase names
  db.sport = require("../models/sportModel")(sequelize);
  db.amenities = require("../models/amenitiesModel")(sequelize);
  db.location = require("../models/locationModel")(sequelize);
  db.users = require("../models/userModel")(sequelize);
  db.venueCourt = require("../models/venueCourtModel")(sequelize);
  db.venueSport = require("../models/venueSportModel")(sequelize);
  db.venueRating = require("../models/venueRatingModel")(sequelize);
  db.venue = require("../models/venueModel")(sequelize);
  db.slot = require("../models/slotModel")(sequelize);
  db.bookingVenue = require("../models/bookingVenueModel")(sequelize);
  db.versionApp = require("../models/versionAppModal")(sequelize);
  db.cancelBookingVenue = require("../models/cancelBookingVenueModel")(
    sequelize
  );
  db.transactionItem = require("../models/transactionItemModel")(sequelize);
  db.transaction = require("../models/transactionModel")(sequelize);
  db.homeBanner = require("../models/homeBannerModel")(sequelize);

  // Add this association
  db.users.hasMany(db.bookingVenue, {
    foreignKey: "userId",
    as: "bookingVenues",
  });
  db.venue.hasMany(db.bookingVenue, {
    foreignKey: "userId",
    as: "bookingVenues",
  });

  // Sync all models with the database
  await sequelize.sync({ alter: true }).catch((err) => {
    console.error("Error syncing models:", err);
  });
  // Export Sequelize and models
  db.sequelize = sequelize;
  db.Sequelize = Sequelize;
}
