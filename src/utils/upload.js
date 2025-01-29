const multer = require("multer");
const path = require("path");
const { Storage } = require("@google-cloud/storage");
const config = require("config");

// Initialize Google Cloud Storage
let storage;
try {
  storage = new Storage({
    projectId: "pllayer",
    keyFilename: path.resolve("./pllayer-ee6eb030d8d9.json"), // Using path.resolve for absolute path
  });
} catch (error) {
  console.error("Error initializing Google Cloud Storage:", error);
  throw error; // Re-throw to prevent the app from starting if this critical initialization fails
}

const bucket = storage.bucket("pllayer-assests");

const multerStorage = multer.memoryStorage();
const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
});

const uploadToGCS = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error("No file uploaded"));
    }

    const newFilename = `${file.fieldname}-${Date.now()}.${file.originalname
      .split(".")
      .pop()}`;
    const fileUpload = bucket.file(newFilename);

    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
      resumable: false, // Set to false for small files to speed up upload
    });

    blobStream.on("error", (error) => {
      console.error("Blob stream error:", error);
      reject(
        new Error(
          `Unable to upload image, something went wrong: ${error.message}`
        )
      );
    });

    blobStream.on("finish", () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;
      resolve(publicUrl);
    });

    blobStream.end(file.buffer);
  });
};

// Wrapper function to handle multiple file uploads
const uploadMultipleToGCS = async (files) => {
  try {
    const uploadPromises = files.map((file) => uploadToGCS(file));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error("Error in uploadMultipleToGCS:", error);
    throw error; // Re-throw to be handled by the caller
  }
};

module.exports = { upload, uploadToGCS, uploadMultipleToGCS };
