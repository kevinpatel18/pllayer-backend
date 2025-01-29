const ratingService = require("../services/ratingService");

const ratingAdd = (req, res) => {
  ratingService
    .register(req.body, req.user)
    .then(() =>
      res.status(200).send({
        status: true,
        data: "You have been registered successfully!.",
      })
    )
    .catch((err) =>
      res.status(400).send({
        message: err.message,
      })
    );
};

const ratingList = (req, res) => {
  ratingService
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

const ratingListbyVenueId = (req, res) => {
  ratingService
    .listByVenueId(req.params.venueId, req.user)
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
  ratingList,
  ratingAdd,
  ratingListbyVenueId,
};
