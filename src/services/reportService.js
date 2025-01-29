const db = require("../db/sequelizeClient");
const { Op, Sequelize } = require("sequelize");

async function userReport(page, size, user) {
  const limit = parseInt(size);
  const offset = (parseInt(page) - 1) * limit; // Calculate correct offset

  // Use a single JOIN query to get all required data at once
  const userBookings = await db.users.findAndCountAll({
    where: { role: "user" },
    include: [
      {
        model: db.bookingVenue,
        where: { isCancelBooking: false },
        required: false, // LEFT JOIN to include users with no bookings
        as: "bookingVenues",
      },
    ],
    limit,
    offset,
    distinct: true, // Important for correct count with associations
  });

  if (!userBookings.rows.length) return false;

  // Process the data efficiently using map
  const processedData = userBookings.rows.map((user) => {
    const bookings = user.bookingVenues || [];

    // Calculate totals using reduce once per user
    const total_ground_amount_revenue = bookings.reduce(
      (acc, booking) => acc + (Number(booking.groundAmount) || 0),
      0
    );

    const total_player_amount_revenue = bookings.reduce(
      (acc, booking) => acc + (Number(booking.playerAmount) || 0),
      0
    );

    return {
      userid: user.userId,
      username: user.username,
      phonenumber: user.phoneNumber,
      isblocked: user.isblocked,
      total_active_bookings: bookings.length,
      total_ground_amount_revenue,
      total_player_amount_revenue,
      booking_details: bookings,
    };
  });

  // Calculate grand totals in a single pass
  const [totalGroundRevenue, totalPlayerRevenue] = processedData.reduce(
    (acc, user) => [
      acc[0] + user.total_ground_amount_revenue,
      acc[1] + user.total_player_amount_revenue,
    ],
    [0, 0]
  );

  return {
    data: processedData,
    total_ground_amount_revenue: totalGroundRevenue,
    total_player_amount_revenue: totalPlayerRevenue,
    pagination: {
      page: parseInt(page),
      page_size: limit,
      total_items: userBookings.count,
      total_pages: Math.ceil(userBookings.count / limit),
    },
  };
}

async function userReportListByVenueOwner(id, page, size, user) {
  const limit = parseInt(size);
  const offset = (parseInt(page) - 1) * limit;

  // First get all venue IDs for the owner
  const venues = await db.venue.findAll({
    where: { userId: id },
    attributes: ["venueId"],
    raw: true,
  });

  if (!venues.length) return false;

  const venueIds = venues.map((venue) => venue.venueId);

  // Get bookings with aggregated data, properly grouped
  const bookingStats = await db.bookingVenue.findAll({
    where: {
      venueId: { [Op.in]: venueIds },
      isCancelBooking: false,
    },
    attributes: [
      "userId",
      [Sequelize.fn("COUNT", Sequelize.col("bookingVenueId")), "bookingCount"],
      [Sequelize.fn("SUM", Sequelize.col("groundAmount")), "totalGroundAmount"],
      [Sequelize.fn("SUM", Sequelize.col("playerAmount")), "totalPlayerAmount"],
    ],
    group: ["userId"],
    raw: true,
  });

  if (!bookingStats.length) return false;

  // Get all relevant users in a single query
  const users = await db.users.findAll({
    where: {
      userId: {
        [Op.in]: bookingStats.map((stat) => stat.userId),
      },
    },
    attributes: ["userId", "username", "phoneNumber", "isblocked"],
    raw: true,
  });

  // Get detailed booking information
  const bookingDetails = await db.bookingVenue.findAll({
    where: {
      userId: { [Op.in]: users.map((user) => user.userId) },
      venueId: { [Op.in]: venueIds },
      isCancelBooking: false,
    },
    raw: true,
  });

  // Create a map for booking details by user
  const bookingDetailsByUser = bookingDetails.reduce((acc, booking) => {
    if (!acc[booking.userId]) {
      acc[booking.userId] = [];
    }
    acc[booking.userId].push(booking);
    return acc;
  }, {});

  // Create a map for booking stats for faster lookup
  const bookingStatsByUser = bookingStats.reduce((acc, stat) => {
    acc[stat.userId] = {
      bookingCount: parseInt(stat.bookingCount),
      totalGroundAmount: parseFloat(stat.totalGroundAmount || 0),
      totalPlayerAmount: parseFloat(stat.totalPlayerAmount || 0),
    };
    return acc;
  }, {});

  // Prepare response data
  const response = users.map((user) => ({
    userid: user.userId,
    username: user.username,
    phonenumber: user.phoneNumber,
    isblocked: user.isblocked,
    total_active_bookings: bookingStatsByUser[user.userId]?.bookingCount || 0,
    total_ground_amount_revenue:
      bookingStatsByUser[user.userId]?.totalGroundAmount || 0,
    total_player_amount_revenue:
      bookingStatsByUser[user.userId]?.totalPlayerAmount || 0,
    booking_details: bookingDetailsByUser[user.userId] || [],
  }));

  // Calculate totals
  const totalGroundRevenue = response.reduce(
    (acc, user) => acc + user.total_ground_amount_revenue,
    0
  );
  const totalPlayerRevenue = response.reduce(
    (acc, user) => acc + user.total_player_amount_revenue,
    0
  );

  return {
    data: response.slice(offset, offset + limit),
    total_ground_amount_revenue: totalGroundRevenue,
    total_player_amount_revenue: totalPlayerRevenue,
    pagination: {
      page: parseInt(page),
      page_size: limit,
      total_items: response.length,
      total_pages: Math.ceil(response.length / limit),
    },
  };
}

