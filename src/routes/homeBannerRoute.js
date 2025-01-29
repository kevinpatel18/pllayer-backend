const express = require("express");
const router = express.Router();
const homeBannerController = require("../controllers/homeBannerController");

router.get("/home-banner", homeBannerController.homeBannerList);

module.exports = router;
