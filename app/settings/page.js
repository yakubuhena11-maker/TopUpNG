import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import SettingsForm from "./SettingsForm";

function initials(name, phone) {
  if (name) return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  return phone.slice(-2);
}

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="wrap main-pad">
      <div style={{ paddingTop: 24 }}>
        <div className="wordmark">
          top<span>up</span>ng
        </div>
        <div className="profile-row" style={{ marginTop: 20 }}>
          <div className="avatar">{initials(user.name, user.phone)}</div>
          <div>
            <div className="name">{user.name || "Add your name"}</div>
            <div className="phone">{user.phone}</div>
          </div>
        </div>

        <SettingsForm user={user} />
      </div>
    </div>
  );
  }
