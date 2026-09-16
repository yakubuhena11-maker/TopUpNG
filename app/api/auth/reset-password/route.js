import { NextResponse } from "next/server";
import { getPasswordResetToken, consumePasswordResetToken, setPassword } from "@/lib/password-auth-db";
import { hashPassword, hashResetToken } from "@/lib/password";

export async function POST(req) {
  try {
    const { token, password, confirmPassword } = await req.json();
    if (!token) return NextResponse.json({ error: "Reset token is required" }, { status: 400 });
    if (!password || password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    if (password !== confirmPassword) return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });

    const reset = await getPasswordResetToken(hashResetToken(token));
    if (!reset) return NextResponse.json({ error: "This reset link is invalid or expired" }, { status: 400 });
    await setPassword(reset.user_id, hashPassword(password));
    await consumePasswordResetToken(reset.token_hash);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("reset password error:", err);
    return NextResponse.json({ error: "Could not reset password" }, { status: 500 });
  }
}
