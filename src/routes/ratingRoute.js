const express = require("express");
const router = express.Router();
const ratingController = require("../controllers/ratingController");

router.post("/rating", ratingController.ratingAdd);
router.get("/rating", ratingController.ratingList);
router.get("/rating/:venueId", ratingController.ratingListbyVenueId);

module.exports = router;
