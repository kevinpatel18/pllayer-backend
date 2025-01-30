const db = require("../db/sequelizeClient");
const { Op, Sequelize } = require("sequelize");

async function userReport(page, size, name, phoneNumber) {
  const limit = parseInt(size);
  const offset = parseInt(page); // Calculate correct offset

  let query = { role: "user" };

  if (name) {
    query.username = { [Op.like]: `%${name}%` };
  }

  if (phoneNumber) {
    query.phoneNumber = phoneNumber;
  }
  console.log("query: ", query);

  // Use a single JOIN query to get all required data at once
  const userBookings = await db.users.findAndCountAll({
    where: query,
    include: [
      {
        model: db.bookingVenue,
        where: { isCancelBooking: false },
        required: false, // LEFT JOIN to include users with no bookings
        as: "bookingVenues",
        include: [
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
      },
    ],
    limit: limit,
    offset: offset,
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
      bookingDetails: bookings,
    };
  });

  return {
    data: processedData,
    pagination: {
      page: parseInt(page),
      page_size: limit,
      total_items: userBookings.count,
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

  console.log("bookingStats: ", bookingStats);
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
  const offset = parseInt(page); // Calculate proper offset

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

  // First query to get total revenues
  const totalRevenues = await db.bookingVenue.findOne({
    where: whereClause,
    attributes: [
      [
        Sequelize.fn("SUM", Sequelize.col("groundAmount")),
        "total_ground_revenue",
      ],
      [
        Sequelize.fn("SUM", Sequelize.col("playerAmount")),
        "total_player_revenue",
      ],
    ],
    raw: true,
  });

  console.log("totalRevenues: ", totalRevenues);

  console.log("whereClause: ", whereClause);
  // Perform a single optimized query with necessary includes
  const bookings = await db.bookingVenue.findAndCountAll({
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
    limit: limit,
    offset: offset,
    raw: true, // Get plain objects instead of Sequelize instances
    nest: true, // Nest the included models
  });

  console.log("bookings: ", bookings);
  if (!bookings.rows.length) return false;

  return {
    data: bookings.rows,
    total_ground_revenue: totalRevenues.total_ground_revenue,
    total_player_revenue: totalRevenues.total_player_revenue,
    pagination: {
      page: offset,
      page_size: limit,
      total_items: bookings.count,
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
  const limit = parseInt(size);
  const offset = parseInt(page); // Calculate proper offset

  // Build the where clause upfront
  let whereClause = {};

  if (venueOwnerId) {
    let findAllVenueId = await db.venue.findAll({
      where: { userId: venueOwnerId },
      attributes: ["venueId"], // Select only the venueId attribute
      raw: true,
    });

    let venueIdArray = findAllVenueId.map((venue) => venue.venueId);

    if (venueIdArray?.length > 0) {
      whereClause = {
        venueId: {
          [Op.in]: venueIdArray, // Use Op.in to match any of the venueId in the array
        },
      };
    }
  }

  if (from_date) {
    if (to_date) {
      whereClause = {
        ...whereClause,
        date: {
          [Op.between]: [from_date, to_date], // Replace 'agendaDate' with your actual date field name
        },
      };
    } else {
      whereClause = {
        ...whereClause,
        date: {
          [Op.gte]: from_date, // Greater than or equal to 'fromDate'
        },
      };
    }
  }

  // First query to get total revenues
  const totalRevenues = await db.cancelBookingVenue.findOne({
    where: whereClause,
    attributes: [
      [
        Sequelize.fn("SUM", Sequelize.col("groundAmount")),
        "total_ground_revenue",
      ],
      [
        Sequelize.fn("SUM", Sequelize.col("playerAmount")),
        "total_player_revenue",
      ],
    ],
    raw: true,
  });

  console.log("totalRevenues: ", totalRevenues);

  console.log("whereClause: ", whereClause);
  // Perform a single optimized query with necessary includes
  const bookings = await db.cancelBookingVenue.findAndCountAll({
    where: whereClause,
    order: [["createdAt", "DESC"]],
    include: [
      {
        model: db.users,
        as: "users",
        required: false,
      },
      {
        model: db.venue,
        as: "venue",
        required: false,
      },
      {
        model: db.venueCourt,
        as: "venueCourt",
        required: false,
      },
      {
        model: db.sport,
        as: "venueSport",
        required: false,
      },
    ],
    limit: limit,
    offset: offset,
    distinct: true,
  });

  console.log("bookings: ", bookings);
  if (!bookings.rows.length) return false;

  return {
    data: bookings.rows,
    total_ground_revenue: totalRevenues.total_ground_revenue,
    total_player_revenue: totalRevenues.total_player_revenue,
    pagination: {
      page: offset,
      page_size: limit,
      total_items: bookings.count,
    },
  };
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

async function manageUserReport(id, page, size, name, phoneNumber) {
  const limit = parseInt(size);
  const offset = parseInt(page);

  // First get all venue IDs for the owner
  const venues = await db.venue.findAll({
    where: { userId: id },
    attributes: ["allUsers", "venueId"],
    raw: true,
  });

  if (!venues.length) return false;
  // console.log("venues: ", venues?.[0]?.allUsers);
  const venueIds = venues.map((venue) => venue.venueId);

  const userIds = JSON.parse(venues?.[0]?.allUsers || "[]");

  let query = {
    userId: {
      [Op.in]: userIds,
    },
  };

  if (name) {
    query.username = { [Op.like]: `%${name}%` };
  }

  if (phoneNumber) {
    query.phoneNumber = phoneNumber;
  }

  const users = await db.users.findAndCountAll({
    where: query,
    limit: limit,
    offset: offset,
    include: [
      {
        model: db.bookingVenue,
        as: "bookingVenues",
        required: false, // LEFT JOIN to include users with no bookings
        where: {
          venueId: { [Op.in]: venueIds },
          isCancelBooking: false,
        },
        include: [
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
      },
    ],
  });

  const processedData = users.rows.map((user) => {
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
      bookingDetails: bookings,
    };
  });
  return {
    data: processedData,
    pagination: {
      page: parseInt(page),
      page_size: limit,
      total_items: users.count,
    },
  };
}

module.exports = {
  userReport,
  userReportListByVenueOwner,
  bookingVenueReportList,
  cancelBookingVenueReportList,
  venueBookingReportList,
  liveVenueBookingReportList,
  manageUserReport,
};
