require("dotenv").config();

const bcrypt = require("bcryptjs");
const express = require("express");
const fs = require("fs");
const session = require("express-session");
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
const sessionSecret = process.env.SESSION_SECRET || "change-me";
const adminEmail = process.env.ADMIN_EMAIL;
const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
const publicDir = path.join(__dirname, "public");
const cookieSecure = process.env.COOKIE_SECURE === "true";

fs.mkdirSync(uploadDir, { recursive: true });

app.use(express.json());
app.use(morgan("combined"));
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: cookieSecure,
    },
  })
);

if (!adminEmail || !adminPasswordHash || sessionSecret === "change-me") {
  console.error(
    "Auth is required. Set ADMIN_EMAIL, ADMIN_PASSWORD_HASH, and SESSION_SECRET."
  );
  process.exit(1);
}

function isAuthenticated(req) {
  return Boolean(req.session && req.session.user);
}

function requireAuthPage(req, res, next) {
  if (isAuthenticated(req)) return next();
  return res.redirect("/login.html");
}

function requireAuthApi(req, res, next) {
  if (isAuthenticated(req)) return next();
  return res.status(401).json({ error: "unauthorized" });
}

app.use("/uploads", requireAuthPage, express.static(uploadDir));

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

app.get("/", requireAuthPage, (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.get("/index.html", requireAuthPage, (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.get("/login.html", (req, res) => {
  res.sendFile(path.join(publicDir, "login.html"));
});

app.get("/api/session", (req, res) => {
  if (!isAuthenticated(req)) {
    return res.json({ authenticated: false });
  }
  return res.json({ authenticated: true, email: req.session.user.email });
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!adminEmail || !adminPasswordHash) {
    return res.status(500).json({ error: "auth not configured" });
  }
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const emailMatch = email.trim().toLowerCase() === adminEmail.trim().toLowerCase();
  const passwordMatch = await bcrypt.compare(password, adminPasswordHash);
  if (!emailMatch || !passwordMatch) {
    return res.status(401).json({ error: "invalid credentials" });
  }

  req.session.user = { email: adminEmail };
  return res.json({ ok: true });
});

app.post("/api/logout", (req, res) => {
  if (!req.session) return res.json({ ok: true });
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

app.use(express.static(publicDir));

app.use("/api", requireAuthApi);

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
