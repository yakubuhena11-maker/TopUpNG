import { sql } from "@vercel/postgres";
import { initDb } from "@/lib/db";

async function preparePasswordAuth() {
  await initDb();
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true`;
  await sql`CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ
  )`;
}

export async function getPasswordUserByPhone(phone) {
  await preparePasswordAuth();
  const { rows } = await sql`SELECT * FROM users WHERE phone = ${phone}`;
  return rows[0];
}

export async function createPasswordUser({ id, phone, password, referral_code, referred_by }) {
  await preparePasswordAuth();
  const { rows } = await sql`
    INSERT INTO users (id, phone, password, referral_code, referred_by)
    VALUES (${id}, ${phone}, ${password}, ${referral_code}, ${referred_by})
    RETURNING *
  `;
  return rows[0];
}

export async function setPassword(userId, password) {
  await preparePasswordAuth();
  const { rows } = await sql`UPDATE users SET password = ${password} WHERE id = ${userId} RETURNING *`;
  return rows[0];
}

export async function createPasswordResetToken(tokenHash, userId, expiresAt) {
  await preparePasswordAuth();
  await sql`UPDATE password_reset_tokens SET used_at = now() WHERE user_id = ${userId} AND used_at IS NULL`;
  await sql`INSERT INTO password_reset_tokens (token_hash, user_id, expires_at) VALUES (${tokenHash}, ${userId}, ${expiresAt})`;
}

export async function getPasswordResetToken(tokenHash) {
  await preparePasswordAuth();
  const { rows } = await sql`
    SELECT * FROM password_reset_tokens
    WHERE token_hash = ${tokenHash} AND used_at IS NULL AND expires_at > now()
  `;
  return rows[0];
}

export async function consumePasswordResetToken(tokenHash) {
  await preparePasswordAuth();
  await sql`UPDATE password_reset_tokens SET used_at = now() WHERE token_hash = ${tokenHash}`;
}
