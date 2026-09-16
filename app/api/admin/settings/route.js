import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAllSettings, setSetting } from "@/lib/db";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ settings: await getAllSettings() });
}

export async function PATCH(req) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const allowedKeys = ["purchase_markup_percent", "wallet_funding_fee_percent", "referral_reward_kobo"];
  for (const key of allowedKeys) {
    if (body[key] !== undefined) {
      const value = Number(body[key]);
      if (!Number.isFinite(value) || value < 0) return NextResponse.json({ error: `Invalid ${key}` }, { status: 400 });
      await setSetting(key, value);
    }
  }
  return NextResponse.json({ ok: true, settings: await getAllSettings() });
}
