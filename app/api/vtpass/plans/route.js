import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDataPlans } from "@/lib/vtpass";

export async function GET(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const network = searchParams.get("network");
    if (!network) return NextResponse.json({ error: "Missing network" }, { status: 400 });

    const plans = await getDataPlans(network);
    return NextResponse.json({ plans });
  } catch (err) {
    console.error("vtpass plans fetch error:", err.message);
    return NextResponse.json({ error: "Could not load data plans" }, { status: 500 });
  }
}