// async function bookingVenueReportList(
//   venueOwnerId,
//   from_date,
//   to_date,
//   page,
//   size,
//   user
// ) {
//   let limit = parseInt(size);
//   let offset = parseInt(page) - 1;

//   let query = {
//     where: { isCancelBooking: false },
//     order: [["createdAt", "DESC"]],
//     distinct: true,
//     include: [
//       {
//         model: db.users,
//         as: "users",
//       },
//       {
//         model: db.venue,
//         as: "venue",
//       },

//       {
//         model: db.venueCourt,
//         as: "venueCourt",
//       },
//       {
//         model: db.sport,
//         as: "venueSport",
//       },
//     ],
//   };

//   if (venueOwnerId) {
//     let findAllVenueId = await db.venue.findAll({
//       where: { userId: venueOwnerId },
//       attributes: ["venueId"], // Select only the venueId attribute
//       raw: true,
//     });

//     let venueIdArray = findAllVenueId.map((venue) => venue.venueId);

//     if (venueIdArray?.length > 0) {
//       query.where = {
//         venueId: {
//           [Op.in]: venueIdArray, // Use Op.in to match any of the venueId in the array
//         },
//       };
//     }
//   }

//   if (from_date) {
//     if (to_date) {
//       query.where = {
//         ...query.where,
//         date: {
//           [Op.between]: [from_date, to_date], // Replace 'agendaDate' with your actual date field name
//         },
//       };
//     } else {
//       query.where = {
//         ...query.where,
//         date: {
//           [Op.gte]: from_date, // Greater than or equal to 'fromDate'
//         },
//       };
//     }
//   }

//   let allBookingVenue = await db.bookingVenue.findAll(query);

//   // Create an object to group bookings by userId
//   const groupedByUser = allBookingVenue.reduce((acc, booking) => {
//     const userId = booking.userId;

//     // If userId is null, treat it as a separate case (unknown user)
//     if (userId === null) {
//       if (!acc["unknownUser"]) {
//         acc["unknownUser"] = {
//           userId: null,
//           bookingDetails: [],
//           totalSlots: 0,
//           totalGroundAmount: 0,
//           totalPlayerAmount: 0,
//         };
//       }

//       // Add booking data and update totals
//       acc["unknownUser"].bookingDetails.push(booking);
//       acc["unknownUser"].totalSlots += 1;
//       acc["unknownUser"].totalGroundAmount += booking.groundAmount;
//       acc["unknownUser"].totalPlayerAmount += booking.playerAmount;
//     } else {
//       // If userId is not in the accumulator, initialize it
//       if (!acc[userId]) {
//         acc[userId] = {
//           userId: booking.users?.userId || userId,
//           username: booking.users?.username || "Unknown",
//           phoneNumber: booking.users?.phoneNumber || null,
//           bookingDetails: [],
//           totalSlots: 0,
//           totalGroundAmount: 0,
//           totalPlayerAmount: 0,
//         };
//       }

