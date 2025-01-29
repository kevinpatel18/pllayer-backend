const WebSocket = require("ws");
const slotService = require("../services/slotService");
const reportService = require("../services/reportService");

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Set();
  }

  init(server) {
    this.wss = new WebSocket.Server({ server });
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.wss.on("connection", (ws) => {
      console.log("Client connected");
      this.clients.add(ws);

      ws.on("message", async (message) => {
        const data = JSON.parse(message);

        if (data.type === "getAllBookingSlot") {
          console.log("data: ", data);
          try {
            const result = await slotService.allBookingSlot(
              data.venueId,
              data.venueCourtId,
              data.sportId,
              data.fromDate,
              data.toDate,
              data.admin,
              data.user
            );

            ws.send(
              JSON.stringify({
                type: "allBookingSlotResult",
                status: true,
                data: result,
              })
            );
          } catch (err) {
            ws.send(
              JSON.stringify({
                type: "allBookingSlotResult",
                status: false,
                message: err.message,
              })
            );
          }
        }

        if (data.type === "venueBookingReport") {
          try {
            const result = await reportService.liveVenueBookingReportList();
            console.log("result: ", result);

            ws.send(
              JSON.stringify({
                type: "venueBookingReport",
                status: true,
                data: result,
              })
            );
          } catch (err) {
            ws.send(
              JSON.stringify({
                type: "venueBookingReport",
                status: false,
                message: err.message,
              })
            );
          }
        }
      });

      ws.on("close", () => {
        console.log("Client disconnected");
        this.clients.delete(ws);
      });
    });
  }

  broadcastBookingSlotUpdate() {
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: "reloadPage",
            status: true,
            message: "Please reload and provide new parameters.",
          })
        );
      }
    });
  }
}
const webSocketService = new WebSocketService();

// Export both the WebSocketService instance and the broadcastBookingSlotUpdate function
module.exports = {
  webSocketService,
  broadcastBookingSlotUpdate: () =>
    webSocketService.broadcastBookingSlotUpdate(),
};
