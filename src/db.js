const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const { baseDir } = require("./config/env");

const defaultDbPath = path.join(baseDir, "data", "homelinks.sqlite");
const dbPath = process.env.DB_PATH || defaultDbPath;

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(
    "CREATE TABLE IF NOT EXISTS apps (" +
    "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
    "name TEXT NOT NULL, " +
    "url TEXT NOT NULL, " +
    "created_at TEXT DEFAULT CURRENT_TIMESTAMP" +
    ")"
  );

  db.all("PRAGMA table_info(apps)", (err, rows) => {
    if (err) return;
    const hasImage = rows.some((row) => row.name === "image_url");
    if (!hasImage) {
      db.run("ALTER TABLE apps ADD COLUMN image_url TEXT");
    }
    const hasFavorite = rows.some((row) => row.name === "favorite");
    if (!hasFavorite) {
      db.run("ALTER TABLE apps ADD COLUMN favorite INTEGER DEFAULT 0");
    }
  });
});

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

module.exports = {
  async listApps() {
    return all(
      "SELECT id, name, url, image_url, favorite, created_at FROM apps ORDER BY favorite DESC, name COLLATE NOCASE ASC"
    );
  },
  async getAppById(id) {
    const rows = await all(
      "SELECT id, name, url, image_url, favorite FROM apps WHERE id = ?",
      [id]
    );
    return rows[0] || null;
  },
  async createApp(name, url, imageUrl = null) {
    const result = await run(
      "INSERT INTO apps (name, url, image_url, favorite) VALUES (?, ?, ?, 0)",
      [name, url, imageUrl]
    );
    return result.id;
  },
  async updateApp(id, name, url, imageUrl = null) {
    return run(
      "UPDATE apps SET name = ?, url = ?, image_url = COALESCE(?, image_url) WHERE id = ?",
      [name, url, imageUrl, id]
    );
  },
  async toggleFavorite(id) {
    return run(
      "UPDATE apps SET favorite = NOT favorite WHERE id = ?",
      [id]
    );
  },
  async deleteApp(id) {
    return run("DELETE FROM apps WHERE id = ?", [id]);
  },
  close() {
    return new Promise((resolve) => {
      db.close((err) => {
        if (err) console.error("Error closing database:", err);
        resolve();
      });
    });
  },
};
