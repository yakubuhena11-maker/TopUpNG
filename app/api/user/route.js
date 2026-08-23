import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { updateUser, listTransactions } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const recent = await listTransactions(user.id, 10);
  return NextResponse.json({ user, recent });
}

export async function PATCH(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { name, email } = await req.json();
  const updated = await updateUser(user.id, { name, email });
  return NextResponse.json({ user: updated });
}