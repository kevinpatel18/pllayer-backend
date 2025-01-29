const express = require("express");
const router = express.Router();
const versionAppController = require("../controllers/versionAppController");

router.get("/app-version", versionAppController.versionAppList);

module.exports = router;
