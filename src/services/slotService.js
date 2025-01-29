const db = require("../db/sequelizeClient");
const { Op, where } = require("sequelize");
const moment = require("moment");
const moment2 = require("moment-timezone");

async function list(user) {
  const sqlQuery = {
    where: { isAvailable: true },
    order: [["createdAt", "DESC"]],
    distinct: true, // Ensuring only distinct rows are counted
  };

  const list = await db.slot.findAndCountAll(sqlQuery);

  //   return the Data
  return list?.rows;
}

async function allBookingSlot(
  venueId,
  venueCourtId,
  sportId,
  fromDate,
  toDate,
  admin,
  user
) {
  console.log(venueId, venueCourtId, sportId, fromDate, toDate);
  try {
    const startDate = moment(fromDate).startOf("day");
    const endDate = moment(toDate).endOf("day");
    const currentDateTime = moment(); // Get current date and time

    // Get venueSportId
    const venueSport = await db.venueSport.findOne({
      where: { sportId, venueId },
      attributes: ["venueSportId"],
    });
    if (!venueSport) {
      return res.status(404).json({
        message: "No venueSportId found for the given sportId and venueId",
      });
    }

    // Get all slots for the venue court
    const slots = await db.slot.findAll({
      where: {
        venueCourtId,
        date: {
          [Op.between]: [startDate.toDate(), endDate.toDate()],
        },
      },
      attributes: [
        "slotId",
        "day",
        "date",
        "startTime",
        "endTime",
        "price",
        "isavailable",
      ],
    });

    // Group slots by day
    const slotsByDay = slots.reduce((acc, slot) => {
      if (!acc[slot.day]) acc[slot.day] = [];
      acc[slot.day].push(slot);
      return acc;
    }, {});

    // Get all bookings for the date range with user details
    const bookings = await db.bookingVenue.findAll({
      where: {
        venueId,
        venueCourtId,
        venueSportId: sportId,
        date: {
          [Op.between]: [startDate.toDate(), endDate.toDate()],
        },
      },
      include: [
        {
          model: db.users,
          as: "users", // Changed from "user" to "users"
          attributes: ["username", "phoneNumber", "isblocked"],
        },
      ],
      attributes: [
        "date",
        "startTime",
        "endTime",
        "price",
        "ispartialpayment",
        "groundAmount",
        "playerAmount",
        "bookingVenueId",
        "isCancelBooking",
        "pendingAmount",
      ],
    });

    // Create a dictionary for quick lookup of booking details
    const bookingDetailsDict = bookings.reduce((acc, booking) => {
      const key = `${booking.startTime}-${booking.endTime}-${moment(
        booking.date
      ).format("YYYY-MM-DD")}`;
      acc[key] = booking;
      return acc;
    }, {});

    // Generate response data
    const bookingSlots = [];
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    for (
      let d = moment(startDate);
      d.isSameOrBefore(endDate);
      d.add(1, "days")
    ) {
      const dateStr = d.format("YYYY-MM-DD");
      const dayName = days[d.day()];
      const daySlots = slotsByDay[dayName] || [];
      if (daySlots.length) {
        daySlots.forEach((slot) => {
          const slotKey = `${slot.startTime}-${slot.endTime}-${dateStr}`;
          const bookingDetails = bookingDetailsDict[slotKey] || {};
          const isBooked =
            bookingDetails.bookingVenueId && !bookingDetails.isCancelBooking;

          if (!admin) {
            const slotEndTime = moment(
              `${dateStr} ${slot.endTime}`,
              "YYYY-MM-DD HH:mm:ss"
            );
            const isPastSlot = slotEndTime.isBefore(currentDateTime);

            if (!isPastSlot) {
              bookingSlots.push({
                date: dateStr,
                slotid: slot.slotId,
                startTime: slot.startTime,
                endTime: slot.endTime,
                price: parseFloat(slot.price),
                isavailable: slot.isavailable,
                ispartialpayment: bookingDetails.ispartialpayment,
                pendingAmount: bookingDetails.pendingAmount,
                bookingvenueid: bookingDetails.bookingVenueId,
                isCancelBooking: bookingDetails.isCancelBooking || false,
                playerAmount: bookingDetails.playerAmount,
                groundAmount: bookingDetails.groundAmount,
                isBooked: isBooked,
                userName: bookingDetails.users?.username,
                phoneNumber: bookingDetails.users?.phoneNumber,
                isBlocked: bookingDetails.users?.isblocked || false,
              });
            }
          } else {
            bookingSlots.push({
              date: dateStr,
              slotid: slot.slotId,
              startTime: slot.startTime,
              endTime: slot.endTime,
              price: parseFloat(slot.price),
              isavailable: slot.isavailable,
              ispartialpayment: bookingDetails.ispartialpayment,
              pendingAmount: bookingDetails.pendingAmount,
              bookingvenueid: bookingDetails.bookingVenueId,
              isCancelBooking: bookingDetails.isCancelBooking || false,
              playerAmount: bookingDetails.playerAmount,
              groundAmount: bookingDetails.groundAmount,
              isBooked: isBooked,
              userName: bookingDetails.users?.username,
              phoneNumber: bookingDetails.users?.phoneNumber,
              isBlocked: bookingDetails.users?.isblocked || false,
            });
          }
        });
      } else {
        // if (currentDaySlots.length > 0) {
        bookingSlots.push({
          date: dateStr,
          slots: [],
        });
        // }
      }
    }
    return {
      venueId,
      venueCourtId,
      sportId,
      bookingSlots,
    };
  } catch (error) {
    console.error("Error in getAllBookingSlots:", error);
    throw new Error("Internal server error");
  }
}

