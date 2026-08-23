import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getCurrentUser } from "@/lib/auth";
import { setUserAvatar } from "@/lib/db";

export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    if (file.size > 3 * 1024 * 1024) {
      return NextResponse.json({ error: "Image must be under 3MB" }, { status: 400 });
    }

    const blob = await put(`avatars/${user.id}-${Date.now()}.jpg`, file, {
      access: "public",
    });

    await setUserAvatar(user.id, blob.url);

    return NextResponse.json({ ok: true, url: blob.url });
  } catch (err) {
    console.error("avatar upload error:", err.message);
    return NextResponse.json({ error: "Could not upload image" }, { status: 500 });
  }
}