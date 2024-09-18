const cloudinary = require("cloudinary").v2;
const fs = require("fs");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SCRET,
});

async function uploadToCloud(localFile) {
  try {
    if (!localFile) return null;
    const result = await cloudinary.uploader.upload(localFile, {
      resource_type: "auto",
    });

    fs.unlinkSync(localFile);
    return result.url;
  } catch (error) {
    fs.unlinkSync(localFile);
    console.log(error);
    return null;
  }
}
module.exports = uploadToCloud;
