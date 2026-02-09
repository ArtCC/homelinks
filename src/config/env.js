const path = require("path");

require("dotenv").config();

const baseDir = path.join(__dirname, "..");
const port = process.env.PORT || 9500;
const uploadDir = process.env.UPLOAD_DIR || path.join(baseDir, "data", "uploads");
const maxImageSize = parseInt(process.env.MAX_IMAGE_SIZE) || 1024;
const maxImageBytes = parseInt(process.env.MAX_IMAGE_BYTES) || (1 * 1024 * 1024);
const sessionSecret = process.env.SESSION_SECRET || "change-me";
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;
const cookieSecure = process.env.COOKIE_SECURE === "true";

module.exports = {
  baseDir,
  port,
  uploadDir,
  maxImageSize,
  maxImageBytes,
  sessionSecret,
  adminEmail,
  adminPassword,
  cookieSecure,
};
