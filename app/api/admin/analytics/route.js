import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAdminAnalytics } from "@/lib/admin-db";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(await getAdminAnalytics());
}
