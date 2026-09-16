import { sql } from "@vercel/postgres";

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
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';`;
  if (process.env.ADMIN_PHONE) await sql`UPDATE users SET role = 'admin' WHERE phone = ${process.env.ADMIN_PHONE}`;
  await sql`CREATE TABLE IF NOT EXISTS otp_codes (phone TEXT PRIMARY KEY, code TEXT NOT NULL, expires_at TIMESTAMPTZ NOT NULL, attempts INTEGER NOT NULL DEFAULT 0);`;
  await sql`CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ
  );`;
  await sql`CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at TIMESTAMPTZ NOT NULL);`;
  await sql`CREATE TABLE IF NOT EXISTS wallet_transactions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, type TEXT NOT NULL, amount INTEGER NOT NULL, reference TEXT UNIQUE, status TEXT NOT NULL DEFAULT 'pending', description TEXT, created_at TIMESTAMPTZ DEFAULT now());`;
  await sql`CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, user_id TEXT, reference TEXT UNIQUE NOT NULL, phone TEXT NOT NULL, email TEXT, network TEXT NOT NULL, type TEXT NOT NULL, plan_code TEXT, base_amount INTEGER NOT NULL, amount INTEGER NOT NULL, payment_method TEXT NOT NULL DEFAULT 'paystack', status TEXT NOT NULL DEFAULT 'pending', vtpass_ref TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());`;
  await sql`CREATE TABLE IF NOT EXISTS referrals (id TEXT PRIMARY KEY, referrer_id TEXT NOT NULL, referred_user_id TEXT NOT NULL, reward_amount INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'credited', created_at TIMESTAMPTZ DEFAULT now());`;
  await sql`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);`;
  await sql`INSERT INTO settings (key, value) VALUES ('purchase_markup_percent', '5'), ('wallet_funding_fee_percent', '2'), ('referral_reward_kobo', '5000') ON CONFLICT (key) DO NOTHING;`;
  await sql`CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, type TEXT NOT NULL, title TEXT NOT NULL, message TEXT, is_read BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ DEFAULT now());`;
  initialized = true;
}

export async function getUserByPhone(phone) { await initDb(); const { rows } = await sql`SELECT * FROM users WHERE phone = ${phone}`; return rows[0]; }
export async function getUserById(id) { await initDb(); const { rows } = await sql`SELECT * FROM users WHERE id = ${id}`; return rows[0]; }
export async function getUserByReferralCode(code) { await initDb(); const { rows } = await sql`SELECT * FROM users WHERE referral_code = ${code}`; return rows[0]; }
export async function createUser({ id, phone, password, referral_code, referred_by }) { await initDb(); const { rows } = await sql`INSERT INTO users (id, phone, password, referral_code, referred_by) VALUES (${id}, ${phone}, ${password}, ${referral_code}, ${referred_by}) RETURNING *`; return rows[0]; }
export async function setUserPassword(id, password) { await initDb(); const { rows } = await sql`UPDATE users SET password = ${password} WHERE id = ${id} RETURNING *`; return rows[0]; }
export async function createPasswordResetToken(tokenHash, userId, expiresAt) { await initDb(); await sql`UPDATE password_reset_tokens SET used_at = now() WHERE user_id = ${userId} AND used_at IS NULL`; await sql`INSERT INTO password_reset_tokens (token_hash, user_id, expires_at) VALUES (${tokenHash}, ${userId}, ${expiresAt})`; }
export async function getPasswordResetToken(tokenHash) { await initDb(); const { rows } = await sql`SELECT * FROM password_reset_tokens WHERE token_hash = ${tokenHash} AND used_at IS NULL AND expires_at > now()`; return rows[0]; }
export async function consumePasswordResetToken(tokenHash) { await initDb(); await sql`UPDATE password_reset_tokens SET used_at = now() WHERE token_hash = ${tokenHash}`; }

export async function createReferral({ id, referrer_id, referred_user_id, reward_amount }) { await initDb(); await sql`INSERT INTO referrals (id, referrer_id, referred_user_id, reward_amount, status) VALUES (${id}, ${referrer_id}, ${referred_user_id}, ${reward_amount}, 'credited')`; }
export async function adjustWalletBalance(userId, deltaKobo) { await initDb(); await sql`UPDATE users SET wallet_balance = wallet_balance + ${deltaKobo} WHERE id = ${userId}`; return getUserById(userId); }
export async function getSetting(key) { await initDb(); const { rows } = await sql`SELECT value FROM settings WHERE key = ${key}`; return rows[0] ? rows[0].value : null; }
export async function createSession(token, userId, expiresAt) { await initDb(); await sql`INSERT INTO sessions (token, user_id, expires_at) VALUES (${token}, ${userId}, ${expiresAt})`; }
export async function getSession(token) { await initDb(); const { rows } = await sql`SELECT * FROM sessions WHERE token = ${token}`; return rows[0]; }
export async function deleteSession(token) { await initDb(); await sql`DELETE FROM sessions WHERE token = ${token}`; }
