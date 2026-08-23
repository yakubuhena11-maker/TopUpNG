import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
  getOtp, clearOtp, incrementOtpAttempts,
  getUserByPhone, createUser, getUserByReferralCode,
  createReferral, adjustWalletBalance, getSetting,
} from "@/lib/db";
import { normalizePhone, generateReferralCode, createUserSession } from "@/lib/auth";

export async function POST(req) {
  try {
    const { phone, code, ref } = await req.json();
    const cleanPhone = normalizePhone(phone);

    const otp = await getOtp(cleanPhone);
    if (!otp) return NextResponse.json({ error: "No code found — request a new one" }, { status: 400 });
    if (new Date(otp.expires_at) < new Date()) {
      return NextResponse.json({ error: "Code expired — request a new one" }, { status: 400 });
    }
    if (otp.attempts >= 5) {
      return NextResponse.json({ error: "Too many attempts — request a new code" }, { status: 400 });
    }
    if (otp.code !== code) {
      await incrementOtpAttempts(cleanPhone);
      return NextResponse.json({ error: "Incorrect code" }, { status: 400 });
    }

    await clearOtp(cleanPhone);

    let user = await getUserByPhone(cleanPhone);
    if (!user) {
      const referredByUser = ref ? await getUserByReferralCode(ref) : null;
      user = await createUser({
        id: uuidv4(),
        phone: cleanPhone,
        referral_code: generateReferralCode(),
        referred_by: referredByUser ? referredByUser.id : null,
      });

      if (referredByUser) {
        const rewardKobo = parseInt((await getSetting("referral_reward_kobo")) || "5000", 10);
        await createReferral({
          id: uuidv4(),
          referrer_id: referredByUser.id,
          referred_user_id: user.id,
          reward_amount: rewardKobo,
        });
        await adjustWalletBalance(referredByUser.id, rewardKobo);
      }
    }

    await createUserSession(user.id);

    return NextResponse.json({ ok: true, user });
  } catch (err) {
    console.error("verify-otp error:", err.message);
    return NextResponse.json({ error: "Could not verify code" }, { status: 500 });
  }
}