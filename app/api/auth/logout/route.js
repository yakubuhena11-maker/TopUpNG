import { NextResponse } from "next/server";
import { logout } from "@/lib/auth";

export async function POST() {
  try {
    await logout();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("logout error:", err.message);
    return NextResponse.json({ error: "Could not log out" }, { status: 500 });
  }
}