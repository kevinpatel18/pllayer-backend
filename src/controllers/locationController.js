const locationService = require("../services/locationService");

const locationList = (req, res) => {
  locationService
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
module.exports = {
  locationList,
};
