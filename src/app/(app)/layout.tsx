import { redirect } from "next/navigation";
import Sidebar from "./Sidebar";
import { getShop } from "@/lib/shop";
import { signOut } from "@/actions/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const shop = await getShop();
  if (!shop) redirect("/login");

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ marginLeft: 236, flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header className="no-print" style={{ background: "rgba(255,255,255,.85)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--line)", padding: "13px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 15 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>{shop.name}</div>
            <small style={{ color: "var(--mut)", fontSize: 11 }}>{shop.state}{shop.gstin ? " · " + shop.gstin : ""}</small>
          </div>
          <form action={signOut}>
            <button className="btn btn-sm" type="submit">Sign out</button>
          </form>
        </header>
        <main style={{ padding: "24px 28px", flex: 1 }}>{children}</main>
      </div>
    </div>
  );
}
