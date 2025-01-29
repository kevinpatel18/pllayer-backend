const db = require("../db/sequelizeClient");
const { Op, where } = require("sequelize");
const moment = require("moment");
const bcrypt = require("bcrypt");
const { uploadToGCS } = require("../utils/upload");
const { broadcastBookingSlotUpdate } = require("../utils/websocket");
const moment2 = require("moment-timezone");
const axios = require("axios"); // Import axios for HTTP requests

async function list(user, size, page, name, location, sportId, userId) {
  // set the size object in varaible
  let limit = parseInt(size);
  let offset = parseInt(page);

  const whereClause = {};

  // Add filters
  if (name) {
    whereClause.name = { [Op.like]: `%${name}%` };
  }
  if (location) {
    let locationId = await db.location.findOne({
      where: { name: { [Op.like]: `%${location}%` } },
    });
    whereClause.locationId = locationId.locationId || "";
  }
  if (userId) {
    whereClause.userId = userId;
  }

  const sqlQuery = {
    where: whereClause,
    order: [
      // ["isFeatured", "DESC"], // Ensures isFeatured venues are listed first
      ["position", "ASC"], // Sorts by position within the isFeatured grouping
    ],
    distinct: true, // Ensuring only distinct rows are counted
    include: [
      {
        model: db.location,
        as: "location",
      },
      {
        model: db.venueCourt,
        as: "venueCourt",
      },
      {
        model: db.venueSport,
        as: "venueSport",
        include: [
          { model: db.sport, as: "sport" },
          { model: db.venueCourt, as: "venueCourt" },
        ],
        ...(sportId && { where: { sportId: sportId } }),
      },
      {
        model: db.venueRating,
        as: "venueRating",
        where: { starRating: { [Op.in]: [4, 5] } },
        limit: 15,
        order: [["createdAt", "DESC"]],
      },
    ],
  };

  const list = await db.venue.findAndCountAll(sqlQuery);
  console.log("list: ", list.count);

  let response = [];
  for (let index = 0; index < list?.rows.length; index++) {
    const element = list?.rows[index];

    const result = new Map();

    element?.venueSport.forEach((item) => {
      const { sportId, venueCourtId, pricePerHour, sport, venueCourt } = item;

      // If the sportId is not in result, initialize it
      if (!result.has(sportId)) {
        result.set(sportId, {
          name: sport.name,
          image: sport.image,
          image2: sport.image2,
          sportid: sportId,
          priceperhour: pricePerHour,
          courts: [],
        });
      }

      // Push the court information into the appropriate sport's court array

      result.get(sportId).courts.push({
        venuecourtid: venueCourtId,
        courtname: venueCourt.courtName,
      });
    });
    // Sort the courts array for each sport
    result.forEach((sport) => {
      sport.courts.sort((a, b) => a.venuecourtid - b.venuecourtid);
    });

    let totalRating = 0;
    let count = 0;

    let allRating = await db.venueRating.findAll({
      where: { venueId: element?.venueId },
    });

    allRating.forEach((rating) => {
      totalRating += rating.starRating; // Accumulate the star ratings
      count++; // Increment the count of ratings
    });

    // Calculate the average
    const averageRating = count > 0 ? totalRating / count : 0; // Handle division by zero

    let obj = {
      venueId: element?.venueId,
      name: element?.name,
      address: element?.address,
      addressUrl: element?.addressUrl,
      description: element?.description,
      ownerName: element?.ownerName,
      email: element?.email,
      location: element?.location,
      ratings: element?.venueRating,
      venueCourts: element?.venueCourt,
      sports: Array.from(result.values()),
      phoneNo: element?.phoneNo,
      alternativePhoneNo: element?.alternativePhoneNo,
      cancellationPolicy: element?.cancellationPolicy,
      images: JSON.parse(element?.images || "[]"),
      averageRating: averageRating || "",
      imageIndex: element.imageIndex,
      preamount: element.preamount,
      imageIndex: 0,
      maxdays: element.maxdays,
      isBookable: element.isBookable,
      isFeatured: element.isFeatured,
      position: element.position,
      amenities: [],
    };

    // Parse amenities and filter out null values
    const parsedAmenities = JSON.parse(element.amenities || "[]").filter(
      (amenityId) => amenityId !== null
    );

    if (parsedAmenities.length > 0) {
      const amenitiesPromises = parsedAmenities.map(async (amenitiesId) => {
        const getAmenities = await db.amenities.findOne({
          where: { amenitiesId: amenitiesId },
        });
        return getAmenities;
      });

      obj.amenities = (await Promise.all(amenitiesPromises)).filter(
        (amenity) => amenity !== null
      );
    }
    response.push(obj);
  }
  //   return the Data
  return response;
}

function getServerTimezone() {
  return process.env.TZ || "Asia/Kolkata";
}
console.log(moment2().tz("Asia/Kolkata").format("HH:mm"));

