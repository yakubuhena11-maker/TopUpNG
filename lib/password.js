import crypto from "crypto";

const KEY_LENGTH = 64;

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.startsWith("scrypt:")) return false;
  const [, salt, expectedHex] = storedHash.split(":");
  if (!salt || !expectedHex) return false;

  const actual = crypto.scryptSync(password, salt, KEY_LENGTH);
  const expected = Buffer.from(expectedHex, "hex");
  return expected.length === actual.length && crypto.timingSafeEqual(actual, expected);
}

export function generateResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashResetToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
