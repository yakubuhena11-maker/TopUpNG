import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getCurrentUser } from "@/lib/auth";
import { createWalletTx } from "@/lib/db";
import { initializePayment } from "@/lib/paystack";

export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Please log in first" }, { status: 401 });

    const { amount } = await req.json();
    const amountNaira = Number(amount);
    if (!Number.isFinite(amountNaira) || amountNaira <= 0) {
      return NextResponse.json({ error: "Enter a valid funding amount" }, { status: 400 });
    }

    const amountKobo = Math.round(amountNaira * 100);
    const feePercent = Number((await import("@/lib/db")).getSetting ? await (await import("@/lib/db")).getSetting("wallet_funding_fee_percent") : 0);
    const feeKobo = Math.round(amountKobo * (Number.isFinite(feePercent) ? feePercent : 0) / 100);
    const totalKobo = amountKobo + feeKobo;
    const id = uuidv4();
    const reference = `WALLET-${Date.now()}-${id.slice(0, 8)}`;

    await createWalletTx({
      id,
      user_id: user.id,
      type: "funding",
      amount: amountKobo,
      reference,
      description: `Wallet funding of ₦${amountNaira.toFixed(2)}${feeKobo ? ` plus ${feePercent}% fee` : ""}`,
    });

    const payment = await initializePayment({
      email: user.email || `${user.phone}@topupng.com`,
      amountNaira: totalKobo / 100,
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?funded=${reference}`,
    });

    return NextResponse.json({
      reference,
      authorization_url: payment.data.authorization_url,
    });
  } catch (err) {
    console.error("wallet funding error:", err.response?.data || err.message);
    return NextResponse.json({ error: "Could not start wallet funding" }, { status: 500 });
  }
}
