import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(process.cwd(), "app.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    phone TEXT UNIQUE NOT NULL,
    name TEXT,
    email TEXT,
    wallet_balance INTEGER NOT NULL DEFAULT 0,
    referral_code TEXT UNIQUE,
    referred_by TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS otp_codes (
    phone TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS wallet_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    reference TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending',
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    reference TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    network TEXT NOT NULL,
    type TEXT NOT NULL,
    plan_code TEXT,
    base_amount INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'paystack',
    status TEXT NOT NULL DEFAULT 'pending',
    vtpass_ref TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS referrals (
    id TEXT PRIMARY KEY,
    referrer_id TEXT NOT NULL,
    referred_user_id TEXT NOT NULL,
    reward_amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'credited',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  INSERT OR IGNORE INTO settings (key, value) VALUES
    ('purchase_markup_percent', '5'),
    ('wallet_funding_fee_percent', '2'),
    ('referral_reward_kobo', '5000');
`);

export function getUserByPhone(phone) {
  return db.prepare(`SELECT * FROM users WHERE phone = ?`).get(phone);
}
export function getUserById(id) {
  return db.prepare(`SELECT * FROM users WHERE id = ?`).get(id);
}
export function getUserByReferralCode(code) {
  return db.prepare(`SELECT * FROM users WHERE referral_code = ?`).get(code);
}
export function createUser({ id, phone, referral_code, referred_by }) {
  db.prepare(`INSERT INTO users (id, phone, referral_code, referred_by) VALUES (?, ?, ?, ?)`)
    .run(id, phone, referral_code, referred_by || null);
  return getUserById(id);
}
export function updateUser(id, { name, email }) {
  db.prepare(`UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email) WHERE id = ?`)
    .run(name ?? null, email ?? null, id);
  return getUserById(id);
}
export function adjustWalletBalance(userId, deltaKobo) {
  db.prepare(`UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?`).run(deltaKobo, userId);
  return getUserById(userId);
}

export function saveOtp(phone, code, expiresAt) {
  db.prepare(`
    INSERT INTO otp_codes (phone, code, expires_at, attempts) VALUES (?, ?, ?, 0)
    ON CONFLICT(phone) DO UPDATE SET code = excluded.code, expires_at = excluded.expires_at, attempts = 0
  `).run(phone, code, expiresAt);
}
export function getOtp(phone) {
  return db.prepare(`SELECT * FROM otp_codes WHERE phone = ?`).get(phone);
}
export function incrementOtpAttempts(phone) {
  db.prepare(`UPDATE otp_codes SET attempts = attempts + 1 WHERE phone = ?`).run(phone);
}
export function clearOtp(phone) {
  db.prepare(`DELETE FROM otp_codes WHERE phone = ?`).run(phone);
}

export function createSession(token, userId, expiresAt) {
  db.prepare(`INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)`).run(token, userId, expiresAt);
}
export function getSession(token) {
  return db.prepare(`SELECT * FROM sessions WHERE token = ?`).get(token);
}
export function deleteSession(token) {
  db.prepare(`DELETE FROM sessions WHERE token = ?`).run(token);
}

export function createWalletTx({ id, user_id, type, amount, reference, description }) {
  db.prepare(`
    INSERT INTO wallet_transactions (id, user_id, type, amount, reference, description, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `).run(id, user_id, type, amount, reference, description || null);
}
export function updateWalletTxStatus(reference, status) {
  db.prepare(`UPDATE wallet_transactions SET status = ? WHERE reference = ?`).run(status, reference);
}
export function getWalletTx(reference) {
  return db.prepare(`SELECT * FROM wallet_transactions WHERE reference = ?`).get(reference);
}
export function listWalletTx(userId, limit = 20) {
  return db.prepare(`SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`).all(userId, limit);
}

export function createTransaction(tx) {
  db.prepare(`
    INSERT INTO transactions (id, user_id, reference, phone, email, network, type, plan_code, base_amount, amount, payment_method, status)
    VALUES (@id, @user_id, @reference, @phone, @email, @network, @type, @plan_code, @base_amount, @amount, @payment_method, 'pending')
  `).run(tx);
  return tx;
}
export function updateTransactionStatus(reference, status, extra = {}) {
  const fields = ["status = @status", "updated_at = CURRENT_TIMESTAMP"];
  const params = { reference, status, ...extra };
  if (extra.vtpass_ref) fields.push("vtpass_ref = @vtpass_ref");
  db.prepare(`UPDATE transactions SET ${fields.join(", ")} WHERE reference = @reference`).run(params);
}
export function getTransaction(reference) {
  return db.prepare(`SELECT * FROM transactions WHERE reference = ?`).get(reference);
}
export function listTransactions(userId, limit = 20) {
  return db.prepare(`SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`).all(userId, limit);
}

export function createReferral({ id, referrer_id, referred_user_id, reward_amount }) {
  db.prepare(`
    INSERT INTO referrals (id, referrer_id, referred_user_id, reward_amount, status)
    VALUES (?, ?, ?, ?, 'credited')
  `).run(id, referrer_id, referred_user_id, reward_amount);
}
export function listReferrals(userId, limit = 50) {
  return db.prepare(`SELECT * FROM referrals WHERE referrer_id = ? ORDER BY created_at DESC LIMIT ?`).all(userId, limit);
}
export function countReferrals(userId) {
  return db.prepare(`SELECT COUNT(*) as count FROM referrals WHERE referrer_id = ?`).get(userId).count;
}

export function getSetting(key) {
  const row = db.prepare(`SELECT value FROM settings WHERE key = ?`).get(key);
  return row ? row.value : null;
}
export function setSetting(key, value) {
  db.prepare(`
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key, String(value));
}
export function getAllSettings() {
  const rows = db.prepare(`SELECT key, value FROM settings`).all();
  const obj = {};
  rows.forEach((r) => (obj[r.key] = r.value));
  return obj;
}

export default db;
