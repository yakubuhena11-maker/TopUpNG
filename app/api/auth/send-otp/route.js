import { NextResponse } from "next/server";
import { saveOtp } from "@/lib/db";
import { generateOtpCode, otpExpiryIso, normalizePhone } from "@/lib/auth";

function termiiPhone(phone) {
  const cleanPhone = normalizePhone(phone);
  if (cleanPhone.startsWith("234")) return cleanPhone;
  if (cleanPhone.startsWith("0")) return `234${cleanPhone.slice(1)}`;
  return cleanPhone;
}

async function sendTermiiSms(to, code) {
  const apiKey = process.env.TERMII_API_KEY;
  const senderId = process.env.TERMII_SENDER_ID;
  if (!apiKey || !senderId) throw new Error("Termii SMS configuration is missing");

  const response = await fetch("https://api.ng.termii.com/api/sms/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      to,
      from: senderId,
      sms: `Your TopUpNG verification code is ${code}. It expires in 5 minutes.`,
      type: "plain",
      channel: "dnd",
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.code === "401" || result.code === 401) {
    throw new Error(result.message || "Termii could not send the OTP");
  }
}

export async function POST(req) {
  try {
    const { phone } = await req.json();
    if (!phone || normalizePhone(phone).length < 10) {
      return NextResponse.json({ error: "Enter a valid phone number" }, { status: 400 });
    }

    const cleanPhone = normalizePhone(phone);
    const code = generateOtpCode();
    const expiresAt = otpExpiryIso(5);

    await sendTermiiSms(termiiPhone(cleanPhone), code);
    await saveOtp(cleanPhone, code, expiresAt);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("send-otp error:", err.message);
    return NextResponse.json({ error: "Could not send code" }, { status: 500 });
  }
}
