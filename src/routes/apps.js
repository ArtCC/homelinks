const express = require("express");
const fs = require("fs");
const db = require("../db");
const { uploadImage } = require("../middleware/upload");
const { validateImage, removeUpload } = require("../services/uploads");

const router = express.Router();

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
    res.json(apps);
  } catch (err) {
    console.error("Failed to load apps:", err);
    res.status(500).json({ error: "Failed to load apps" });
  }
});

router.post("/", uploadImage, async (req, res) => {
  const { name, url } = req.body || {};
  if (!name || !url) {
    return res.status(400).json({ error: "name and url are required" });
  }

  if (!isValidUrl(url.trim())) {
    return res.status(400).json({ error: "Invalid URL format" });
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
    const id = await db.createApp(name.trim(), url.trim(), imageUrl);
    res.status(201).json({ id });
  } catch (err) {
    if (imageUrl) removeUpload(imageUrl);
    res.status(500).json({ error: "Failed to create app" });
  }
});

router.put("/:id", uploadImage, async (req, res) => {
  const { name, url } = req.body || {};
  const id = Number(req.params.id);
  if (!id || !name || !url) {
    return res.status(400).json({ error: "id, name and url are required" });
  }

  if (!isValidUrl(url.trim())) {
    return res.status(400).json({ error: "Invalid URL format" });
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

    const result = await db.updateApp(id, name.trim(), url.trim(), imageUrl);
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
