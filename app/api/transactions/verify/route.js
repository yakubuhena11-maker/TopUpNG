import { NextResponse } from "next/server";
import { getTransaction, updateTransactionStatus, getSetting } from "@/lib/db";
import { verifyPayment } from "@/lib/paystack";
import { purchaseAirtime, purchaseData } from "@/lib/vtpass";

export async function POST(req) {
  try {
    const { reference } = await req.json();
    const tx = await getTransaction(reference);
    if (!tx) return NextResponse.json({ error: "Unknown reference" }, { status: 404 });

    if (tx.status === "success") {
      return NextResponse.json({ ok: true, already: true, transaction: tx });
    }

    // Wallet payments are already confirmed at creation time
    if (tx.payment_method !== "wallet") {
      const result = await verifyPayment(reference);
      if (result.data.status !== "success") {
        await updateTransactionStatus(reference, "failed");
        return NextResponse.json({ error: "Payment not successful" }, { status: 400 });
      }
    }

    // Deliver the actual data/airtime via VTpass
    const baseAmountNaira = tx.base_amount / 100;
    let vtpassResult;
    try {
      if (tx.type === "airtime") {
        vtpassResult = await purchaseAirtime({
          requestId: tx.reference,
          phone: tx.phone,
          network: tx.network,
          amountNaira: baseAmountNaira,
        });
      } else {
        vtpassResult = await purchaseData({
          requestId: tx.reference,
          phone: tx.phone,
          network: tx.network,
          variationCode: tx.plan_code,
        });
      }
    } catch (vtErr) {
      console.error("vtpass delivery error:", vtErr.response?.data || vtErr.message);
      await updateTransactionStatus(reference, "failed");
      return NextResponse.json({ error: "Payment received but delivery failed — contact support" }, { status: 500 });
    }

    await updateTransactionStatus(reference, "success", {
      vtpass_ref: vtpassResult?.content?.transactions?.transactionId || null,
    });

    return NextResponse.json({ ok: true, transaction: await getTransaction(reference) });
  } catch (err) {
    console.error("transaction verify error:", err.response?.data || err.message);
    return NextResponse.json({ error: "Could not verify transaction" }, { status: 500 });
  }
}