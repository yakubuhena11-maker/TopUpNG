import { sql } from "@vercel/postgres";
import { initDb } from "@/lib/db";

async function prepare() {
  await initDb();
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true`;
}

export async function listAdminUsers() {
  await prepare();
  const { rows } = await sql`SELECT id, phone, name, wallet_balance, role, is_active, created_at FROM users ORDER BY created_at DESC`;
  return rows;
}

export async function updateAdminUser(id, values) {
  await prepare();
  const phone = String(values.phone || "").replace(/\D/g, "");
  const balance = Number(values.wallet_balance);
  if (!phone || phone.length < 10) throw new Error("Enter a valid phone number");
  if (!Number.isFinite(balance) || balance < 0) throw new Error("Invalid wallet balance");
  const { rows } = await sql`
    UPDATE users SET name = ${String(values.name || "").trim() || null}, phone = ${phone},
      wallet_balance = ${Math.round(balance)}, is_active = ${Boolean(values.is_active)}
    WHERE id = ${id}
    RETURNING id, phone, name, wallet_balance, role, is_active, created_at
  `;
  return rows[0] || null;
}

export async function adminAnalytics() {
  await prepare();
  const [summary, funding, types, networks, trend, topUsers] = await Promise.all([
    sql`SELECT COALESCE(SUM(amount - base_amount) FILTER (WHERE status = 'success'), 0) AS markup_revenue,
      COALESCE(SUM(amount) FILTER (WHERE status = 'success'), 0) AS purchase_volume,
      COUNT(*) FILTER (WHERE status = 'success') AS purchase_count FROM transactions`,
    sql`SELECT COALESCE(SUM(amount), 0) AS volume FROM wallet_transactions WHERE status = 'success'`,
    sql`SELECT type, COUNT(*)::int AS count, COALESCE(SUM(amount), 0) AS volume FROM transactions WHERE status = 'success' GROUP BY type ORDER BY count DESC`,
    sql`SELECT network, COUNT(*)::int AS count, COALESCE(SUM(amount), 0) AS volume FROM transactions WHERE status = 'success' GROUP BY network ORDER BY count DESC`,
    sql`SELECT date_trunc('day', created_at)::date AS day, COUNT(*)::int AS count, COALESCE(SUM(amount - base_amount), 0) AS revenue FROM transactions WHERE status = 'success' AND created_at >= now() - interval '14 days' GROUP BY date_trunc('day', created_at) ORDER BY day`,
    sql`SELECT u.name, u.phone, COUNT(t.id)::int AS count, COALESCE(SUM(t.amount), 0) AS volume FROM users u JOIN transactions t ON t.user_id = u.id AND t.status = 'success' GROUP BY u.id, u.name, u.phone ORDER BY volume DESC LIMIT 10`,
  ]);
  const feePercent = Number((await sql`SELECT value FROM settings WHERE key = 'wallet_funding_fee_percent'`).rows[0]?.value || 0);
  const fundingVolume = Number(funding.rows[0].volume || 0);
  return { summary: { markupRevenue: Number(summary.rows[0].markup_revenue || 0), purchaseVolume: Number(summary.rows[0].purchase_volume || 0), fundingVolume, fundingFeeRevenue: Math.round(fundingVolume * feePercent / 100), purchaseCount: Number(summary.rows[0].purchase_count || 0) }, types: types.rows, networks: networks.rows, trend: trend.rows, topUsers: topUsers.rows };
}
