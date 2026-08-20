const crypto = require('crypto');

const ADMIN_ID = 'admin';
const ADMIN_PASSWORD = 'admin1234';
const SESSION_COOKIE = 'session';
const SESSION_TOKEN = crypto.createHash('sha256').update(`${ADMIN_ID}:${ADMIN_PASSWORD}`).digest('hex');

function verifyCredentials(id, password) {
  return id === ADMIN_ID && password === ADMIN_PASSWORD;
}

function parseCookies(header) {
  const cookies = {};
  (header || '').split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    if (key) cookies[key] = decodeURIComponent(pair.slice(idx + 1).trim());
  });
  return cookies;
}

function isAuthenticated(req) {
  return parseCookies(req.headers.cookie)[SESSION_COOKIE] === SESSION_TOKEN;
}

function login(res) {
  res.cookie(SESSION_COOKIE, SESSION_TOKEN, { httpOnly: true, sameSite: 'lax' });
}

function logout(res) {
  res.clearCookie(SESSION_COOKIE);
}

function requireLogin(req, res, next) {
  if (isAuthenticated(req)) return next();
  res.redirect(`/login?redirect=${encodeURIComponent(req.originalUrl)}`);
}

module.exports = {
  verifyCredentials,
  isAuthenticated,
  login,
  logout,
  requireLogin,
};
