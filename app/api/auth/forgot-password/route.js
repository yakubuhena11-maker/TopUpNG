import { NextResponse } from "next/server";
import { getPasswordUserByPhone, createPasswordResetToken } from "@/lib/password-auth-db";
import { normalizePhone } from "@/lib/auth";
import { generateResetToken, hashResetToken } from "@/lib/password";

export async function POST(req) {
  try {
    const { phone } = await req.json();
    const cleanPhone = normalizePhone(phone);
    if (cleanPhone.length < 10) return NextResponse.json({ error: "Enter a valid phone number" }, { status: 400 });

    const user = await getPasswordUserByPhone(cleanPhone);
    if (!user) return NextResponse.json({ ok: true, message: "If that account exists, reset instructions have been generated." });

    const token = generateResetToken();
    await createPasswordResetToken(hashResetToken(token), user.id, new Date(Date.now() + 15 * 60 * 1000).toISOString());
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/login?reset=${token}`;
    console.log(`Password reset link for ${cleanPhone}: ${resetUrl}`);

    return NextResponse.json({
      ok: true,
      message: "Reset link generated. Check the server logs in development.",
      ...(process.env.NODE_ENV !== "production" ? { resetUrl } : {}),
    });
  } catch (err) {
    console.error("forgot password error:", err);
    return NextResponse.json({ error: "Could not generate reset instructions" }, { status: 500 });
  }
}
