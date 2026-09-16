import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getUserByReferralCode, createReferral, adjustWalletBalance, getSetting } from "@/lib/db";
import { getPasswordUserByPhone, createPasswordUser } from "@/lib/password-auth-db";
import { normalizePhone, generateReferralCode, createUserSession } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

export async function POST(req) {
  try {
    const { phone, password, confirmPassword, ref } = await req.json();
    const cleanPhone = normalizePhone(phone);
    if (cleanPhone.length < 10) return NextResponse.json({ error: "Enter a valid phone number" }, { status: 400 });
    if (!password || password.length < 4) return NextResponse.json({ error: "Password must be at least 4 characters" }, { status: 400 });
    if (password !== confirmPassword) return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
    if (await getPasswordUserByPhone(cleanPhone)) return NextResponse.json({ error: "An account with this phone already exists" }, { status: 409 });

    const referredByUser = ref ? await getUserByReferralCode(ref) : null;
    const user = await createPasswordUser({ id: uuidv4(), phone: cleanPhone, password: hashPassword(password), referral_code: generateReferralCode(), referred_by: referredByUser?.id || null });
    if (referredByUser) {
      const rewardKobo = parseInt((await getSetting("referral_reward_kobo")) || "5000", 10);
      await createReferral({ id: uuidv4(), referrer_id: referredByUser.id, referred_user_id: user.id, reward_amount: rewardKobo });
      await adjustWalletBalance(referredByUser.id, rewardKobo);
    }
    await createUserSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("register error:", err);
    return NextResponse.json({ error: "Could not create account" }, { status: 500 });
  }
}
