const express = require("express");
const app = express();

app.use("/", require("./venueRoute"));
app.use("/", require("./sportRoute"));
app.use("/", require("./ratingRoute"));
app.use("/", require("./slotRoute"));
app.use("/", require("./amenitiesRoute"));
app.use("/", require("./locationRoute"));
app.use("/", require("./userRoute"));
app.use("/", require("./reportRoutes"));
app.use("/", require("./versionAppRoute"));
app.use("/", require("./homeBannerRoute"));

module.exports = app;