async function allAvailableSlot(data, user) {
  const { venueId, sportId, date, courtId } = data;
  console.log("date: ", date);

  // Get the day of the week from the given date
  const day = moment2(date).tz("Asia/Kolkata").format("dddd").toLowerCase();

  // Get the current time
  const currentDateTime = moment2().tz("Asia/Kolkata").format("HH:mm");
  const giveDate = moment2(date, "YYYY-MM-DD").tz("Asia/Kolkata");
  const todayDate = moment2().tz("Asia/Kolkata").startOf("day");
  console.log("todayDate: ", todayDate);
  console.log(
    giveDate,
    "****G*****",
    todayDate,
    giveDate.isAfter(todayDate, "day")
  );
  // // Find the venueCourtId
  // const venueCourt = await db.venueCourt.findOne({
  //   where: {
  //     venueId: venueId,
  //   },
  // });

  // if (!venueCourt) {
  //   throw new Error("Venue court not found");
  // }

  // Find available slots
  const availableSlots = await db.slot.findAll({
    where: {
      venueCourtId: courtId,
      day: day,
      date: date,
      isavailable: true,
    },
    order: [["startTime", "ASC"]],
  });

  // Check for existing bookings
  const bookings = await db.bookingVenue.findAll({
    where: {
      venueId: venueId,
      venueCourtId: courtId,
      venueSportId: sportId,
      date: date,
      isCancelBooking: false,
    },
  });
  console.log(
    {
      venueId: venueId,
      venueCourtId: courtId,
      venueSportId: sportId,
      date: date,
      isCancelBooking: false,
    },
    bookings.length
  );
  const finalAvailableSlots = [];
  for (const slot of availableSlots) {
    const slotEndTime = moment.tz(slot.endTime, "HH:mm", "UTC").format("HH:mm");
    console.log(slot.endTime, "slotEndTime: ", slotEndTime);
    const isNotBooked = !bookings.some((booking) => {
      return (
        booking.startTime === slot.startTime && booking.endTime === slot.endTime
      );
    });
    console.log(
      slotEndTime,
      ": ++++++++++++++++++++++++++++++",
      currentDateTime
    );

    let isNotPastSlot;

    let checkDate = giveDate.isAfter(todayDate, "day");
    if (checkDate) {
      isNotPastSlot = true;
    } else {
      if (slotEndTime === "00:00") {
        isNotPastSlot = true;
      } else {
        isNotPastSlot = moment(currentDateTime, "HH:mm").isBefore(
          moment(slotEndTime, "HH:mm")
        );
      }
    }
    // moment2(slotEndTime).tz("Asia/Kolkata").isAfter(currentDateTime, "day");

    console.log(isNotBooked, "************: ", isNotPastSlot);
    if (isNotBooked && isNotPastSlot) {
      finalAvailableSlots.push({
        slotId: slot.slotId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        venueCourtId: slot.venueCourtId,
        venueSportId: sportId,
        pricePerHour: slot.price,
      });
    }
  }

  return finalAvailableSlots;
}

