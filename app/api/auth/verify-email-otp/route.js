import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getOtp, clearOtp, incrementOtpAttempts, setEmailVerified } from "@/lib/db";

export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    if (!user.email) return NextResponse.json({ error: "Add an email first" }, { status: 400 });

    const { code } = await req.json();

    const otp = await getOtp(user.email);
    if (!otp) return NextResponse.json({ error: "No code found — request a new one" }, { status: 400 });
    if (new Date(otp.expires_at) < new Date()) {
      return NextResponse.json({ error: "Code expired — request a new one" }, { status: 400 });
    }
    if (otp.attempts >= 5) {
      return NextResponse.json({ error: "Too many attempts — request a new code" }, { status: 400 });
    }
    if (otp.code !== code) {
      await incrementOtpAttempts(user.email);
      return NextResponse.json({ error: "Incorrect code" }, { status: 400 });
    }

    await clearOtp(user.email);
    await setEmailVerified(user.id, true);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("verify-email-otp error:", err.message);
    return NextResponse.json({ error: "Could not verify code" }, { status: 500 });
  }
}