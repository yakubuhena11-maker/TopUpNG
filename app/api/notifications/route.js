import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listNotifications, countUnreadNotifications } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

    const notifications = await listNotifications(user.id);
    const unreadCount = await countUnreadNotifications(user.id);

    return NextResponse.json({ notifications, unreadCount });
  } catch (err) {
    console.error("list notifications error:", err.message);
    return NextResponse.json({ error: "Could not load notifications" }, { status: 500 });
  }
}