const db = require("../db/sequelizeClient");
const bcrypt = require("bcrypt");
const config = require("config");
const secret = config.get("auth.jwt.secret");
const jwt = require("jsonwebtoken");

const userLogin = (req, res) => {
  const { phoneNumber, password } = req.body;

  db.users
    .findAll({
      where: { phoneNumber: phoneNumber },
    })
    .then(async (users) => {
      if (users.length === 0) {
        return res
          .status(400)
          .json({ status: false, message: "PhoneNumber does not exist." });
      }

      let matchedUser = null;
      for (const user of users) {
        const isPasswordValid = await bcrypt.compare(
          password.trim(),
          user.password
        );
        if (isPasswordValid) {
          matchedUser = user;
          break;
        }
      }

      if (!matchedUser) {
        return res
          .status(400)
          .json({ status: false, message: "Invalid credentials or role" });
      }

      let responseUserId = matchedUser.userId;
      if (matchedUser.role === "venueStaff") {
        const venueOwner = await db.users.findOne({
          where: { phoneNumber: phoneNumber, role: "venueOwner" },
        });
        if (venueOwner) {
          responseUserId = venueOwner.userId;
        }
      }

      const token = jwt.sign(
        {
          userId: matchedUser.userId,
          roleId: matchedUser.role,
        },
        secret
      );

      res.status(200).send({
        status: true,
        data: "Login Successful",
        userDetails: {
          userid: responseUserId,
          username: matchedUser.username,
          phonenumber: matchedUser.phoneNumber,
          isblocked: matchedUser.isblocked,
          role: matchedUser.role,
        },
        token: token,
      });
    })
    .catch((error) => {
      console.error("Login error:", error);
      res.status(500).json({ status: false, message: "Internal server error" });
    });
};

module.exports = {
  userLogin,
};
