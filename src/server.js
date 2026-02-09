const express = require("express");
const fs = require("fs");
const morgan = require("morgan");
const path = require("path");
const session = require("express-session");
const {
  adminEmail,
  adminPassword,
  baseDir,
  cookieSecure,
  port,
  sessionSecret,
  uploadDir,
} = require("./config/env");
const { requireAuthApi, requireAuthPage, isAuthenticated } = require("./middleware/auth");
const appsRoutes = require("./routes/apps");
const authRoutes = require("./routes/auth");
const healthRoutes = require("./routes/health");
const pagesRoutes = require("./routes/pages");

if (!adminEmail || !adminPassword || sessionSecret === "change-me") {
  console.error(
    "Auth is required. Set ADMIN_EMAIL, ADMIN_PASSWORD, and SESSION_SECRET."
  );
  process.exit(1);
}

fs.mkdirSync(uploadDir, { recursive: true });

const app = express();
const publicDir = path.join(baseDir, "public");

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

app.use("/uploads", requireAuthPage, express.static(uploadDir));
app.use((req, res, next) => {
  if (req.path === "/index.html" && !isAuthenticated(req)) {
    return res.redirect("/login.html");
  }
  return next();
});
app.use(express.static(publicDir));

app.use(healthRoutes);
app.use(authRoutes);
app.use(pagesRoutes);
app.use("/api/apps", requireAuthApi, appsRoutes);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Unexpected server error" });
});

app.listen(port, () => {
  console.log(`homelinks running on port ${port}`);
});

// Manejo de cierre graceful
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, closing gracefully...");
  const dbModule = require("./db");
  await dbModule.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, closing gracefully...");
  const dbModule = require("./db");
  await dbModule.close();
  process.exit(0);
});
