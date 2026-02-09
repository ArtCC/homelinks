require("dotenv").config();

const express = require("express");
const fs = require("fs");
const morgan = require("morgan");
const multer = require("multer");
const path = require("path");
const sharp = require("sharp");
const db = require("./db");

const app = express();
const port = process.env.PORT || 9500;
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, "data", "uploads");
const maxImageSize = 1024;
const maxImageBytes = 1 * 1024 * 1024;

fs.mkdirSync(uploadDir, { recursive: true });

app.use(express.json());
app.use(morgan("combined"));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(uploadDir));

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: maxImageBytes },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only jpg, png, and webp images are allowed"));
    }
    cb(null, true);
  },
});

const uploadImage = (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (!err) return next();
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "Image must be <= 1MB" });
    }
    return res.status(400).json({ error: err.message || "Upload failed" });
  });
};

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

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/apps", async (req, res) => {
  try {
    const apps = await db.listApps();
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: "Failed to load apps" });
  }
});

app.post("/api/apps", uploadImage, async (req, res) => {
  const { name, url } = req.body || {};
  if (!name || !url) {
    return res.status(400).json({ error: "name and url are required" });
  }

  let imageUrl = null;
  if (req.file) {
    const isValid = await validateImage(req.file.path);
    if (!isValid) {
      fs.unlink(req.file.path, () => { });
      return res
        .status(400)
        .json({ error: "Image must be max 1024x1024" });
    }
    imageUrl = `/uploads/${req.file.filename}`;
  }

  try {
    const id = await db.createApp(name.trim(), url.trim(), imageUrl);
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: "Failed to create app" });
  }
});

app.put("/api/apps/:id", uploadImage, async (req, res) => {
  const { name, url } = req.body || {};
  const id = Number(req.params.id);
  if (!id || !name || !url) {
    return res.status(400).json({ error: "id, name and url are required" });
  }

  let imageUrl = null;
  if (req.file) {
    const isValid = await validateImage(req.file.path);
    if (!isValid) {
      fs.unlink(req.file.path, () => { });
      return res
        .status(400)
        .json({ error: "Image must be max 1024x1024" });
    }
    imageUrl = `/uploads/${req.file.filename}`;
  }

  try {
    const existing = await db.getAppById(id);
    if (!existing) {
      return res.status(404).json({ error: "app not found" });
    }

    const result = await db.updateApp(id, name.trim(), url.trim(), imageUrl);
    if (result.changes === 0) {
      return res.status(404).json({ error: "app not found" });
    }
    if (imageUrl && existing.image_url) {
      removeUpload(existing.image_url);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update app" });
  }
});

app.delete("/api/apps/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "id is required" });
  }

  try {
    const existing = await db.getAppById(id);
    const result = await db.deleteApp(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: "app not found" });
    }
    if (existing && existing.image_url) {
      removeUpload(existing.image_url);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete app" });
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Unexpected server error" });
});

app.listen(port, () => {
  console.log(`homelinks running on port ${port}`);
});
