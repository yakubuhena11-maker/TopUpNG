import axios from "axios";

const paystack = axios.create({
  baseURL: "https://api.paystack.co",
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

export async function initializePayment({ email, amountNaira, reference, callback_url }) {
  const res = await paystack.post("/transaction/initialize", {
    email,
    amount: Math.round(amountNaira * 100),
    reference,
    callback_url,
  });
  return res.data;
}

export async function verifyPayment(reference) {
  const res = await paystack.get(`/transaction/verify/${reference}`);
  return res.data;
}

export default paystack;
