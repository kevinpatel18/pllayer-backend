const venueService = require("../services/venueService");

const venueList = (req, res) => {
  venueService
    .list(
      req.user,
      req.query.size,
      req.query.page,
      req.query.name,
      req.query.location,
      req.query.sportId,
      req.query.userId
    )
    .then((list) =>
      res.status(200).send({
        status: true,
        data: list,
      })
    )
    .catch((err) => {
      console.log("err: ", err);
      return res.status(400).send({
        status: false,
        message: err.message,
      });
    });
};

const getAllAvailableSlot = (req, res) => {
  venueService
    .allAvailableSlot(req.body, req.user)
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

const insertBookingSlot = (req, res) => {
  venueService
    .insertBookingSlot(req.body, req.user)
    .then((list) =>
      res.status(200).send({
        status: true,
        data: list,
      })
    )
    .catch((err) => {
      console.log("err: ", err);
      return res.status(400).send({
        status: false,
        message: err.message,
      });
    });
};

const venueAdd = (req, res) => {
  venueService
    .register(req.body, req.files, req.user)
    .then(() =>
      res.status(200).send({
        status: true,
        data: "You have been registered successfully!.",
      })
    )
    .catch((err) =>
      res.status(400).send({
        status: false,
        message: err.message,
      })
    );
};

const updatePartialPayment = (req, res) => {
  venueService
    .updatePartialPayment(req.body, req.user)
    .then(() => {
      res.status(200).send({
        status: true,
        data: "Your Data has been Updated",
      });
    })
    .catch((err) => {
      res.status(400).send({
        status: false,
        message: err.message,
      });
    });
};

const cancelBooking = (req, res) => {
  venueService
    .cancelBooking(req.body, req.user)
    .then((data) => {
      res.status(200).send({
        status: true,
        data: data,
      });
    })
    .catch((err) => {
      res.status(400).send({
        status: false,
        message: err.message,
      });
    });
};

const updateCancelBookingStatus = (req, res) => {
  venueService
    .updateCancelBookingStatus(req.body, req.user)
    .then(() => {
      res.status(200).send({
        status: true,
        data: "Your Data has been Updated",
      });
    })
    .catch((err) => {
      res.status(400).send({
        status: false,
        message: err.message,
      });
    });
};
const updateBookingStatus = (req, res) => {
  venueService
    .updateBookingStatus(req.body, req.user)
    .then(() => {
      res.status(200).send({
        status: true,
        data: "Your Data has been Updated",
      });
    })
    .catch((err) => {
      res.status(400).send({
        status: false,
        message: err.message,
      });
    });
};

const updateVenueDetails = (req, res) => {
  venueService
    .updateVenueDetails(req.body, req.params.id, req.user)
    .then(() => {
      res.status(200).send({
        status: true,
        data: "Your Data has been Updated",
      });
    })
    .catch((err) => {
      res.status(400).send({
        status: false,
        message: err.message,
      });
    });
};

const userBookingDetails = (req, res) => {
  venueService
    .userBookingDetails(req.query.phoneNumber, req.user)
    .then((list) =>
      res.status(200).send({
        status: true,
        data: list,
      })
    )
    .catch((err) => {
      console.log("err: ", err);
      return res.status(400).send({
        status: false,
        message: err.message,
      });
    });
};
const transactionSettlementList = (req, res) => {
  console.log("req.query: ", req.query);
  venueService
    .transactionSettlementList(
      req.query.page,
      req.query.page_size,
      req.query.venueOwnerId,
      req.query.from_date,
      req.query.to_date,
      req.user
    )
    .then((list) =>
      res.status(200).send({
        status: true,
        data: list,
      })
    )
    .catch((err) => {
      console.log("err: ", err);
      return res.status(400).send({
        status: false,
        message: err.message,
      });
    });
};
const transactionRefundsList = (req, res) => {
  console.log("req.query: ", req.query);
  venueService
    .transactionRefundsList(
      req.query.page,
      req.query.page_size,
      req.query.venueOwnerId,
      req.query.from_date,
      req.query.to_date,
      req.user
    )
    .then((list) =>
      res.status(200).send({
        status: true,
        data: list,
      })
    )
    .catch((err) => {
      console.log("err: ", err);
      return res.status(400).send({
        status: false,
        message: err.message,
      });
    });
};

module.exports = {
  venueList,
  getAllAvailableSlot,
  insertBookingSlot,
  venueAdd,
  updatePartialPayment,
  cancelBooking,
  updateCancelBookingStatus,
  updateVenueDetails,
  userBookingDetails,
  updateBookingStatus,
  transactionSettlementList,
  transactionRefundsList,
};
