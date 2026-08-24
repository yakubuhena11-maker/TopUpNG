import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { saveOtp } from "@/lib/db";
import { generateOtpCode, otpExpiryIso } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/email";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    if (!user.email) return NextResponse.json({ error: "Add an email first" }, { status: 400 });
    if (user.email_verified) return NextResponse.json({ error: "Email already verified" }, { status: 400 });

    const code = generateOtpCode();
    const expiresAt = otpExpiryIso(5);
    await saveOtp(user.email, code, expiresAt);

    await sendOtpEmail(user.email, code);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("send-email-otp error:", err.message);
    return NextResponse.json({ error: "Could not send code" }, { status: 500 });
  }
}