//       // Add current booking to the user's bookings array
//       acc[userId].bookingDetails.push(booking);
//       acc[userId].totalSlots += 1; // Count the booking slot
//       acc[userId].totalGroundAmount += booking.groundAmount; // Sum groundAmount
//       acc[userId].totalPlayerAmount += booking.playerAmount; // Sum playerAmount
//     }

//     return acc;
//   }, {});

//   const resultArray = Object.values(groupedByUser);

//   if (resultArray.length > 0) {
//     const paginatedData = {
//       data: resultArray.slice(offset, offset + limit),
//       total_ground_revenue: resultArray.reduce(
//         (acc, num) => acc + +num?.totalGroundAmount,
//         0
//       ),
//       total_player_revenue: resultArray.reduce(
//         (acc, num) => acc + +num?.totalPlayerAmount,
//         0
//       ),
//       pagination: {
//         page: offset,
//         page_size: limit,
//         total_items: resultArray.length,
//         total_pages: Math.ceil(resultArray.length / limit),
//       },
//     };

//     return paginatedData;
//   } else {
//     return false;
//   }
// }

async function bookingVenueReportList(
  venueOwnerId,
  from_date,
  to_date,
  page,
  size,
  user
) {
  const limit = parseInt(size);
  const offset = (parseInt(page) - 1) * limit; // Calculate proper offset

  // Build the where clause upfront
  const whereClause = { isCancelBooking: false };

  // If venueOwnerId exists, get venue IDs in a single query
  if (venueOwnerId) {
    const venueIds = await db.venue.findAll({
      where: { userId: venueOwnerId },
      attributes: ["venueId"],
      raw: true,
      // Add index hint if you have an index on userId
      // indexHints: [{ type: 'USE', values: ['idx_userId'] }]
    });

    if (venueIds.length) {
      whereClause.venueId = {
        [Op.in]: venueIds.map((venue) => venue.venueId),
      };
    }
  }

  // Add date filters if present
  if (from_date) {
    whereClause.date = to_date
      ? { [Op.between]: [from_date, to_date] }
      : { [Op.gte]: from_date };
  }

  // Perform a single optimized query with necessary includes
  const bookings = await db.bookingVenue.findAll({
    where: whereClause,
    order: [["createdAt", "DESC"]],
    include: [
      {
        model: db.users,
        as: "users",
      },
      {
        model: db.venue,
        as: "venue",
      },
      {
        model: db.venueCourt,
        as: "venueCourt",
      },
      {
        model: db.sport,
        as: "venueSport",
      },
    ],

    raw: true, // Get plain objects instead of Sequelize instances
    nest: true, // Nest the included models
  });

  if (!bookings.length) return false;

  // Use Map instead of object for better performance with large datasets
  const userBookings = new Map();
  let totalGroundRevenue = 0;
  let totalPlayerRevenue = 0;

  // Single pass through the data
  for (const booking of bookings) {
    const userId = booking.userId || "unknownUser";

    if (!userBookings.has(userId)) {
      userBookings.set(userId, {
        userId: booking.userId,
        username: booking.users?.username || "Unknown",
        phoneNumber: booking.users?.phoneNumber || null,
        bookingDetails: [],
        totalSlots: 0,
        totalGroundAmount: 0,
        totalPlayerAmount: 0,
      });
    }

    const userBooking = userBookings.get(userId);
    userBooking.bookingDetails.push(booking);
    userBooking.totalSlots++;
    userBooking.totalGroundAmount += booking.groundAmount;
    userBooking.totalPlayerAmount += booking.playerAmount;

    totalGroundRevenue += booking.groundAmount;
    totalPlayerRevenue += booking.playerAmount;
  }

  const resultArray = Array.from(userBookings.values());
  const totalItems = resultArray.length;

  return {
    data: resultArray.slice(offset, offset + limit),
    total_ground_revenue: totalGroundRevenue,
    total_player_revenue: totalPlayerRevenue,
    pagination: {
      page: offset,
      page_size: limit,
      total_items: totalItems,
      total_pages: Math.ceil(totalItems / limit),
    },
  };
}

