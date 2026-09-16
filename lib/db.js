import { sql } from '@vercel/postgres';

let initialized = false;
export async function initDb() {
  if (initialized) return;
  await sql`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    phone TEXT UNIQUE NOT NULL,
    name TEXT,
    email TEXT,
    wallet_balance INTEGER NOT NULL DEFAULT 0,
    referral_code TEXT UNIQUE,
    referred_by TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT now()
  );`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS pin_hash TEXT;`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';`;
  if (process.env.ADMIN_PHONE) {
    await sql`UPDATE users SET role = 'admin' WHERE phone = ${process.env.ADMIN_PHONE}`;
  }
  await sql`CREATE TABLE IF NOT EXISTS otp_codes (
    phone TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0
  );`;
  await sql`CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
  );`;
  await sql`CREATE TABLE IF NOT EXISTS wallet_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    reference TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
  );`;
  await sql`CREATE TABLE IF NOT EXISTS transactions (
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
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );`;
  await sql`CREATE TABLE IF NOT EXISTS referrals (
    id TEXT PRIMARY KEY,
    referrer_id TEXT NOT NULL,
    referred_user_id TEXT NOT NULL,
    reward_amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'credited',
    created_at TIMESTAMPTZ DEFAULT now()
  );`;
  await sql`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );`;
  await sql`INSERT INTO settings (key, value) VALUES
    ('purchase_markup_percent', '5'),
    ('wallet_funding_fee_percent', '2'),
    ('referral_reward_kobo', '5000')
    ON CONFLICT (key) DO NOTHING;`;
  await sql`CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
  );`;
  initialized = true;
}

export async function getUserByPhone(phone) { await initDb(); const { rows } = await sql`SELECT * FROM users WHERE phone = ${phone}`; return rows[0]; }
export async function getUserById(id) { await initDb(); const { rows } = await sql`SELECT * FROM users WHERE id = ${id}`; return rows[0]; }
export async function getUserByReferralCode(code) { await initDb(); const { rows } = await sql`SELECT * FROM users WHERE referral_code = ${code}`; return rows[0]; }
export async function createUser({ id, phone, referral_code, referred_by }) { await initDb(); await sql`INSERT INTO users (id, phone, referral_code, referred_by) VALUES (${id}, ${phone}, ${referral_code}, ${referred_by || null})`; return getUserById(id); }
export async function updateUser(id, { name, email }) { await initDb(); await sql`UPDATE users SET name = COALESCE(${name ?? null}, name), email = COALESCE(${email ?? null}, email) WHERE id = ${id}`; return getUserById(id); }
export async function adjustWalletBalance(userId, deltaKobo) { await initDb(); await sql`UPDATE users SET wallet_balance = wallet_balance + ${deltaKobo} WHERE id = ${userId}`; return getUserById(userId); }
export async function setUserPin(userId, pinHash) { await initDb(); await sql`UPDATE users SET pin_hash = ${pinHash} WHERE id = ${userId}`; return getUserById(userId); }
export async function setUserAvatar(userId, avatarUrl) { await initDb(); await sql`UPDATE users SET avatar_url = ${avatarUrl} WHERE id = ${userId}`; return getUserById(userId); }
export async function setEmailVerified(userId, verified) { await initDb(); await sql`UPDATE users SET email_verified = ${verified} WHERE id = ${userId}`; return getUserById(userId); }

export async function saveOtp(phone, code, expiresAt) { await initDb(); await sql`INSERT INTO otp_codes (phone, code, expires_at, attempts) VALUES (${phone}, ${code}, ${expiresAt}, 0) ON CONFLICT (phone) DO UPDATE SET code = ${code}, expires_at = ${expiresAt}, attempts = 0`; }
export async function getOtp(phone) { await initDb(); const { rows } = await sql`SELECT * FROM otp_codes WHERE phone = ${phone}`; return rows[0]; }
export async function incrementOtpAttempts(phone) { await initDb(); await sql`UPDATE otp_codes SET attempts = attempts + 1 WHERE phone = ${phone}`; }
export async function clearOtp(phone) { await initDb(); await sql`DELETE FROM otp_codes WHERE phone = ${phone}`; }
export async function createSession(token, userId, expiresAt) { await initDb(); await sql`INSERT INTO sessions (token, user_id, expires_at) VALUES (${token}, ${userId}, ${expiresAt})`; }
export async function getSession(token) { await initDb(); const { rows } = await sql`SELECT * FROM sessions WHERE token = ${token}`; return rows[0]; }
export async function deleteSession(token) { await initDb(); await sql`DELETE FROM sessions WHERE token = ${token}`; }

