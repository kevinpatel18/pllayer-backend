const versionAppService = require("../services/versionAppService");

const versionAppList = (req, res) => {
  versionAppService
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
  versionAppList,
};