async function cancelBookingVenueReportList(
  venueOwnerId,
  from_date,
  to_date,
  page,
  size,
  user
) {
  let limit = parseInt(size);
  let offset = parseInt(page) - 1;

  let query = {
    distinct: true,
    include: [
      {
        model: db.users,
        as: "users",
      },
      {
        model: db.venue,
        as: "venue",
      },

      {
        model: db.venueCourt,
        as: "venueCourt",
      },
      {
        model: db.sport,
        as: "venueSport",
      },
    ],
  };

  if (venueOwnerId) {
    let findAllVenueId = await db.venue.findAll({
      where: { userId: venueOwnerId },
      attributes: ["venueId"], // Select only the venueId attribute
      raw: true,
    });

    let venueIdArray = findAllVenueId.map((venue) => venue.venueId);

    if (venueIdArray?.length > 0) {
      query.where = {
        venueId: {
          [Op.in]: venueIdArray, // Use Op.in to match any of the venueId in the array
        },
      };
    }
  }

  if (from_date) {
    if (to_date) {
      query.where = {
        ...query.where,
        date: {
          [Op.between]: [from_date, to_date], // Replace 'agendaDate' with your actual date field name
        },
      };
    } else {
      query.where = {
        ...query.where,
        date: {
          [Op.gte]: from_date, // Greater than or equal to 'fromDate'
        },
      };
    }
  }

  let allBookingVenue = await db.cancelBookingVenue.findAll(query);

  // Create an object to group bookings by userId
  const groupedByUser = allBookingVenue.reduce((acc, booking) => {
    const userId = booking.userId;

    // If userId is null, treat it as a separate case (unknown user)
    if (userId === null) {
      if (!acc["unknownUser"]) {
        acc["unknownUser"] = {
          userId: null,
          bookingDetails: [],
          totalSlots: 0,
          totalGroundAmount: 0,
          totalPlayerAmount: 0,
        };
      }

      // Add booking data and update totals
      acc["unknownUser"].bookingDetails.push(booking);
      acc["unknownUser"].totalSlots += 1;
      acc["unknownUser"].totalGroundAmount += booking.groundAmount;
      acc["unknownUser"].totalPlayerAmount += booking.playerAmount;
    } else {
      // If userId is not in the accumulator, initialize it
      if (!acc[userId]) {
        acc[userId] = {
          userId: booking.users?.userId || userId,
          username: booking.users?.username || "Unknown",
          phoneNumber: booking.users?.phoneNumber || null,
          bookingDetails: [],
          totalSlots: 0,
          totalGroundAmount: 0,
          totalPlayerAmount: 0,
        };
      }

      // Add current booking to the user's bookings array
      acc[userId].bookingDetails.push(booking);
      acc[userId].totalSlots += 1; // Count the booking slot
      acc[userId].totalGroundAmount += booking.groundAmount; // Sum groundAmount
      acc[userId].totalPlayerAmount += booking.playerAmount; // Sum playerAmount
    }

    return acc;
  }, {});

  const resultArray = Object.values(groupedByUser);

  if (resultArray.length > 0) {
    const paginatedData = {
      data: resultArray.slice(offset, offset + limit),
      total_ground_revenue: resultArray.reduce(
        (acc, num) => acc + +num?.totalGroundAmount,
        0
      ),
      total_player_revenue: resultArray.reduce(
        (acc, num) => acc + +num?.totalPlayerAmount,
        0
      ),
      pagination: {
        page: offset,
        page_size: limit,
        total_items: resultArray.length,
        total_pages: Math.ceil(resultArray.length / limit),
      },
    };

    return paginatedData;
  } else {
    return false;
  }
}



