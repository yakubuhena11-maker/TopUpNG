import { NextResponse } from "next/server";
import { getPasswordUserByPhone } from "@/lib/password-auth-db";
import { normalizePhone, createUserSession } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";

export async function POST(req) {
  try {
    const { phone, password } = await req.json();
    const user = await getPasswordUserByPhone(normalizePhone(phone));
    if (!user || user.is_active === false || !verifyPassword(password, user.password)) {
      return NextResponse.json({ error: "Invalid phone number or password" }, { status: 401 });
    }
    await createUserSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("login error:", err);
    return NextResponse.json({ error: "Could not log in" }, { status: 500 });
  }
}
