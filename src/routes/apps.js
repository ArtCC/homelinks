const express = require("express");
const fs = require("fs");
const os = require("os");
const path = require("path");
const multer = require("multer");
const AdmZip = require("adm-zip");
const db = require("../db");
const { maxImageBytes, uploadDir } = require("../config/env");
const { uploadImage } = require("../middleware/upload");
const { validateImage, removeUpload } = require("../services/uploads");

const router = express.Router();

const maxBackupBytes = 50 * 1024 * 1024;
const allowedImageExtensions = [".jpg", ".jpeg", ".png", ".webp"];

const importZipUpload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: maxBackupBytes },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const allowedMimeTypes = [
      "application/zip",
      "application/x-zip-compressed",
      "application/octet-stream",
    ];
    if (ext === ".zip" || allowedMimeTypes.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error("Only ZIP files are allowed"));
  },
});

const uploadBackupZip = (req, res, next) => {
  importZipUpload.single("backup")(req, res, (err) => {
    if (!err) return next();
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "Backup ZIP must be <= 50MB" });
    }
    return res.status(400).json({ error: err.message || "Upload failed" });
  });
};

function toClientError(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

function normalizeCategory(category) {
  if (!category || typeof category !== "string") return null;
  const value = category.trim();
  if (!value) return null;
  if (value.length > 50) {
    throw toClientError("Category must be 50 characters or less");
  }
  return value.toUpperCase();
}

function normalizeImportedApp(rawApp) {
  if (!rawApp || typeof rawApp !== "object") {
    throw toClientError("Invalid app entry in apps.json");
  }

  const name = typeof rawApp.name === "string" ? rawApp.name.trim() : "";
  const url = typeof rawApp.url === "string" ? rawApp.url.trim() : "";

  if (!name || !url) {
    throw toClientError("Each app must include name and url");
  }
  if (!isValidUrl(url)) {
    throw toClientError(`Invalid URL format for app: ${name}`);
  }

  const description =
    typeof rawApp.description === "string" && rawApp.description.trim()
      ? rawApp.description.trim()
      : null;

  if (description && description.length > 500) {
    throw toClientError(`Description too long for app: ${name}`);
  }

  let imageUrl = null;
  if (typeof rawApp.image_url === "string" && rawApp.image_url.trim()) {
    const filename = path.basename(rawApp.image_url.trim());
    if (!filename || filename === "." || filename === "..") {
      throw toClientError(`Invalid image path for app: ${name}`);
    }
    imageUrl = `/uploads/${filename}`;
  }

  return {
    name,
    url,
    image_url: imageUrl,
    favorite: rawApp.favorite ? 1 : 0,
    category: normalizeCategory(rawApp.category),
    description,
    created_at:
      typeof rawApp.created_at === "string" && rawApp.created_at.trim()
        ? rawApp.created_at.trim()
        : new Date().toISOString(),
  };
}

// Validar formato de URL
function isValidUrl(string) {
  try {
    const urlToTest = string.startsWith('http://') || string.startsWith('https://')
      ? string
      : `http://${string}`;
    const url = new URL(urlToTest);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

router.get("/", async (req, res) => {
  try {
    const apps = await db.listApps();
    const normalizedApps = apps.map((app) => ({
      ...app,
      category: app.category ? app.category.toUpperCase() : app.category,
    }));
    res.json(normalizedApps);
  } catch (err) {
    console.error("Failed to load apps:", err);
    res.status(500).json({ error: "Failed to load apps" });
  }
});

router.get("/categories", async (req, res) => {
  try {
    const categories = await db.getCategories();
    const normalizedCategories = [...new Set(
      categories
        .filter((category) => typeof category === "string" && category.trim() !== "")
        .map((category) => category.toUpperCase())
    )];
    res.json(normalizedCategories);
  } catch (err) {
    console.error("Failed to load categories:", err);
    res.status(500).json({ error: "Failed to load categories" });
  }
});

router.get("/export", async (req, res) => {
  try {
    const apps = await db.listApps();
    const payload = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      apps,
    };

    const zip = new AdmZip();
    zip.addFile("apps.json", Buffer.from(JSON.stringify(payload, null, 2), "utf8"));

    for (const app of apps) {
      if (!app.image_url) continue;
      const filename = path.basename(app.image_url);
      if (!filename) continue;
      const filePath = path.join(uploadDir, filename);
      if (fs.existsSync(filePath)) {
        zip.addLocalFile(filePath, "uploads");
      }
    }

    const buffer = zip.toBuffer();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="homelinks-backup-${timestamp}.zip"`);
    res.send(buffer);
  } catch (err) {
    console.error("Failed to export backup:", err);
    res.status(500).json({ error: "Failed to export backup" });
  }
});

router.post("/import", uploadBackupZip, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Backup ZIP file is required" });
  }

  const createdImageUrls = [];
  try {
    const zip = new AdmZip(req.file.path);
    const entries = zip.getEntries();
    const appsEntry = entries.find(
      (entry) => !entry.isDirectory && path.posix.basename(entry.entryName.replace(/\\/g, "/")) === "apps.json"
    );

    if (!appsEntry) {
      throw toClientError("apps.json not found in ZIP");
    }

    let parsed;
    try {
      parsed = JSON.parse(zip.readAsText(appsEntry, "utf8"));
    } catch {
      throw toClientError("Invalid apps.json format");
    }

    const rawApps = Array.isArray(parsed) ? parsed : parsed.apps;
    if (!Array.isArray(rawApps)) {
      throw toClientError("apps.json must contain an apps array");
    }

    const importedApps = rawApps.map(normalizeImportedApp);

    const uploadEntriesByName = new Map();
    for (const entry of entries) {
      if (entry.isDirectory) continue;
      const normalized = entry.entryName.replace(/\\/g, "/");
      if (!normalized.startsWith("uploads/")) continue;
      const fileName = path.posix.basename(normalized);
      if (!fileName || fileName === "." || fileName === "..") continue;
      uploadEntriesByName.set(fileName, entry);
    }

    const fileMap = new Map();
    for (const app of importedApps) {
      if (!app.image_url) continue;
      const originalFileName = path.basename(app.image_url);
      if (fileMap.has(originalFileName)) continue;

      const zipEntry = uploadEntriesByName.get(originalFileName);
      if (!zipEntry) {
        throw toClientError(`Missing image in ZIP: ${originalFileName}`);
      }

      const ext = path.extname(originalFileName).toLowerCase();
      if (!allowedImageExtensions.includes(ext)) {
        throw toClientError(`Invalid image format for: ${originalFileName}`);
      }

      const fileData = zipEntry.getData();
      if (fileData.length > maxImageBytes) {
        throw toClientError(`Image exceeds max size (1MB): ${originalFileName}`);
      }

      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      const destination = path.join(uploadDir, uniqueName);
      fs.writeFileSync(destination, fileData);

      const isValid = await validateImage(destination);
      if (!isValid) {
        fs.unlinkSync(destination);
        throw toClientError(`Invalid image dimensions for: ${originalFileName}`);
      }

      const newImageUrl = `/uploads/${uniqueName}`;
      fileMap.set(originalFileName, newImageUrl);
      createdImageUrls.push(newImageUrl);
    }

    const finalApps = importedApps.map((app) => {
      if (!app.image_url) return app;
      const mapped = fileMap.get(path.basename(app.image_url));
      return {
        ...app,
        image_url: mapped || null,
      };
    });

    const previousApps = await db.listApps();
    await db.replaceAllApps(finalApps);

    for (const app of previousApps) {
      if (app.image_url) {
        removeUpload(app.image_url);
      }
    }

    res.json({ ok: true, imported: finalApps.length });
  } catch (err) {
    for (const imageUrl of createdImageUrls) {
      removeUpload(imageUrl);
    }
    const status = err.status || 500;
    if (status === 500) {
      console.error("Failed to import backup:", err);
    }
    res.status(status).json({ error: err.message || "Failed to import backup" });
  } finally {
    if (req.file?.path) {
      fs.unlink(req.file.path, () => { });
    }
  }
});

router.post("/", uploadImage, async (req, res) => {
  const { name, url, category, description } = req.body || {};
  const normalizedCategory = category ? category.trim().toUpperCase() : null;
  if (!name || !url) {
    return res.status(400).json({ error: "name and url are required" });
  }

  if (!isValidUrl(url.trim())) {
    return res.status(400).json({ error: "Invalid URL format" });
  }

  if (category && category.trim().length > 50) {
    return res.status(400).json({ error: "Category must be 50 characters or less" });
  }

  if (description && description.trim().length > 500) {
    return res.status(400).json({ error: "Description must be 500 characters or less" });
  }

  let imageUrl = null;
  if (req.file) {
    const isValid = await validateImage(req.file.path);
    if (!isValid) {
      fs.unlink(req.file.path, () => { });
      return res.status(400).json({ error: "Image must be max 1024x1024" });
    }
    imageUrl = `/uploads/${req.file.filename}`;
  }

  try {
    const id = await db.createApp(
      name.trim(),
      url.trim(),
      imageUrl,
      normalizedCategory,
      description ? description.trim() : null
    );
    res.status(201).json({ id });
  } catch (err) {
    if (imageUrl) removeUpload(imageUrl);
    res.status(500).json({ error: "Failed to create app" });
  }
});

router.put("/:id", uploadImage, async (req, res) => {
  const { name, url, category, description } = req.body || {};
  const normalizedCategory = category ? category.trim().toUpperCase() : null;
  const id = Number(req.params.id);
  if (!id || !name || !url) {
    return res.status(400).json({ error: "id, name and url are required" });
  }

  if (!isValidUrl(url.trim())) {
    return res.status(400).json({ error: "Invalid URL format" });
  }

  if (category && category.trim().length > 50) {
    return res.status(400).json({ error: "Category must be 50 characters or less" });
  }

  if (description && description.trim().length > 500) {
    return res.status(400).json({ error: "Description must be 500 characters or less" });
  }

  let imageUrl = null;
  if (req.file) {
    const isValid = await validateImage(req.file.path);
    if (!isValid) {
      fs.unlink(req.file.path, () => { });
      return res.status(400).json({ error: "Image must be max 1024x1024" });
    }
    imageUrl = `/uploads/${req.file.filename}`;
  }

  try {
    const existing = await db.getAppById(id);
    if (!existing) {
      if (imageUrl) removeUpload(imageUrl);
      return res.status(404).json({ error: "app not found" });
    }

    const result = await db.updateApp(
      id,
      name.trim(),
      url.trim(),
      imageUrl,
      normalizedCategory,
      description ? description.trim() : null
    );
    if (result.changes === 0) {
      if (imageUrl) removeUpload(imageUrl);
      return res.status(404).json({ error: "app not found" });
    }
    if (imageUrl && existing.image_url) {
      removeUpload(existing.image_url);
    }
    res.json({ ok: true });
  } catch (err) {
    if (imageUrl) removeUpload(imageUrl);
    res.status(500).json({ error: "Failed to update app" });
  }
});

router.delete("/:id", async (req, res) => {
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

router.patch("/:id/favorite", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "id is required" });
  }

  try {
    const result = await db.toggleFavorite(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: "app not found" });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to toggle favorite" });
  }
});

module.exports = router;
