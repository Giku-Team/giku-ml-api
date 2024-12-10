const { Storage } = require("@google-cloud/storage");

const storage = new Storage({
  projectId: "giku-c242-ps327",
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

const bucketName = "giku-bucket";
const bucket = storage.bucket(bucketName);

module.exports = { bucket };
