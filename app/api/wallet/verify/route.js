import { NextResponse } from "next/server";
import { getWalletTx, updateWalletTxStatus, adjustWalletBalance } from "@/lib/db";
import { verifyPayment } from "@/lib/paystack";

export async function POST(req) {
  try {
    const { reference } = await req.json();
    const tx = getWalletTx(reference);
    if (!tx) return NextResponse.json({ error: "Unknown reference" }, { status: 404 });
    if (tx.status === "success") return NextResponse.json({ ok: true, already: true });

    const result = await verifyPayment(reference);
    if (result.data.status !== "success") {
      updateWalletTxStatus(reference, "failed");
      return NextResponse.json({ error: "Payment not successful" }, { status: 400 });
    }

    updateWalletTxStatus(reference, "success");
    const user = adjustWalletBalance(tx.user_id, tx.amount);

    return NextResponse.json({ ok: true, wallet_balance: user.wallet_balance });
  } catch (err) {
    console.error("wallet verify error:", err.response?.data || err.message);
    return NextResponse.json({ error: "Could not verify payment" }, { status: 500 });
  }
                                     }
