const crypto = require("crypto");
const express = require("express");
const rateLimit = require("express-rate-limit");
const { adminEmail, adminPassword } = require("../config/env");
const { isAuthenticated } = require("../middleware/auth");

const router = express.Router();

// Rate limiter para prevenir ataques de fuerza bruta
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos
  message: { error: "Too many login attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/api/session", (req, res) => {
  if (!isAuthenticated(req)) {
    return res.json({ authenticated: false });
  }
  return res.json({ authenticated: true, email: req.session.user.email });
});

router.post("/api/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  // Usar timingSafeEqual para email y password para prevenir timing attacks
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedAdminEmail = adminEmail.trim().toLowerCase();

  // Pad ambos strings al mismo tamaño
  const maxEmailLen = Math.max(normalizedEmail.length, normalizedAdminEmail.length);
  const maxPassLen = Math.max(password.length, adminPassword.length);

  const emailBuf1 = Buffer.from(normalizedEmail.padEnd(maxEmailLen));
  const emailBuf2 = Buffer.from(normalizedAdminEmail.padEnd(maxEmailLen));
  const passBuf1 = Buffer.from(password.padEnd(maxPassLen));
  const passBuf2 = Buffer.from(adminPassword.padEnd(maxPassLen));

  let emailMatch = false;
  let passwordMatch = false;

  try {
    emailMatch = crypto.timingSafeEqual(emailBuf1, emailBuf2);
    passwordMatch = crypto.timingSafeEqual(passBuf1, passBuf2);
  } catch (err) {
    // Si hay error en la comparación, falla la autenticación
    return res.status(401).json({ error: "invalid credentials" });
  }

  if (!emailMatch || !passwordMatch) {
    return res.status(401).json({ error: "invalid credentials" });
  }

  req.session.user = { email: adminEmail };
  return res.json({ ok: true });
});

router.post("/api/logout", (req, res) => {
  if (!req.session) return res.json({ ok: true });
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

module.exports = router;
