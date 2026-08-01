const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const { baseDir } = require("./config/env");

const defaultDbPath = path.join(baseDir, "data", "homelinks.sqlite");
const dbPath = process.env.DB_PATH || defaultDbPath;

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new sqlite3.Database(dbPath);

const initialization = new Promise((resolve, reject) => {
  db.serialize(() => {
    db.run(
      "CREATE TABLE IF NOT EXISTS apps (" +
      "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
      "name TEXT NOT NULL, " +
      "url TEXT NOT NULL, " +
      "created_at TEXT DEFAULT CURRENT_TIMESTAMP" +
      ")",
      (createError) => {
        if (createError) return reject(createError);

        db.all("PRAGMA table_info(apps)", (infoError, rows) => {
          if (infoError) return reject(infoError);

          const columns = [
            ["image_url", "ALTER TABLE apps ADD COLUMN image_url TEXT"],
            ["favorite", "ALTER TABLE apps ADD COLUMN favorite INTEGER DEFAULT 0"],
            ["category", "ALTER TABLE apps ADD COLUMN category TEXT"],
            ["description", "ALTER TABLE apps ADD COLUMN description TEXT"],
          ];
          const migrations = columns
            .filter(([name]) => !rows.some((row) => row.name === name))
            .map(([, sql]) => sql);

          const applyMigration = (index) => {
            if (index >= migrations.length) {
              return db.run(
                "UPDATE apps SET category = UPPER(TRIM(category)) WHERE category IS NOT NULL AND category != ''",
                (updateError) => {
                  if (updateError) return reject(updateError);
                  resolve();
                }
              );
            }
            return db.run(migrations[index], (migrationError) => {
              if (migrationError) return reject(migrationError);
              applyMigration(index + 1);
            });
          };

          applyMigration(0);
        });
      }
    );
  });
});

async function run(sql, params = []) {
  await initialization;
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

async function all(sql, params = []) {
  await initialization;
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
      "SELECT id, name, url, image_url, favorite, category, description, created_at FROM apps ORDER BY favorite DESC, name COLLATE NOCASE ASC"
    );
  },
  async getAppById(id) {
    const rows = await all(
      "SELECT id, name, url, image_url, favorite, category, description FROM apps WHERE id = ?",
      [id]
    );
    return rows[0] || null;
  },
  async createApp(name, url, imageUrl = null, category = null, description = null) {
    const result = await run(
      "INSERT INTO apps (name, url, image_url, favorite, category, description) VALUES (?, ?, ?, 0, ?, ?)",
      [name, url, imageUrl, category, description]
    );
    return result.id;
  },
  async updateApp(id, name, url, imageUrl = null, category = null, description = null) {
    return run(
      "UPDATE apps SET name = ?, url = ?, image_url = COALESCE(?, image_url), category = ?, description = ? WHERE id = ?",
      [name, url, imageUrl, category, description, id]
    );
  },
  async toggleFavorite(id) {
    return run(
      "UPDATE apps SET favorite = NOT favorite WHERE id = ?",
      [id]
    );
  },
  async replaceAllApps(apps) {
    await run("BEGIN TRANSACTION");
    try {
      await run("DELETE FROM apps");
      for (const app of apps) {
        await run(
          "INSERT INTO apps (name, url, image_url, favorite, category, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            app.name,
            app.url,
            app.image_url || null,
            app.favorite ? 1 : 0,
            app.category || null,
            app.description || null,
            app.created_at || new Date().toISOString(),
          ]
        );
      }
      await run("COMMIT");
    } catch (err) {
      await run("ROLLBACK");
      throw err;
    }
  },
  async getCategories() {
    const rows = await all(
      "SELECT DISTINCT category FROM apps WHERE category IS NOT NULL AND category != '' ORDER BY UPPER(category) ASC"
    );
    // Deduplicate case-insensitive (e.g. 'Media' and 'media')
    const seen = new Map();
    for (const row of rows) {
      const key = row.category.toLowerCase();
      if (!seen.has(key)) seen.set(key, row.category);
    }
    return Array.from(seen.values());
  },
  async deleteApp(id) {
    return run("DELETE FROM apps WHERE id = ?", [id]);
  },
  close() {
    return initialization.then(() => new Promise((resolve) => {
      db.close((err) => {
        if (err) console.error("Error closing database:", err);
        resolve();
      });
    }));
  },
};
