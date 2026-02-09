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

module.exports = {
  isAuthenticated,
  requireAuthPage,
  requireAuthApi,
};