async function insertBookingSlot(data, userdata) {
  const {
    venueid,
    venuesportid,
    bookings,
    username,
    phonenumber,
    ispartialpayment,
    playerAmount,
    groundAmount,
    date,
  } = data;

  let user = await db.users.findOne({ where: { phoneNumber: phonenumber } });
  if (!user) {
    // Create a new user
    const hashedPassword = await bcrypt.hash(JSON.stringify(phonenumber), 10); // Using phone number as initial password
    user = await db.users.create({
      username,
      phoneNumber: phonenumber,
      password: hashedPassword,
      role: "user", // Assuming default role is 'user'
      isblocked: false,
      isDeleted: false,
      createdBy: "system",
      updatedBy: "system",
    });
  }

  if (user) {
    await db.users.update(
      { username: username },
      {
        where: { userId: user.userId },
      }
    );
  }

  const createdBookings = [];
  let totalSlotBookings = 0;
  let totalPriceplayerAmount = 0;
  let totalPriceGroundAmount = 0;
  let venueCourtIdArr = [];
  let slotDetailsArr = [];
  let bookingVenueIdArr = [];
  let slotMessage = "";

  let venueData = await db.venue.findOne({ where: { venueId: venueid } });
  let venueName = venueData?.name;
  let venueOwnerData = await db.users.findOne({
    where: { userId: venueData?.userId },
  });

  for (const booking of bookings) {
    const { venuecourtid, slots } = booking;
    for (const slot of slots) {
      const { startTime, endTime } = slot;
      // Check if the slot is available
      const existingBooking = await db.bookingVenue.findOne({
        where: {
          venueId: venueid,
          venueCourtId: venuecourtid,
          venueSportId: venuesportid,
          date: date,
          startTime: startTime,
          endTime: endTime,
          isCancelBooking: false,
        },
      });

      if (existingBooking) {
        throw new Error(
          `Slot from ${startTime} to ${endTime} is already booked.`
        );
      }
    }
  }

  for (const booking of bookings) {
    const { venuecourtid, slots } = booking;
    let venueCourtData = await db.venueCourt.findOne({
      where: { venueCourtId: venuecourtid },
    });
    let venueCourtName = venueCourtData?.courtName;
    for (const slot of slots) {
      const { startTime, endTime } = slot;
      // Check if the slot is available
      const existingBooking = await db.bookingVenue.findOne({
        where: {
          venueId: venueid,
          venueCourtId: venuecourtid,
          venueSportId: venuesportid,
          date: date,
          startTime: startTime,
          endTime: endTime,
          isCancelBooking: false,
        },
      });

      if (existingBooking) {
        throw new Error(
          `Slot from ${startTime} to ${endTime} is already booked.`
        );
      }

      // Get the day of the week from the date
      const day = moment(date).format("dddd").toLowerCase();

      // Fetch the price from the slot table
      const slotInfo = await db.slot.findOne({
        where: {
          venueCourtId: venuecourtid,
          startTime: startTime,
          endTime: endTime,
          date: date,
          day: day,
        },
        include: [
          {
            model: db.venueCourt,
            as: "venueCourt",
          },
        ],
      });

      if (!slotInfo) {
        throw new Error(
          `Slot information not found for the given time and day.`
        );
      }

      let pendingAmount = +slotInfo.price - +playerAmount - +groundAmount;
      // Create the booking
      const newBooking = await db.bookingVenue.create({
        venueId: venueid,
        venueCourtId: venuecourtid,
        venueSportId: venuesportid,
        userId: user.userId,
        startTime,
        endTime,
        price: slotInfo.price.toString(), // Use the price from the slot table
        playerAmount,
        groundAmount,
        date,
        pendingAmount,
        ispartialpayment,
        status: "Pending",
      });

      slotMessage =
        slotMessage +
        `${moment(startTime, "hh:mm").format(
          "hh:mm A"
        )} - (${venueCourtName}),`;

      createdBookings.push(newBooking);
      totalSlotBookings++;

      slotDetailsArr.push({
        startTime,
        endTime,
        venueCourtId: slotInfo?.venueCourt?.venueCourtId,
        bookingVenueId: newBooking?.bookingVenueId,
      });
      totalPriceplayerAmount = totalPriceplayerAmount + playerAmount;
      totalPriceGroundAmount = totalPriceGroundAmount + groundAmount;
    }
  }

  console.log("slotMessage: %%%%%%%%%%%%%%%%%%%%%%%%%%%% ", slotMessage);

  let sportData = await db.sport.findOne({ where: { sportId: venuesportid } });
  console.log("sportData: ", sportData);

  // // Call external API to send WhatsApp notification
  // try {
  //   const response = await axios.post(
  //     "https://graph.facebook.com/v20.0/489571214232105/messages",
  //     {
  //       messaging_product: "whatsapp",
  //       to: `+91${phonenumber}`,
  //       type: "template",
  //       template: {
  //         name: "player_booking_conformation",
  //         language: {
  //           code: "en",
  //         },
  //         components: [
  //           {
  //             type: "header",
  //             parameters: [
  //               {
  //                 type: "text",
  //                 text: username,
  //               },
  //             ],
  //           },
  //           {
  //             type: "body",
  //             parameters: [
  //               {
  //                 type: "text",
  //                 text: `+91${phonenumber}`,
  //               },
  //               {
  //                 type: "text",
  //                 text: moment().format("DD-MM-YYYY"),
  //               },
  //               {
  //                 type: "text",
  //                 text: moment(date, "YYYY-MM-DD").format("DD-MM-YYYY"),
  //               },
  //               {
  //                 type: "text",
  //                 text: slotMessage.trim(), // Replace with dynamic time if needed
  //               },
  //               {
  //                 type: "text",
  //                 text: venueName.trim(),
  //               },
  //             ],
  //           },
  //         ],
  //       },
  //     },
  //     {
  //       headers: {
  //         Authorization:
  //           "Bearer EAAVTYy8cTpkBO3xHtahZAcssb6RgC2RDefFlJwB7l5p1ZAbGlv3Rmivsc9S0dth0xtxuM4oUJJiBMaMDPLz7nMUNm8ZAPurQto89ZC57TOsj1ECZAtNGrNTOuVXfeMXdVWj5mi6R9eRfpkGqcgVhAI4qWM3ZA4XU81Jp4QKC7z3hwFI1vMIXpzaPKe0ayJxvXHgwZDZD",
  //       },
  //     }
  //   );
  //   console.log("WhatsApp API Response:", response.data);
  // } catch (error) {
  //   console.error("Error sending WhatsApp notification:", error.message);
  // }
  // // Call external API for Hitesh to send WhatsApp notification
  // try {
  //   const response = await axios.post(
  //     "https://graph.facebook.com/v20.0/489571214232105/messages",
  //     {
  //       messaging_product: "whatsapp",
  //       to: `+919558819809`,
  //       type: "template",
  //       template: {
  //         name: "player_booking_conformation",
  //         language: {
  //           code: "en",
  //         },
  //         components: [
  //           {
  //             type: "header",
  //             parameters: [
  //               {
  //                 type: "text",
  //                 text: username,
  //               },
  //             ],
  //           },
  //           {
  //             type: "body",
  //             parameters: [
  //               {
  //                 type: "text",
  //                 text: `+91${phonenumber}`,
  //               },
  //               {
  //                 type: "text",
  //                 text: moment().format("DD-MM-YYYY"),
  //               },
  //               {
  //                 type: "text",
  //                 text: moment(date, "YYYY-MM-DD").format("DD-MM-YYYY"),
  //               },
  //               {
  //                 type: "text",
  //                 text: slotMessage.trim(), // Replace with dynamic time if needed
  //               },
  //               {
  //                 type: "text",
  //                 text: venueName.trim(),
  //               },
  //             ],
  //           },
  //         ],
  //       },
  //     },
  //     {
  //       headers: {
  //         Authorization:
  //           "Bearer EAAVTYy8cTpkBO3xHtahZAcssb6RgC2RDefFlJwB7l5p1ZAbGlv3Rmivsc9S0dth0xtxuM4oUJJiBMaMDPLz7nMUNm8ZAPurQto89ZC57TOsj1ECZAtNGrNTOuVXfeMXdVWj5mi6R9eRfpkGqcgVhAI4qWM3ZA4XU81Jp4QKC7z3hwFI1vMIXpzaPKe0ayJxvXHgwZDZD",
  //       },
  //     }
  //   );
  //   console.log("WhatsApp API Response:", response.data);
  // } catch (error) {
  //   console.error("Error sending WhatsApp notification:", error.message);
  // }
  // // Call external API for Venue Owner  to send WhatsApp notification
  // try {
  //   const response = await axios.post(
  //     "https://graph.facebook.com/v20.0/489571214232105/messages",
  //     {
  //       messaging_product: "whatsapp",
  //       to: `+91${venueOwnerData?.phoneNumber}`,
  //       // to: `+919316019087`,
  //       type: "template",
  //       template: {
  //         name: "venue_owner_2025",
  //         language: { code: "en" },
  //         components: [
  //           {
  //             type: "header",
  //             parameters: [{ type: "text", text: "Alert" }],
  //           },
  //           {
  //             type: "body",
  //             parameters: [
  //               {
  //                 type: "text",
  //                 text: moment(date, "YYYY-MM-DD").format("DD-MM-YYYY"),
  //               },
  //               {
  //                 type: "text",
  //                 text: slotMessage.trim(),
  //               },
  //               { type: "text", text: moment().format("DD-MM-YYYY") },
  //               { type: "text", text: venueName.trim() },
  //               { type: "text", text: sportData.name.trim() },
  //               {
  //                 type: "text",
  //                 text: username,
  //               },
  //               {
  //                 type: "text",
  //                 text: phonenumber,
  //               },
  //             ],
  //           },
  //         ],
  //       },
  //     },
  //     {
  //       headers: {
  //         Authorization:
  //           "Bearer EAAVTYy8cTpkBO3xHtahZAcssb6RgC2RDefFlJwB7l5p1ZAbGlv3Rmivsc9S0dth0xtxuM4oUJJiBMaMDPLz7nMUNm8ZAPurQto89ZC57TOsj1ECZAtNGrNTOuVXfeMXdVWj5mi6R9eRfpkGqcgVhAI4qWM3ZA4XU81Jp4QKC7z3hwFI1vMIXpzaPKe0ayJxvXHgwZDZD",
  //       },
  //     }
  //   );
  //   console.log("WhatsApp API Response:", response.data);
  // } catch (error) {

  //   console.error("Error sending WhatsApp notification:", error.message);
  // }

  let newTransactionData = {
    venueId: venueid,
    sportId: venuesportid,
    userId: user.userId,
    totalPriceplayerAmount: totalPriceplayerAmount,
    totalPriceGroundAmount: totalPriceGroundAmount,
    totalSlot: totalSlotBookings,
    bookingDate: date,
  };

  let Transaction = await db.transaction.create(newTransactionData);

  for (let index = 0; index < slotDetailsArr.length; index++) {
    const element = slotDetailsArr[index];
    let newData = {
      transactionId: Transaction?.transactionId,
      bookingVenueId: element?.bookingVenueId,
      venueCourtId: element?.venueCourtId,
    };
    await db.transactionItem.create(newData);
  }

  broadcastBookingSlotUpdate(); // << Broadcast the new slots here

  return {
    bookings: createdBookings,
    total_bookings: totalSlotBookings,
  };
}

