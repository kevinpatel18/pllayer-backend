module.exports = {
  api: {
    port: 80,
    root: "/api",
  },

  auth: {
    jwt: {
      secret: "jwt_secret",
      expiresIn: "24 * 60 * 60",
    },
  },

  aws: {
    accessKeyId: "AKIAWPX6NIYE4IZM2UC2",
    secretAccessKey: "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",
    bucketName: "media.munisecvmc.com",
    region: "region US East (Ohio) us-east-2",
  },

  // db: {
  //   host: "mysql-1642f7c7-kevinsoftwaredeveloper-f833.d.aivencloud.com",
  //   port: "20504",
  //   user: "avnadmin",
  //   password: "AVNS_DlgSZHw1brcNjLdb6XV",
  //   database: "defaultdb",
  // },
  db: {
    host: "database-1.clscuccc2hdy.ap-south-1.rds.amazonaws.com",
    port: "3306",
    user: "admin",
    password: "Kevin0987",
    database: "player-app",
  },

  // db: {
  //   host: "34.93.30.178",
  //   port: "3306",
  //   user: "root",
  //   password: "B,[st%4+5Q*sbF^*",
  //   database: "player-app",
  // },
  uploads: {
    file_path: "uploads",
  },
};
