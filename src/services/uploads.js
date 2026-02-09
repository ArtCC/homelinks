const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { uploadDir, maxImageSize } = require("../config/env");

async function validateImage(filePath) {
  try {
    const metadata = await sharp(filePath).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;
    return width > 0 && height > 0 && width <= maxImageSize && height <= maxImageSize;
  } catch (err) {
    return false;
  }
}

function removeUpload(imageUrl) {
  if (!imageUrl) return;
  const filename = path.basename(imageUrl);
  const filePath = path.join(uploadDir, filename);
  fs.unlink(filePath, () => { });
}

module.exports = {
  validateImage,
  removeUpload,
};
