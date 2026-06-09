"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/actions/auth";

const NAV = [
  { href: "/dashboard", icon: "📊", label: "Dashboard" },
  { href: "/billing", icon: "💳", label: "Billing" },
  { href: "/invoices", icon: "📄", label: "Invoices" },
  { href: "/dues", icon: "💰", label: "Dues & Payments" },
  { href: "/products", icon: "📦", label: "Products" },
  { href: "/purchases", icon: "📥", label: "Stock In" },
  { href: "/customers", icon: "👤", label: "Customers" },
  { href: "/reports", icon: "📈", label: "Reports" },
  { href: "/settings", icon: "⚙️", label: "Settings" },
];

export default function AppShell({
  shop,
  children,
}: {
  shop: { name: string; state: string; gstin: string };
  children: React.ReactNode;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  // close the drawer whenever the route changes
  useEffect(() => {
    setOpen(false);
  }, [path]);

  return (
    <div className="shell">
      <aside className={"side no-print" + (open ? " open" : "")}>
        <div style={{ padding: "22px 20px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div style={{ width: 42, height: 42, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, background: "linear-gradient(135deg,#fbbf24,#f59e0b)", boxShadow: "0 6px 18px rgba(245,158,11,.55)" }}>⚡</div>
            <div>
              <b style={{ fontSize: 18, color: "#fff", display: "block" }}>Hisab</b>
              <span style={{ fontSize: 11, color: "#a6a9d8" }}>POS &amp; GST Invoicing</span>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: "10px 12px", overflow: "auto" }}>
          {NAV.map((n) => {
            const active = path === n.href || path.startsWith(n.href + "/");
            return (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                color: active ? "#fff" : "#b9bce4", fontSize: 13.5, fontWeight: 600,
                borderRadius: 12, marginBottom: 4, textDecoration: "none",
                background: active ? "linear-gradient(135deg,rgba(255,255,255,.22),rgba(255,255,255,.08))" : "transparent",
              }}>
                <span style={{ fontSize: 16, width: 22, textAlign: "center" }}>{n.icon}</span>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div style={{ padding: "14px 20px", fontSize: 11, color: "#7c80b5", borderTop: "1px solid rgba(255,255,255,.09)" }}>
          Hisab · Cloud
        </div>
      </aside>

      <div className={"nav-backdrop" + (open ? " show" : "")} onClick={() => setOpen(false)} />

      <div className="main">
        <header className="topbar no-print">
          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            <button className="hamburger" aria-label="Menu" onClick={() => setOpen(true)}>☰</button>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{shop.name}</div>
              <small style={{ color: "var(--mut)", fontSize: 11 }}>{shop.state}{shop.gstin ? " · " + shop.gstin : ""}</small>
            </div>
          </div>
          <form action={signOut}>
            <button className="btn btn-sm" type="submit">Sign out</button>
          </form>
        </header>
        <main className="content-pad">{children}</main>
      </div>
    </div>
  );
}
