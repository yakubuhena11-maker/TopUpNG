import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { createTransaction, adjustWalletBalance, getSetting } from "@/lib/db";
import { initializePayment } from "@/lib/paystack";
import { getCurrentUser } from "@/lib/auth";
import { verifyPin } from "@/lib/pin";

export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Please log in first" }, { status: 401 });

    const body = await req.json();
    const { phone, network, type, plan_code, amount, payment_method, pin } = body;

    if (!phone || !network || !type || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Require PIN only if the user has set one
    if (user.pin_hash) {
      if (!pin || !verifyPin(pin, user.pin_hash)) {
        return NextResponse.json({ error: "Incorrect PIN" }, { status: 400 });
      }
    }

    const markupPercent = parseFloat((await getSetting("purchase_markup_percent")) || "0");
    const baseAmount = amount;
    const finalAmount = amount * (1 + markupPercent / 100);

    const id = uuidv4();
    const reference = `TOPUP-${Date.now()}-${id.slice(0, 8)}`;
    const baseAmountKobo = Math.round(baseAmount * 100);
    const amountKobo = Math.round(finalAmount * 100);

    if (payment_method === "wallet") {
      if (user.wallet_balance < amountKobo) {
        return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 400 });
      }
      await createTransaction({
        id, user_id: user.id, reference, phone,
        email: user.email || null, network, type,
        plan_code: plan_code || null, base_amount: baseAmountKobo, amount: amountKobo,
        payment_method: "wallet",
      });
      await adjustWalletBalance(user.id, -amountKobo);
      return NextResponse.json({ reference, ok: true });
    }

    await createTransaction({
      id, user_id: user.id, reference, phone,
      email: user.email || `${user.phone}@topupng.com`, network, type,
      plan_code: plan_code || null, base_amount: baseAmountKobo, amount: amountKobo,
      payment_method: "paystack",
    });

    const payment = await initializePayment({
      email: user.email || `${user.phone}@topupng.com`,
      amountNaira: finalAmount,
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?paid=${reference}`,
    });

    return NextResponse.json({ reference, authorization_url: payment.data.authorization_url });
  } catch (err) {
    console.error("create transaction error:", err.response?.data || err.message);
    return NextResponse.json({ error: "Could not start transaction" }, { status: 500 });
  }
}