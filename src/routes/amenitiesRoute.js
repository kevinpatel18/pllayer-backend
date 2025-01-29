const express = require("express");
const router = express.Router();
const amenitiesController = require("../controllers/amenitiesController");

router.get("/amenities", amenitiesController.amenitiesList);

module.exports = router;
