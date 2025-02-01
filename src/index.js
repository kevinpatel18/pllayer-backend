const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const config = require("config");
const https = require("https");
const { webSocketService } = require("./utils/websocket");
const moment = require("moment");
require("./db/sequelizeClient");

const route = require("./routes/index");
const app = express();

const { port, root } = config.get("api");

app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  })
);

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

app.get("/", (req, res) => {
  res.send("Products Backend is running successfully!");
});
console.log(moment().tz("Asia/Kolkata").format("DD-MM-YYYY hh:mm A"));

app.use(`/`, route);

const offset = new Date().getTimezoneOffset();
console.log(
  "Server Timezone Offset (in minutes from UTC):",
  moment("07:30", "hh:mm").format("hh:mm A")
);

const server = https.createServer(app);

webSocketService.init(server);

// process.on("unhandledRejection", (error) => {
//   // Will print "unhandledRejection err is not defined"
//   console.log("unhandledRejection", error.message);
// });
server.listen(port, () => {
  console.log(`Server Start Listening ${port}`);
});
