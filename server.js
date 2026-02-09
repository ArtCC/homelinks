require("dotenv").config();

const express = require("express");
const path = require("path");
const db = require("./db");

const app = express();
const port = process.env.PORT || 9500;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

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

app.post("/api/apps", async (req, res) => {
  const { name, url } = req.body || {};
  if (!name || !url) {
    return res.status(400).json({ error: "name and url are required" });
  }

  try {
    const id = await db.createApp(name.trim(), url.trim());
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: "Failed to create app" });
  }
});

app.put("/api/apps/:id", async (req, res) => {
  const { name, url } = req.body || {};
  const id = Number(req.params.id);
  if (!id || !name || !url) {
    return res.status(400).json({ error: "id, name and url are required" });
  }

  try {
    const result = await db.updateApp(id, name.trim(), url.trim());
    if (result.changes === 0) {
      return res.status(404).json({ error: "app not found" });
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
    const result = await db.deleteApp(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: "app not found" });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete app" });
  }
});

app.listen(port, () => {
  console.log(`homelinks running on port ${port}`);
});
