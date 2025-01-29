const db = require("../db/sequelizeClient");
const { Op, where } = require("sequelize");
const { uploadToGCS } = require("../utils/upload");

async function list(user) {
  const sqlQuery = {
    order: [["createdAt", "ASC"]],
    distinct: true, // Ensuring only distinct rows are counted
  };

  const list = await db.sport.findAndCountAll(sqlQuery);

  //   return the Data
  return list?.rows?.map((er) => ({
    sportid: er?.sportId,
    image: er?.image,
    image2: er?.image2,
    name: er?.name,
  }));
}

async function register(data, files) {
  if (
    await db.sport.findOne({
      where: {
        name: data.name,
      },
    })
  ) {
    throw new Error("sport already exists");
  }
  const newData = {
    name: data.name,
    isDeleted: false,
  };

  if (files.image) {
    const uploadFileUrl = await uploadToGCS(files.image[0]);

    newData.image = uploadFileUrl;
  }
  if (files.image2) {
    const uploadFileUrl = await uploadToGCS(files.image2[0]);

    newData.image2 = uploadFileUrl;
  }

  let addData = await db.sport.create(newData);
}

async function update(data, id, files) {
  let checksport = await db.sport.findOne({
    where: { id: id },
  });
  if (checksport) {
    if (checksport.name !== data.name) {
      if (
        await db.sport.findOne({
          where: { name: data.name, isDeleted: false },
        })
      ) {
        throw new Error("sport Name already exists");
      }
    }

    const newData = {
      name: data.name,
    };

    if (files.image) {
      const uploadFileUrl = await uploadToGCS(files.image[0]);
      newData.image = uploadFileUrl;
    }

    if (files.image2) {
      const uploadFileUrl = await uploadToGCS(files.image2[0]);
      newData.image2 = uploadFileUrl;
    }

    await db.sport.update(newData, {
      where: { id: id },
    });
  } else {
    throw new Error("sport does not exists");
  }
}

async function soft_delete(id) {
  let checksport = await db.sport.findOne({
    where: { id: id },
  });
  if (checksport) {
    const newData = {
      isDeleted: true,
    };

    await db.sport.destroy({
      where: { id: id },
    });
  } else {
    throw new Error("sport does not exists");
  }
}

module.exports = { list, register, update, soft_delete };