async function register(data, files, user) {
  const {
    name,
    address,
    addressUrl,
    description,
    amenities,
    cancellationPolicy,
    isFavourite,
    ownerName,
    email,
    alternativePhoneNo,
    phoneNo,
    sportArray,
    locationId,
    userId,
    password,
    staffPassword,
    isBookable,
  } = data;
  console.log("cancellationPolicy: ", cancellationPolicy);

  // Validate phone numbers
  if (phoneNo.length !== 10) {
    throw new Error("Phone number must be 10 digits long");
  }
  if (alternativePhoneNo && alternativePhoneNo.length !== 10) {
    throw new Error("Alternative phone number must be 10 digits long");
  }

  let users = await db.users.findOne({
    where: { phoneNumber: phoneNo, role: "venueOwner" },
  });
  let staffUsers = await db.users.findOne({
    where: { phoneNumber: phoneNo, role: "venueStaff" },
  });

  let allVenue = await db.venue.findOne({ order: [["createdAt", "DESC"]] });

  if (!users) {
    // Create a new user
    const hashedPassword = await bcrypt.hash(password, 10); // Using phone number as initial password
    users = await db.users.create({
      username: ownerName.trim(),
      phoneNumber: phoneNo,
      password: hashedPassword,
      role: "venueOwner", // Assuming default role is 'user'
      isblocked: false,
      isDeleted: false,
      createdBy: "system",
      updatedBy: "system",
    });
    const hashedPassword2 = await bcrypt.hash(staffPassword, 10); // Using phone number as initial password
    staffUsers = await db.users.create({
      username: ownerName.trim(),
      phoneNumber: phoneNo,
      password: hashedPassword2,
      role: "venueStaff", // Assuming default role is 'user'
      isblocked: false,
      isDeleted: false,
      createdBy: "system",
      updatedBy: "system",
    });
  }

  // Process uploaded images
  // Process uploaded images
  const imageUrls = await Promise.all(files.map((file) => uploadToGCS(file)));
  console.log("imageUrls: ", imageUrls);

  // Parse sportArray
  const parsedSportArray = JSON.parse(sportArray);

  // Create venue
  const venue = await db.venue.create({
    name,
    address,
    addressUrl,
    description,
    amenities: amenities,
    cancellationPolicy,
    images: JSON.stringify(imageUrls),
    isFavourite: isFavourite === "true",
    ownerName,
    email,
    alternativePhoneNo,
    phoneNo,
    locationId,
    userId: users.userId,
    isBookable: isBookable || false,
    isFeatured: false,
    position: +allVenue?.position + 1,
  });

  // Create venue courts and sports
  for (const sport of parsedSportArray) {
    const courtIds = [];
    for (let i = 1; i <= sport.noOfCourt; i++) {
      const court = await db.venueCourt.create({
        venueId: venue.venueId,
        courtName: `Court ${i}`,
        address: "",
        addressUrl: "",
      });
      courtIds.push(court.venueCourtId);
      await db.venueSport.create({
        venueId: venue.venueId,
        sportId: sport.sportId,
        pricePerHour: sport.pricePerHour,
        venueCourtId: court.venueCourtId,
      });
    }
  }

  return venue.venueId;
}

