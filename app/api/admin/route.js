import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { countUsers, countTransactions, listUsers, listAdminTransactions, getAllSettings } from "@/lib/db";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [users, transactions, userCount, transactionCount, settings] = await Promise.all([
    listUsers(10), listAdminTransactions(10), countUsers(), countTransactions(), getAllSettings(),
  ]);
  return NextResponse.json({ stats: { users: userCount, transactions: transactionCount }, users, transactions, settings });
}
