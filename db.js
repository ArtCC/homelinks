const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const defaultDbPath = path.join(__dirname, "data", "homelinks.sqlite");
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
    return all("SELECT id, name, url, created_at FROM apps ORDER BY id DESC");
  },
  async createApp(name, url) {
    const result = await run("INSERT INTO apps (name, url) VALUES (?, ?)", [
      name,
      url,
    ]);
    return result.id;
  },
  async updateApp(id, name, url) {
    return run("UPDATE apps SET name = ?, url = ? WHERE id = ?", [
      name,
      url,
      id,
    ]);
  },
  async deleteApp(id) {
    return run("DELETE FROM apps WHERE id = ?", [id]);
  },
};
