import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { setUserPin } from "@/lib/db";
import { hashPin, verifyPin } from "@/lib/pin";

export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

    const { pin, currentPin } = await req.json();

    if (!pin || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: "PIN must be exactly 4 digits" }, { status: 400 });
    }

    // If user already has a PIN set, require the current one to change it
    if (user.pin_hash) {
      if (!currentPin || !verifyPin(currentPin, user.pin_hash)) {
        return NextResponse.json({ error: "Current PIN is incorrect" }, { status: 400 });
      }
    }

    const newHash = hashPin(pin);
    await setUserPin(user.id, newHash);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("set pin error:", err.message);
    return NextResponse.json({ error: "Could not set PIN" }, { status: 500 });
  }
}