const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/health", async (req, res) => {
  try {
    // Verificar que la base de datos está respondiendo
    await db.listApps();
    res.json({
      ok: true,
      timestamp: new Date().toISOString(),
      status: "healthy"
    });
  } catch (err) {
    console.error("Health check failed:", err);
    res.status(503).json({
      ok: false,
      error: "Database unavailable",
      status: "unhealthy"
    });
  }
});

module.exports = router;
