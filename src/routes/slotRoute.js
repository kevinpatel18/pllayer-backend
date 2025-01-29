const express = require("express");
const router = express.Router();
const slotController = require("../controllers/slotController");

router.get("/slot", slotController.slotList);
router.get("/allbookingslot", slotController.getAllBookingSlot);
router.put("/updateslotdetails/:id", slotController.updateSlot);
router.get("/slotByVenueCourtId", slotController.getSlotDetailsByVenueCourtId);
router.put("/updateslot", slotController.updateSlotTiming);

module.exports = router;