async function updatePartialPayment(data, user) {
  let check = await db.bookingVenue.findOne({
    where: { bookingVenueId: data.bookingVenueId },
  });

  if (check) {
    console.log(
      +check.groundAmount,
      +data.groundAmount,
      "check.groundAmount + +data.groundAmount: ",
      +check.groundAmount + +data.groundAmount
    );
    const newData = {
      ispartialpayment: data.isPartialpayment,
      groundAmount: +check.groundAmount + +data.groundAmount,
      pendingAmount: +check.pendingAmount - +data.groundAmount,
    };

    await db.bookingVenue.update(newData, {
      where: { bookingVenueId: data.bookingVenueId },
    });

    broadcastBookingSlotUpdate(); // << Broadcast the new slots here
  } else {
    throw new Error("bookingVenue does not exists");
  }
}

async function cancelBooking(data, user) {
  const { bookingVenueId, message } = data;
  console.log("message: +++++++++++++++", message);
  let slotMessage = "";
  let sportId = "";

  try {
    let arr = [];
    let bookingVenueArr = JSON.parse(bookingVenueId || "[]");
    console.log("bookingVenueArr: ", bookingVenueArr);

    for (let index = 0; index < bookingVenueArr.length; index++) {
      const element = bookingVenueArr[index];
      console.log("element: ", element);

      let checkBookingDetails = await db.bookingVenue.findOne({
        where: { bookingVenueId: element },
      });

      console.log("checkBookingDetails: ", checkBookingDetails);
      // Check if booking date is in the past
      const today = moment2().tz("Asia/Kolkata").startOf("day");
      const bookingDate = moment2(checkBookingDetails?.date)
        .tz("Asia/Kolkata")
        .startOf("day");
      const currentTime = moment2().tz("Asia/Kolkata").format("HH:mm");
      console.log("today: ", today);
      console.log(checkBookingDetails?.date, "bookingDate: ", bookingDate);
      console.log(checkBookingDetails.startTime, "currentTime: ", currentTime);

      if (
        bookingDate.isBefore(today) ||
        (bookingDate.isSame(today) &&
          checkBookingDetails.startTime < currentTime)
      ) {
        throw new Error("Cannot cancel past bookings");
      }

      console.log("checkBookingDetails: ", checkBookingDetails);

      await db.bookingVenue.update(
        { isCancelBooking: true },
        {
          where: { bookingVenueId: element },
        }
      );

      let findTransactionItemData = await db.transactionItem.findOne({
        where: { bookingVenueId: element },
      });

      if (findTransactionItemData.transactionId) {
        await db.transaction.update(
          { message: message },
          {
            where: { transactionId: findTransactionItemData.transactionId },
          }
        );
      }

      const day = moment(checkBookingDetails?.date)
        .format("dddd")
        .toLowerCase();

      const slot = await db.slot.findOne({
        where: {
          venueCourtId: checkBookingDetails.venueCourtId,
          startTime: checkBookingDetails.startTime,
          endTime: checkBookingDetails.endTime,
          day: day,
        },
      });

      const slotAvailable = slot ? slot.isavailable : false;

      // Step 3: Insert a record into the CancelBookingVenue table
      const cancelBookingVenue = await db.cancelBookingVenue.create({
        venueId: checkBookingDetails.venueId,
        venueCourtId: checkBookingDetails.venueCourtId,
        venueSportId: checkBookingDetails.venueSportId,
        userId: checkBookingDetails.userId,
        startTime: checkBookingDetails.startTime,
        endTime: checkBookingDetails.endTime,
        price: checkBookingDetails.price,
        groundAmount: checkBookingDetails.groundAmount,
        playerAmount: checkBookingDetails.playerAmount,
        date: checkBookingDetails.date,
        status: "Pending",
      });

      arr?.push({
        bookingVenueId: checkBookingDetails.bookingVenueId,
        cancelBookingVenueId: cancelBookingVenue.cancelBookingVenueId,
        venueId: checkBookingDetails.venueId,
        venueCourtId: checkBookingDetails.venueCourtId,
        venueSportId: checkBookingDetails.venueSportId,
        userId: checkBookingDetails.userId,
        startTime: checkBookingDetails.startTime,
        endTime: checkBookingDetails.endTime,
        date: checkBookingDetails.date,
        price: parseFloat(checkBookingDetails.price),
        playerAmount: parseFloat(checkBookingDetails.playerAmount),
        groundAmount: parseFloat(checkBookingDetails.groundAmount),
        isCancelBooking: checkBookingDetails.isCancelBooking,
        isSlotAvailable: slotAvailable,
      });

      let venueCourtData = await db.venueCourt.findOne({
        where: { venueCourtId: checkBookingDetails.venueCourtId },
      });
      let venueCourtName = venueCourtData?.courtName;

      console.log("venueOwnerData: ");

      slotMessage =
        slotMessage +
        `${moment(checkBookingDetails.startTime, "hh:mm").format(
          "hh:mm A"
        )} - (${venueCourtName}),`;

      sportId = checkBookingDetails.venueSportId;
    }

    broadcastBookingSlotUpdate(); // << Broadcast the new slots here

    if (bookingVenueArr.length > 0) {
      let checkBookingDetails = await db.bookingVenue.findOne({
        where: { bookingVenueId: bookingVenueArr[0] },
      });
      let venueData = await db.venue.findOne({
        where: { venueId: checkBookingDetails.venueId },
      });
      let venueName = venueData?.name;
      let venueOwnerData = await db.users.findOne({
        where: { userId: venueData?.userId },
      });
      let userData = await db.users.findOne({
        where: { userId: checkBookingDetails.userId },
      });

      let sportData = await db.sport.findOne({ where: { sportId: sportId } });

      // Call external API for Venue Owner  to send WhatsApp notification
      try {
        const response = await axios.post(
          "https://graph.facebook.com/v20.0/489571214232105/messages",
          {
            messaging_product: "whatsapp",
            to: `+91${venueOwnerData?.phoneNumber}`,
            // to: `+917698199502`,

            type: "template",
            template: {
              name: "pllayer_cancel_message_2025",
              language: { code: "en" },
              components: [
                {
                  type: "header",
                  parameters: [
                    {
                      type: "text",
                      text: "Alert",
                    },
                  ],
                },
                {
                  type: "body",
                  parameters: [
                    {
                      type: "text",
                      text: moment2(checkBookingDetails.date, "YYYY-MM-DD")
                        .tz("Asia/Kolkata")
                        .format("DD-MM-YYYY"),
                    },
                    {
                      type: "text",
                      text: slotMessage.trim(),
                    },
                    { type: "text", text: venueName.trim() },
                    { type: "text", text: sportData.name.trim() },
                    {
                      type: "text",
                      text: moment()
                        .tz("Asia/Kolkata")
                        .format("DD-MM-YYYY hh:mm A"),
                    },

                    {
                      type: "text",
                      text: userData.username,
                    },
                    {
                      type: "text",
                      text: userData.phoneNumber,
                    },
                  ],
                },
              ],
            },
          },
          {
            headers: {
              Authorization:
                "Bearer EAAVTYy8cTpkBO3xHtahZAcssb6RgC2RDefFlJwB7l5p1ZAbGlv3Rmivsc9S0dth0xtxuM4oUJJiBMaMDPLz7nMUNm8ZAPurQto89ZC57TOsj1ECZAtNGrNTOuVXfeMXdVWj5mi6R9eRfpkGqcgVhAI4qWM3ZA4XU81Jp4QKC7z3hwFI1vMIXpzaPKe0ayJxvXHgwZDZD",
            },
          }
        );
        console.log("WhatsApp API Response:", response.data);
      } catch (error) {
        console.log("error: ", error);
        console.error("Error sending WhatsApp notification:", error.message);
      }

      // Call external API for Hitesh  to send WhatsApp notification
      try {
        const response = await axios.post(
          "https://graph.facebook.com/v20.0/489571214232105/messages",
          {
            messaging_product: "whatsapp",
            // to: `+91${venueOwnerData?.phoneNumber}`,
            to: `+919558819809`,
            type: "template",
            template: {
              name: "pllayer_cancel_message_2025",
              language: { code: "en" },
              components: [
                {
                  type: "header",
                  parameters: [
                    {
                      type: "text",
                      text: "Alert",
                    },
                  ],
                },
                {
                  type: "body",
                  parameters: [
                    {
                      type: "text",
                      text: moment(
                        checkBookingDetails.date,
                        "YYYY-MM-DD"
                      ).format("DD-MM-YYYY"),
                    },
                    {
                      type: "text",
                      text: slotMessage.trim(),
                    },
                    { type: "text", text: venueName.trim() },
                    { type: "text", text: sportData.name.trim() },
                    {
                      type: "text",
                      text: moment().format("DD-MM-YYYY hh:mm A"),
                    },

                    {
                      type: "text",
                      text: userData.username,
                    },
                    {
                      type: "text",
                      text: userData.phoneNumber,
                    },
                  ],
                },
              ],
            },
          },
          {
            headers: {
              Authorization:
                "Bearer EAAVTYy8cTpkBO3xHtahZAcssb6RgC2RDefFlJwB7l5p1ZAbGlv3Rmivsc9S0dth0xtxuM4oUJJiBMaMDPLz7nMUNm8ZAPurQto89ZC57TOsj1ECZAtNGrNTOuVXfeMXdVWj5mi6R9eRfpkGqcgVhAI4qWM3ZA4XU81Jp4QKC7z3hwFI1vMIXpzaPKe0ayJxvXHgwZDZD",
            },
          }
        );
        console.log("WhatsApp API Response:", response.data);
      } catch (error) {
        console.log("error: ", error);
        console.error("Error sending WhatsApp notification:", error.message);
      }
    }

    return arr;
  } catch (error) {
    console.error("Error canceling booking:", error);
    throw new Error(`An error occurred: ${error.message}`);
  }
}

