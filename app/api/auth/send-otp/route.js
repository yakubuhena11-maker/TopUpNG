import { NextResponse } from "next/server";
import { getUserByPhone, saveOtp } from "@/lib/db";
import { generateOtpCode, otpExpiryIso, normalizePhone } from "@/lib/auth";

export async function POST(req) {
  try {
    const { phone } = await req.json();
    if (!phone || phone.length < 10) {
      return NextResponse.json({ error: "Enter a valid phone number" }, { status: 400 });
    }

    const cleanPhone = normalizePhone(phone);
    const code = generateOtpCode();
    const expiresAt = otpExpiryIso(5);

    await saveOtp(cleanPhone, code, expiresAt);

    // TODO: send `code` via SMS provider (Termii, Twilio, etc). For now, log it for testing.
    console.log(`OTP for ${cleanPhone}: ${code}`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("send-otp error:", err.message);
    return NextResponse.json({ error: "Could not send code" }, { status: 500 });
  }
}