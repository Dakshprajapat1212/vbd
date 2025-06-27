import { v2 as cloudinary } from "cloudinary"
import fs from "fs"
import dotenv from "dotenv";
dotenv.config();
// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET  // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null
    console.log("📤 Uploading file to Cloudinary:", localFilePath);
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      timeout: 60000

    })
    console.log("file is uploades onn clodinary", response.url)
    fs.unlinkSync(localFilePath)
    console.log(response)
    return response;


  }
  catch (error) {

    console.error("❌ Cloudinary Upload Error:", error); // 🛑 Print full error
    try {
      fs.unlinkSync(localFilePath);
      console.log("🗑️ File deleted from local storage:", localFilePath);
    } catch (unlinkError) {
      console.error("🚫 Failed to delete local file:", unlinkError.message);
    }

    return null;
  }
}

export { uploadOnCloudinary }