async function venueBookingReportList(
  venueOwnerId,
  from_date,
  to_date,
  venueId,
  venueCourtId,
  sportId,
  page,
  size,
  user
) {
  console.log({
    venueOwnerId,
    from_date,
    to_date,
    venueId,
    venueCourtId,
    sportId,
    page,
    size,
  });
  let limit = parseInt(size);
  let offset = parseInt(page) - 1;

  let query = {
    distinct: true,
    include: [
      {
        model: db.users,
        as: "users",
      },
      {
        model: db.venue,
        as: "venue",
      },

      {
        model: db.venueCourt,
        as: "venueCourt",
      },
      {
        model: db.sport,
        as: "venueSport",
      },
    ],
  };

  if (venueOwnerId) {
    let findAllVenueId = await db.venue.findAll({
      where: { userId: venueOwnerId },
      attributes: ["venueId"], // Select only the venueId attribute
      raw: true,
    });

    let venueIdArray = findAllVenueId.map((venue) => venue.venueId);

    if (venueIdArray?.length > 0) {
      query.where = {
        ...query.where,
        venueId: {
          [Op.in]: venueIdArray, // Use Op.in to match any of the venueId in the array
        },
      };
    }
  }

  if (venueId) {
    query.where = { ...query.where, venueId: venueId };
  }
  if (venueCourtId) {
    query.where = { ...query.where, venueCourtId: venueCourtId };
  }

  if (sportId) {
    query.where = { ...query.where, venueSportId: sportId };
  }

  if (from_date) {
    if (to_date) {
      query.where = {
        ...query.where,
        date: {
          [Op.between]: [from_date, to_date], // Replace 'agendaDate' with your actual date field name
        },
      };
    } else {
      query.where = {
        ...query.where,
        date: {
          [Op.gte]: from_date, // Greater than or equal to 'fromDate'
        },
      };
    }
  }

  let allBookingVenue = await db.bookingVenue.findAll(query);

  // Create an object to group bookings by userId
  const groupedByUser = allBookingVenue.reduce((acc, booking) => {
    const userId = booking.userId;

    // If userId is null, treat it as a separate case (unknown user)
    if (userId === null) {
      if (!acc["unknownUser"]) {
        acc["unknownUser"] = {
          userId: null,
          bookingDetails: [],
          totalSlots: 0,
          totalGroundAmount: 0,
          totalPlayerAmount: 0,
        };
      }

      // Add booking data and update totals
      acc["unknownUser"].bookingDetails.push(booking);
      acc["unknownUser"].totalSlots += 1;
      acc["unknownUser"].totalGroundAmount += booking.groundAmount;
      acc["unknownUser"].totalPlayerAmount += booking.playerAmount;
    } else {
      // If userId is not in the accumulator, initialize it
      if (!acc[userId]) {
        acc[userId] = {
          userId: booking.users?.userId || userId,
          username: booking.users?.username || "Unknown",
          phoneNumber: booking.users?.phoneNumber || null,
          bookingDetails: [],
          totalSlots: 0,
          totalGroundAmount: 0,
          totalPlayerAmount: 0,
        };
      }

      // Add current booking to the user's bookings array
      acc[userId].bookingDetails.push(booking);
      acc[userId].totalSlots += 1; // Count the booking slot
      acc[userId].totalGroundAmount += booking.groundAmount; // Sum groundAmount
      acc[userId].totalPlayerAmount += booking.playerAmount; // Sum playerAmount
    }

    return acc;
  }, {});

  const resultArray = Object.values(groupedByUser);

  if (limit) {
    if (resultArray.length > 0) {
      const paginatedData = {
        data: resultArray.slice(offset, offset + limit),
        total_ground_revenue: resultArray.reduce(
          (acc, num) => acc + +num?.totalGroundAmount,
          0
        ),
        total_player_revenue: resultArray.reduce(
          (acc, num) => acc + +num?.totalPlayerAmount,
          0
        ),
        pagination: {
          page: offset,
          page_size: limit,
          total_items: resultArray.length,
          total_pages: Math.ceil(resultArray.length / limit),
        },
      };

      return paginatedData;
    } else {
      return false;
    }
  } else {
    return {
      data: resultArray,
      total_ground_revenue: resultArray.reduce(
        (acc, num) => acc + +num?.totalGroundAmount,
        0
      ),
      total_player_revenue: resultArray.reduce(
        (acc, num) => acc + +num?.totalPlayerAmount,
        0
      ),
    };
  }
}



async function liveVenueBookingReportList() {
  let allBookingVenue = await db.bookingVenue.findAll({
    include: [
      {
        model: db.users,
        as: "users",
      },
      {
        model: db.venue,
        as: "venue",
      },

      {
        model: db.venueCourt,
        as: "venueCourt",
      },
      {
        model: db.sport,
        as: "venueSport",
      },
    ],
    order: [["createdAt", "DESC"]],
  });
  return allBookingVenue;
}

module.exports = {
  userReport,
  userReportListByVenueOwner,
  bookingVenueReportList,
  cancelBookingVenueReportList,
  venueBookingReportList,
  liveVenueBookingReportList,
};