async function updateCancelBookingStatus(data, user) {
  if (
    await db.cancelBookingVenue.findOne({
      where: {
        cancelBookingVenueId: {
          [Op.in]: data.cancelBookingVenueIds,
        },
      },
    })
  ) {
    const newData = {
      status: data.status,
    };

    await db.cancelBookingVenue.update(newData, {
      where: {
        cancelBookingVenueId: {
          [Op.in]: data.cancelBookingVenueIds,
        },
      },
    });
  } else {
    throw new Error("cancelBookingVenue does not exists");
  }
}
async function updateBookingStatus(data, user) {
  if (
    await db.bookingVenue.findOne({
      where: {
        bookingVenueId: {
          [Op.in]: data.bookingVenueIds,
        },
      },
    })
  ) {
    const newData = {
      status: data.status,
    };

    await db.bookingVenue.update(newData, {
      where: {
        bookingVenueId: {
          [Op.in]: data.bookingVenueIds,
        },
      },
    });
  } else {
    throw new Error("Booking Venue does not exists");
  }
}

async function updateVenueDetails(data, id, user) {
  console.log("data: ", data);
  if (
    await db.venue.findOne({
      where: {
        venueId: id,
      },
    })
  ) {
    const newData = {
      name: data?.name,
      address: data?.address,
      addressUrl: data?.addressUrl,
      description: data?.description,
      ownerName: data?.ownerName,
      email: data?.email,
      phoneNo: data?.phoneNo,
      alternativePhoneNo: data?.alternativePhoneNo,
      cancellationPolicy: data?.cancellationPolicy,
      // amenities: data.amenities,
      isBookable: data.isBookable,
      isFeatured: data.isFeatured,
      preamount: data.preamount,
      maxdays: data.maxdays,
    };

    await db.venue.update(newData, {
      where: {
        venueId: id,
      },
    });

    if (data?.password) {
      const hashedPassword = await bcrypt.hash(data?.password, 10); // Using phone number as initial password

      let users = await db.users.findOne({
        where: { phoneNumber: data?.phoneNo, role: "venueOwner" },
      });

      await db.users.update(
        {
          password: hashedPassword,
        },
        {
          where: {
            userId: users.userId,
          },
        }
      );
    }

    if (data?.staffPassword) {
      const hashedPassword2 = await bcrypt.hash(data?.staffPassword, 10); // Using phone number as initial password
      let staffUsers = await db.users.findOne({
        where: { phoneNumber: data?.phoneNo, role: "venueStaff" },
      });
      await db.users.update(
        {
          password: hashedPassword2,
        },
        {
          where: {
            userId: staffUsers.userId,
          },
        }
      );
    }
  } else {
    throw new Error("venue does not exists");
  }
}

