const express = require("express");
const router = express.Router();
const venueController = require("../controllers/venueController");
const { upload } = require("../utils/upload");

router.get("/venues", venueController.venueList);
router.post("/available_slots", venueController.getAllAvailableSlot);
router.post("/bookingslot", venueController.insertBookingSlot);
router.post("/storevenue", upload.array("images"), venueController.venueAdd);
router.put("/updatePartialPayment", venueController.updatePartialPayment);
router.put("/cancelBooking", venueController.cancelBooking);
router.put(
  "/updateCancelBookingStatus",
  venueController.updateCancelBookingStatus
);
router.put("/updateVenueDetails/:id", venueController.updateVenueDetails);
router.get("/userReportByPhone", venueController.userBookingDetails);
router.put("/updateBookingStatus", venueController.updateBookingStatus);
router.get(
  "/transactionSettlementList",
  venueController.transactionSettlementList
);
router.get("/transactionRefundsList", venueController.transactionRefundsList);

module.exports = router;
