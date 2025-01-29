const reportService = require("../services/reportService");

const userReportList = (req, res) => {
  reportService
    .userReport(req.query.page, req.query.page_size, req.user)
    .then((list) =>
      res.status(200).send({
        status: true,
        data: list.data,
        total_ground_amount_revenue: list.total_ground_amount_revenue,
        total_player_amount_revenue: list.total_player_amount_revenue,
        pagination: list.pagination,
      })
    )
    .catch((err) =>
      res.status(400).send({
        status: false,
        message: err.message,
      })
    );
};

const userReportListByVenueOwner = (req, res) => {
  reportService
    .userReportListByVenueOwner(
      req.params.id,
      req.query.page,
      req.query.page_size,
      req.user
    )
    .then((list) =>
      res.status(200).send({
        status: true,
        data: list.data,
        total_ground_amount_revenue: list.total_ground_amount_revenue,
        total_player_amount_revenue: list.total_player_amount_revenue,
        pagination: list.pagination,
      })
    )
    .catch((err) =>
      res.status(400).send({
        status: false,
        message: err.message,
      })
    );
};

const bookingVenueReportList = (req, res) => {
  reportService
    .bookingVenueReportList(
      req.query.venueOwnerId,
      req.query.from_date,
      req.query.to_date,
      req.query.page,
      req.query.page_size,
      req.user
    )
    .then((list) =>
      res.status(200).send({
        status: true,
        data: list.data,
        total_ground_revenue: list.total_ground_revenue,
        total_player_revenue: list.total_player_revenue,
        pagination: list.pagination,
      })
    )
    .catch((err) =>
      res.status(400).send({
        status: false,
        message: err.message,
      })
    );
};

const cancelBookingVenueReportList = (req, res) => {
  reportService
    .cancelBookingVenueReportList(
      req.query.venueOwnerId,
      req.query.from_date,
      req.query.to_date,
      req.query.page,
      req.query.page_size,
      req.user
    )
    .then((list) =>
      res.status(200).send({
        status: true,
        data: list.data,
        total_ground_revenue: list.total_ground_revenue,
        total_player_revenue: list.total_player_revenue,
        pagination: list.pagination,
      })
    )
    .catch((err) =>
      res.status(400).send({
        status: false,
        message: err.message,
      })
    );
};

const venueBookingReportList = (req, res) => {
  reportService
    .venueBookingReportList(
      req.query.venueOwnerId,
      req.query.from_date,
      req.query.to_date,
      req.query.venueId,
      req.query.venueCourtId,
      req.query.sportId,
      req.query.page,
      req.query.page_size,
      req.user
    )
    .then((list) =>
      res.status(200).send({
        status: true,
        data: list.data,
        total_ground_revenue: list.total_ground_revenue,
        total_player_revenue: list.total_player_revenue,
        pagination: list.pagination,
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
  userReportList,
  userReportListByVenueOwner,
  bookingVenueReportList,
  cancelBookingVenueReportList,
  venueBookingReportList,
};
