const slotService = require("../services/slotService");

const slotList = (req, res) => {
  slotService
    .list(req.user)
    .then((list) =>
      res.status(200).send({
        status: true,
        data: list,
      })
    )
    .catch((err) =>
      res.status(400).send({
        status: false,
        message: err.message,
      })
    );
};

const getAllBookingSlot = (req, res) => {
  const { venue_id, venue_court_id, sport_id, from_date, to_date,admin } = req.query;
  slotService
    .allBookingSlot(
      venue_id,
      venue_court_id,
      sport_id,
      from_date,
      to_date,
      admin,
      req.user
    )
    .then((list) =>
      res.status(200).send({
        status: true,
        data: list,
      })
    )
    .catch((err) =>
      res.status(400).send({
        status: false,
        message: err.message,
      })
    );
};

const updateSlot = (req, res) => {
  const id = req.params.id;
  slotService
    .updateSlot(req.body, id, req.user)
    .then(() => {
      res.status(200).send({
        status: true,
        data: "Your Data has been Updated",
      });
    })
    .catch((err) => {
      console.log('err: ', err);
      return res.status(400).send({
        status: false,
        message: err.message,
      });
    });
};

const getSlotDetailsByVenueCourtId = (req, res) => {
  slotService
    .listByVenueId(req.query.venueCourtId, req.query.days, req.user)
    .then((list) =>
      res.status(200).send({
        status: true,
        data: list,
      })
    )
    .catch((err) =>
      res.status(400).send({
        status: false,
        message: err.message,
      })
    );
};

const updateSlotTiming = (req, res) => {
  slotService
    .updateSlotTiming(req.body, req.user)
    .then((list) =>
      res.status(200).send({
        status: true,
        data: list,
      })
    )
    .catch((err) =>
      res.status(400).send({
        status: false,
        message: err.message,
      })
    );
};

module.exports = {
  slotList,
  getAllBookingSlot,
  updateSlot,
  getSlotDetailsByVenueCourtId,
  updateSlotTiming,
};
