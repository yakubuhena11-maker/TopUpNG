import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import ReferralStats from "./ReferralStats";

export default async function ReferralPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="wrap main-pad">
      <div style={{ paddingTop: 24 }}>
        <div className="wordmark">
          top<span>up</span>ng
        </div>
        <h1>Invite & earn.</h1>
        <p className="sub">
          Share your code — you get rewarded every time someone signs up with it.
        </p>

        <ReferralStats referralCode={user.referral_code} />
      </div>
    </div>
  );
  }
