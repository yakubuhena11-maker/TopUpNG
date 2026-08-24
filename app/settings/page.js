import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="wrap main-pad">
      <div style={{ paddingTop: 24 }}>
        <div className="wordmark">
          top<span>up</span>ng
        </div>

        <SettingsForm user={user} />
      </div>
    </div>
  );
}