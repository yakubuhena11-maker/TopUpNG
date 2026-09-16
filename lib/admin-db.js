import { sql } from "@vercel/postgres";
import { initDb } from "@/lib/db";

async function prepareAdminSchema() {
  await initDb();
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true`;
}

export async function listAdminUsers() {
  await prepareAdminSchema();
  const { rows } = await sql`
    SELECT id, phone, name, wallet_balance, role, is_active, created_at
    FROM users ORDER BY created_at DESC
  `;
  return rows;
}

export async function updateAdminUser(id, { name, phone, wallet_balance, is_active }) {
  await prepareAdminSchema();
  const balance = Number(wallet_balance);
  if (!Number.isFinite(balance) || balance < 0) throw new Error("Invalid wallet balance");
  const { rows } = await sql`
    UPDATE users
    SET name = ${String(name || "").trim() || null},
        phone = ${String(phone || "").replace(/\D/g, "")},
        wallet_balance = ${Math.round(balance)},
        is_active = ${Boolean(is_active)}
    WHERE id = ${id}
    RETURNING id, phone, name, wallet_balance, role, is_active, created_at
  `;
  return rows[0] || null;
}

export async function getAdminAnalytics() {
  await prepareAdminSchema();
  const [summary, byType, byNetwork, trend, topUsers] = await Promise.all([
    sql`SELECT
      COALESCE(SUM(amount - base_amount) FILTER (WHERE status = 'success'), 0) AS markup_revenue,
      COALESCE(SUM(amount) FILTER (WHERE status = 'success'), 0) AS purchase_volume,
      COUNT(*) FILTER (WHERE status = 'success') AS successful_purchases
      FROM transactions`,
    sql`SELECT type, COUNT(*)::int AS count, COALESCE(SUM(amount), 0) AS volume
      FROM transactions WHERE status = 'success' GROUP BY type ORDER BY count DESC`,
    sql`SELECT network, COUNT(*)::int AS count, COALESCE(SUM(amount), 0) AS volume
      FROM transactions WHERE status = 'success' GROUP BY network ORDER BY count DESC`,
    sql`SELECT day::date AS day, transaction_count, revenue FROM (
      SELECT date_trunc('day', created_at) AS day,
        COUNT(*)::int AS transaction_count,
        COALESCE(SUM(amount - base_amount), 0) AS revenue
      FROM transactions WHERE status = 'success' AND created_at >= now() - interval '14 days'
      GROUP BY date_trunc('day', created_at)
    ) daily ORDER BY day ASC`,
    sql`SELECT u.id, COALESCE(u.name, u.phone) AS name, u.phone,
      COUNT(t.id)::int AS transaction_count, COALESCE(SUM(t.amount), 0) AS volume
      FROM users u JOIN transactions t ON t.user_id = u.id AND t.status = 'success'
      GROUP BY u.id, u.name, u.phone ORDER BY volume DESC LIMIT 10`,
  ]);
  const fee = await sql`SELECT COALESCE(SUM(amount), 0) AS funding_volume FROM wallet_transactions WHERE status = 'success'`;
  const settings = await sql`SELECT key, value FROM settings WHERE key = 'wallet_funding_fee_percent'`;
  const feePercent = Number(settings.rows[0]?.value || 0);
  const fundingVolume = Number(fee.rows[0]?.funding_volume || 0);
  return {
    summary: {
      markupRevenue: Number(summary.rows[0].markup_revenue || 0),
      fundingFeeRevenue: Math.round(fundingVolume * feePercent / 100),
      fundingVolume,
      purchaseVolume: Number(summary.rows[0].purchase_volume || 0),
      successfulPurchases: Number(summary.rows[0].successful_purchases || 0),
    },
    byType: byType.rows,
    byNetwork: byNetwork.rows,
    trend: trend.rows,
    topUsers: topUsers.rows,
  };
}
