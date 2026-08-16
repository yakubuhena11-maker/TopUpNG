import crypto from "crypto";
import { cookies } from "next/headers";
import { createSession, getSession, deleteSession, getUserById } from "@/lib/db";

const SESSION_COOKIE = "topupng_session";
const SESSION_DAYS = 30;

export function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function otpExpiryIso(minutes = 5) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

export function normalizePhone(phone) {
  return phone.replace(/\D/g, "");
}

export function generateReferralCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function createUserSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  createSession(token, userId, expiresAt);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: "/",
  });
  return token;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = getSession(token);
  if (!session) return null;
  if (new Date(session.expires_at) < new Date()) return null;

  return getUserById(session.user_id);
}

export async function logout() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) deleteSession(token);
  cookieStore.delete(SESSION_COOKIE);
}
