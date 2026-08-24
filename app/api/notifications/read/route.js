import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/db";

export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

    const { id, all } = await req.json();

    if (all) {
      await markAllNotificationsRead(user.id);
    } else if (id) {
      await markNotificationRead(id);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("mark notification read error:", err.message);
    return NextResponse.json({ error: "Could not update notification" }, { status: 500 });
  }
}