async function userBookingDetails(phoneNumber) {
  let usersDetails = await db.users.findOne({
    where: { phoneNumber: phoneNumber },
  });

  if (usersDetails) {
    const element = usersDetails;
    let obj = {
      userid: element.userId,
      username: element.username,
      phonenumber: element.phoneNumber,
      isblocked: element.isblocked,
    };

    let bookingVenueDetails = await db.transaction.findAll({
      where: { userId: element.userId },
      include: [
        { model: db.venue, as: "venue" },
        { model: db.sport, as: "sport" },
        {
          model: db.transactionItem,
          as: "transactionItem",
          attributes: ["bookingVenueId", "venueCourtId"],
          include: [
            {
              model: db.bookingVenue,
              as: "bookingVenue",
            },
            {
              model: db.venueCourt,
              as: "venueCourt",
              attributes: ["venueCourtId", "courtName"],
            },
          ],
          order: [
            [
              { model: db.bookingVenue, as: "bookingVenue" },
              "startTime",
              "DESC",
            ],
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    obj.booking_details = bookingVenueDetails?.map((er) => {
      const total = er?.transactionItem?.reduce(
        (acc, num) => acc + (parseFloat(num?.bookingVenue?.price) || 0),
        0
      );
      return {
        transactionId: er.transactionId,
        venueId: er.venueId,
        sportId: er.sportId,
        bookingVenueId: er?.bookingVenueId,
        transactionItem: er?.transactionItem,
        userId: er.userId,
        totalPriceplayerAmount: er.totalPriceplayerAmount,
        totalPriceGroundAmount: er.totalPriceGroundAmount,
        totalBillAmount: total,
        message: er?.message,
        totalSlot: er.totalSlot,
        bookingDate: er?.bookingDate,
        venue:
          {
            venueId: er?.venue?.venueId || "",
            name: er?.venue?.name || "",
            address: er?.venue?.address || "",
            addressUrl: er?.venue?.addressUrl || "",
            description: er?.venue?.description || "",
            amenities: er?.venue?.amenities || "",
            cancellationPolicy: er?.venue?.cancellationPolicy || "",
            ownerName: er?.venue?.ownerName || "",
            email: er?.venue?.email || "",
            phoneNo: er?.venue?.phoneNo || "",
            alternativePhoneNo: er?.venue?.alternativePhoneNo || "",
            locationId: er?.venue?.locationId || "",
            images: JSON.parse(er?.venue?.images || "[]"),
            userId: er?.venue?.userId || "",
            preamount: er?.venue?.preamount,
            maxdays: er?.venue?.maxdays,
          } || {},
        sport: er?.sport || {},
        venueCourtDetails: JSON.parse(er?.venueCourtDetails || "[]"),
        slotDetails: JSON.parse(er?.slotDetails || "[]"),
      };
    });

    console.log("obj: ", obj);
    return obj;
  } else {
    throw new Error("User Does not Found");
  }
}

module.exports = {
  list,
  allAvailableSlot,
  insertBookingSlot,
  register,
  updatePartialPayment,
  cancelBooking,
  updateCancelBookingStatus,
  updateVenueDetails,
  userBookingDetails,
  updateBookingStatus,
};
