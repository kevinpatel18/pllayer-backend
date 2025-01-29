const sportService = require("../services/sportService");

const sportList = (req, res) => {
  sportService
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

const sportAdd = (req, res) => {
  console.log("req.body, req.user: ", req.body);
  sportService
    .register(req.body, req.files)
    .then(() =>
      res.status(200).send({
        status: 200,
        data: "You have been registered successfully!.",
      })
    )
    .catch((err) =>
      res.status(400).send({
        err_msg: err.message,
      })
    );
};

const sportUpdate = (req, res) => {
  const id = req.params.id;
  sportService
    .update(req.body, id, req.files)
    .then((sport) => {
      res.status(200).send({
        status: 200,
        data: "Your Data has been Updated",
      });
    })
    .catch((err) => {
      res.status(400).send({
        err_msg: err.message,
      });
    });
};

const sportDelete = (req, res, next) => {
  const id = req.params.id;

  sportService
    .soft_delete(id, req.user)
    .then((sport) =>
      res.status(200).send({
        status: 200,
        data: " Data has been deleted ! ",
      })
    )
    .catch((err) =>
      res.status(400).send({
        err: err.message,
      })
    );
};

module.exports = {
  sportList,
  sportAdd,
  sportUpdate,
  sportDelete,
};
