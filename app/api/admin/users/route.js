import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { listAdminUsers, updateAdminUser } from "@/lib/admin-db";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ users: await listAdminUsers() });
}

export async function PATCH(req) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await req.json();
    const user = await updateAdminUser(body.id, body);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ ok: true, user });
  } catch (err) { return NextResponse.json({ error: err.message }, { status: 400 }); }
}