async function updateSlot(data, id, user) {
  if (
    await db.slot.findOne({
      where: { slotId: id },
    })
  ) {
    const newData = {
      price: data.price,
      isavailable: data.isavailable,
    };

    await db.slot.update(newData, {
      where: { slotId: id },
    });
  } else {
    throw new Error("Status does not exists");
  }
}

async function listByVenueId(venueCourtId, days, user) {
  const sqlQuery = {
    where: { venueCourtId: venueCourtId, day: days },
    order: [["createdAt", "ASC"]],
    distinct: true, // Ensuring only distinct rows are counted
  };

  const list = await db.slot.findAndCountAll(sqlQuery);

  //   return the Data
  return list?.rows;
}

function getServerTimezone() {
  return process.env.TZ || "UTC";
}

function parseUserTime(timeString, day) {
  const serverTz = getServerTimezone();
  const [hours, minutes] = timeString.split(":");

  // Get the current date in the server's timezone
  const currentDate = moment2().tz(serverTz);

  // Find the next occurrence of the given day
  const targetDay = moment2().tz(serverTz).day(day);
  if (targetDay.isBefore(currentDate)) {
    targetDay.add(1, "week");
  }

  // Set the time on the target day
  return targetDay.hours(parseInt(hours)).minutes(parseInt(minutes));
}

function formatTime(time) {
  return time.format("HH:mm");
}

function splitTimeSlot(
  slot,
  intervalMinutes,
  day,
  date,
  venueCourtId,
  slotDuration
) {
  const start = parseUserTime(slot["from-value"], day);
  const end = parseUserTime(slot["to-value"], day);
  const slots = [];

  let currentStart = start.clone();
  while (currentStart.isBefore(end)) {
    const slotEnd = moment2.min(
      currentStart.clone().add(intervalMinutes, "minutes"),
      end
    );

    console.log(
      formatTime(currentStart),
      "formatTime(currentStart): ",
      formatTime(slotEnd)
    );
    if (formatTime(currentStart) !== formatTime(slotEnd)) {
      slots.push({
        startTime: formatTime(currentStart),
        endTime: formatTime(slotEnd),
        day: day,
        date: date,
        price: parseFloat(slot.amount),
        isavailable: true,
        venueCourtId: venueCourtId,
        slotDuration: slotDuration,
      });
    }

    currentStart = slotEnd;
  }

  return slots;
}

async function updateSlotTiming(data, user) {
  console.log("data: ", data);

  let allSlots = [];
  let specificDates = JSON.parse(data.specificDates || "[]");
  for (let index = 0; index < specificDates.length; index++) {
    const element = specificDates[index];

    await db.slot.destroy({
      where: { date: element, venueCourtId: data.venueCourtId },
    });

    let slotData = JSON.parse(data.slotData || "[]");
    const intervalMinutes = data.slotDuration ? 30 : 60;

    for (const slot of slotData) {
      const splitSlots = splitTimeSlot(
        slot,
        intervalMinutes,
        data.days,
        element,
        data.venueCourtId,
        data.slotDuration
      );
      // console.log("splitSlots: ", splitSlots);
      allSlots = allSlots.concat(splitSlots);
    }
  }

  // console.log("allSlots: ", allSlots);
  try {
    // Bulk create the slots in the database
    await db.slot.bulkCreate(allSlots);

    console.log(
      `Successfully stored ${allSlots.length} slots in the database.`
    );
  } catch (error) {
    console.error("Error storing slots in the database:", error);
  }

  // } else {
  //   throw new Error("slot days does not exists");
  // }
}

module.exports = {
  list,
  allBookingSlot,
  updateSlot,
  listByVenueId,
  updateSlotTiming,
};
