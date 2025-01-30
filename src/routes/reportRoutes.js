const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");

router.get("/userReport", reportController.userReportList);
router.get(
  "/userReportByVenueOwner/:id",
  reportController.userReportListByVenueOwner
);
router.get("/manageUser/:id", reportController.manageUser);
router.get("/bookingVenueReport", reportController.bookingVenueReportList);
router.get(
  "/cancelBookingReport",
  reportController.cancelBookingVenueReportList
);
router.get("/venueBookingReport", reportController.venueBookingReportList);

module.exports = router;
