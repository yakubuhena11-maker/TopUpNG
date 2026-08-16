import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listReferrals, countReferrals } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const referrals = listReferrals(user.id);
  const count = countReferrals(user.id);
  const totalEarned = referrals.reduce((sum, r) => sum + r.reward_amount, 0);

  return NextResponse.json({
    referral_code: user.referral_code,
    referral_count: count,
    total_earned: totalEarned,
    referrals,
  });
}