export async function createWalletTx({ id, user_id, type, amount, reference, description }) { await initDb(); await sql`INSERT INTO wallet_transactions (id, user_id, type, amount, reference, description, status) VALUES (${id}, ${user_id}, ${type}, ${amount}, ${reference}, ${description || null}, 'pending')`; }
export async function updateWalletTxStatus(reference, status) { await initDb(); await sql`UPDATE wallet_transactions SET status = ${status} WHERE reference = ${reference}`; }
export async function getWalletTx(reference) { await initDb(); const { rows } = await sql`SELECT * FROM wallet_transactions WHERE reference = ${reference}`; return rows[0]; }
export async function listWalletTx(userId, limit = 20) { await initDb(); const { rows } = await sql`SELECT * FROM wallet_transactions WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT ${limit}`; return rows; }
export async function createTransaction(tx) { await initDb(); await sql`INSERT INTO transactions (id, user_id, reference, phone, email, network, type, plan_code, base_amount, amount, payment_method, status) VALUES (${tx.id}, ${tx.user_id}, ${tx.reference}, ${tx.phone}, ${tx.email}, ${tx.network}, ${tx.type}, ${tx.plan_code}, ${tx.base_amount}, ${tx.amount}, ${tx.payment_method}, 'pending')`; return tx; }
export async function updateTransactionStatus(reference, status, extra = {}) { await initDb(); if (extra.vtpass_ref) await sql`UPDATE transactions SET status = ${status}, vtpass_ref = ${extra.vtpass_ref}, updated_at = now() WHERE reference = ${reference}`; else await sql`UPDATE transactions SET status = ${status}, updated_at = now() WHERE reference = ${reference}`; }
export async function getTransaction(reference) { await initDb(); const { rows } = await sql`SELECT * FROM transactions WHERE reference = ${reference}`; return rows[0]; }
export async function listTransactions(userId, limit = 20) { await initDb(); const { rows } = await sql`SELECT * FROM transactions WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT ${limit}`; return rows; }

export async function listUsers(limit = 50) { await initDb(); const { rows } = await sql`SELECT id, phone, name, email, wallet_balance, role, created_at FROM users ORDER BY created_at DESC LIMIT ${limit}`; return rows; }
export async function listAdminTransactions(limit = 50) { await initDb(); const { rows } = await sql`SELECT id, user_id, reference, phone, network, type, amount, payment_method, status, created_at FROM transactions ORDER BY created_at DESC LIMIT ${limit}`; return rows; }
export async function countUsers() { await initDb(); const { rows } = await sql`SELECT COUNT(*) AS count FROM users`; return Number(rows[0].count); }
export async function countTransactions() { await initDb(); const { rows } = await sql`SELECT COUNT(*) AS count FROM transactions`; return Number(rows[0].count); }

export async function createReferral({ id, referrer_id, referred_user_id, reward_amount }) { await initDb(); await sql`INSERT INTO referrals (id, referrer_id, referred_user_id, reward_amount, status) VALUES (${id}, ${referrer_id}, ${referred_user_id}, ${reward_amount}, 'credited')`; }
export async function listReferrals(userId, limit = 50) { await initDb(); const { rows } = await sql`SELECT * FROM referrals WHERE referrer_id = ${userId} ORDER BY created_at DESC LIMIT ${limit}`; return rows; }
export async function countReferrals(userId) { await initDb(); const { rows } = await sql`SELECT COUNT(*) as count FROM referrals WHERE referrer_id = ${userId}`; return Number(rows[0].count); }
export async function getSetting(key) { await initDb(); const { rows } = await sql`SELECT value FROM settings WHERE key = ${key}`; return rows[0] ? rows[0].value : null; }
export async function setSetting(key, value) { await initDb(); await sql`INSERT INTO settings (key, value) VALUES (${key}, ${String(value)}) ON CONFLICT (key) DO UPDATE SET value = ${String(value)}`; }
export async function getAllSettings() { await initDb(); const { rows } = await sql`SELECT key, value FROM settings`; const obj = {}; rows.forEach((r) => (obj[r.key] = r.value)); return obj; }
export async function createNotification({ id, user_id, type, title, message }) { await initDb(); await sql`INSERT INTO notifications (id, user_id, type, title, message) VALUES (${id}, ${user_id}, ${type}, ${title}, ${message || null})`; }
export async function listNotifications(userId, limit = 30) { await initDb(); const { rows } = await sql`SELECT * FROM notifications WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT ${limit}`; return rows; }
export async function countUnreadNotifications(userId) { await initDb(); const { rows } = await sql`SELECT COUNT(*) as count FROM notifications WHERE user_id = ${userId} AND is_read = false`; return Number(rows[0].count); }
export async function markNotificationRead(id) { await initDb(); await sql`UPDATE notifications SET is_read = true WHERE id = ${id}`; }
export async function markAllNotificationsRead(userId) { await initDb(); await sql`UPDATE notifications SET is_read = true WHERE user_id = ${userId}`; }
