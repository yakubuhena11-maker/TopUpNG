import crypto from "crypto";
import { cookies } from "next/headers";
import { createSession, getSession, deleteSession, getUserById } from "@/lib/db";

const SESSION_COOKIE = "topupng_session";
const SESSION_DAYS = 30;

export function normalizePhone(phone) { return String(phone || "").replace(/\D/g, ""); }
export function generateReferralCode() { return Math.random().toString(36).slice(2, 8).toUpperCase(); }

export async function createUserSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await createSession(token, userId, expiresAt);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: SESSION_DAYS * 24 * 60 * 60, path: "/" });
  return token;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await getSession(token);
  if (!session || new Date(session.expires_at) < new Date()) return null;
  const user = await getUserById(session.user_id);
  return user?.is_active === false ? null : user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  return user?.role === "admin" ? user : null;
}

export async function logout() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) await deleteSession(token);
  cookieStore.delete(SESSION_COOKIE);
}
