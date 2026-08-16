import { NextResponse } from "next/server";
import { getAllSettings, setSetting } from "@/lib/db";

export async function GET() {
  const settings = getAllSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(req) {
  const body = await req.json();
  const allowedKeys = [
    "purchase_markup_percent",
    "wallet_funding_fee_percent",
    "referral_reward_kobo",
  ];

  for (const key of allowedKeys) {
    if (body[key] !== undefined) {
      setSetting(key, body[key]);
    }
  }

  return NextResponse.json({ ok: true, settings: getAllSettings() });
}
