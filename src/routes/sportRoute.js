const express = require("express");
const router = express.Router();
const sportController = require("../controllers/sportController");
const { upload } = require("../utils/upload");

router.get("/sports", sportController.sportList);
router.get(
  "/sports/store",
  upload.fields([
    {
      name: "image",
      maxCount: 1,
    },
    {
      name: "image2",
      maxCount: 1,
    },
  ]),
  sportController.sportAdd
);
router.get(
  "/sports/update/:id",
  upload.fields([
    {
      name: "image",
      maxCount: 1,
    },
    {
      name: "image2",
      maxCount: 1,
    },
  ]),
  sportController.sportUpdate
);
router.get("/sports/delete/:id", sportController.sportDelete);

module.exports = router;
