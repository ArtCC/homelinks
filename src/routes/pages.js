const express = require("express");
const path = require("path");
const { baseDir } = require("../config/env");
const { requireAuthPage } = require("../middleware/auth");

const router = express.Router();
const publicDir = path.join(baseDir, "public");

router.get("/", requireAuthPage, (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

router.get("/index.html", requireAuthPage, (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

router.get("/login.html", (req, res) => {
  res.sendFile(path.join(publicDir, "login.html"));
});

module.exports = router;
