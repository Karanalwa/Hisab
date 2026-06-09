"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/actions/auth";
import { CommandPalette, type Command } from "./CommandPalette";
import { ShortcutsHelp } from "./ShortcutsHelp";

const NAV = [
  { href: "/dashboard", icon: "📊", label: "Dashboard", keys: "g d" },
  { href: "/billing", icon: "💳", label: "Billing", keys: "g b" },
  { href: "/invoices", icon: "📄", label: "Invoices", keys: "g i" },
  { href: "/dues", icon: "💰", label: "Dues & Payments", keys: "g u" },
  { href: "/products", icon: "📦", label: "Products", keys: "g p" },
  { href: "/purchases", icon: "📥", label: "Stock In", keys: "g s" },
  { href: "/customers", icon: "👤", label: "Customers", keys: "g c" },
  { href: "/reports", icon: "📈", label: "Reports", keys: "g r" },
  { href: "/settings", icon: "⚙️", label: "Settings", keys: "g ," },
];

// g + letter -> destination
const GO: Record<string, string> = {
  d: "/dashboard", b: "/billing", i: "/invoices", u: "/dues",
  p: "/products", s: "/purchases", c: "/customers", r: "/reports", ",": "/settings",
};

function isTyping() {
  const el = document.activeElement as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
}

export default function AppShell({
  shop,
  children,
}: {
  shop: { name: string; state: string; gstin: string };
  children: React.ReactNode;
}) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [path]);

  const commands: Command[] = useMemo(() => [
    ...NAV.map((n) => ({ id: n.href, label: n.label, hint: "Go to", keys: n.keys, perform: () => router.push(n.href) })),
    { id: "new", label: "New Invoice", hint: "Action", keys: "n", perform: () => router.push("/billing") },
    { id: "menu", label: "Toggle Menu", hint: "Action", keys: "m", perform: () => setOpen((o) => !o) },
    { id: "help", label: "Keyboard Shortcuts", hint: "Action", keys: "?", perform: () => setHelpOpen(true) },
    { id: "signout", label: "Sign Out", hint: "Action", perform: () => { signOut(); } },
  ], [router]);

  const onKey = useCallback((e: KeyboardEvent) => {
    // command palette toggle works everywhere
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      setCmdOpen((p) => !p);
      return;
    }
    if (e.key === "Escape") {
      setCmdOpen(false); setHelpOpen(false); setOpen(false);
      return;
    }
    // while an overlay is open, or while typing, don't fire letter shortcuts
    if (cmdOpen || helpOpen || isTyping()) return;

    if (e.key === "?") { e.preventDefault(); setHelpOpen(true); return; }
    if (e.key === "/") {
      const s = document.querySelector<HTMLInputElement>('input[placeholder*="Search" i]');
      if (s) { e.preventDefault(); s.focus(); }
      return;
    }
    if (e.key.toLowerCase() === "m") { setOpen((o) => !o); return; }
    if (e.key.toLowerCase() === "n") { router.push("/billing"); return; }

    // g then a letter
    if (e.key.toLowerCase() === "g") {
      const handler = (e2: KeyboardEvent) => {
        const dest = GO[e2.key.toLowerCase()];
        if (dest) { e2.preventDefault(); router.push(dest); }
        window.removeEventListener("keydown", handler, true);
        clearTimeout(timer);
      };
      const timer = setTimeout(() => window.removeEventListener("keydown", handler, true), 1000);
      window.addEventListener("keydown", handler, true);
    }
  }, [cmdOpen, helpOpen, router]);

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

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
                <span style={{ flex: 1 }}>{n.label}</span>
                <kbd style={{ fontSize: 10, fontWeight: 700, color: "#a6a9d8", background: "rgba(255,255,255,.08)", borderRadius: 5, padding: "1px 5px" }}>{n.keys}</kbd>
              </Link>
            );
          })}
        </nav>
        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,.09)" }}>
          <button onClick={() => setHelpOpen(true)} style={{ width: "100%", background: "rgba(255,255,255,.06)", color: "#b9bce4", border: "none", borderRadius: 9, padding: "8px", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>
            ⌨️ Shortcuts (press ?)
          </button>
        </div>
      </aside>

      <div className={"nav-backdrop" + (open ? " show" : "")} onClick={() => setOpen(false)} />

      <div className="main">
        <header className="topbar no-print">
          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            <button className="hamburger" aria-label="Menu (m)" onClick={() => setOpen(true)}>☰</button>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{shop.name}</div>
              <small style={{ color: "var(--mut)", fontSize: 11 }}>{shop.state}{shop.gstin ? " · " + shop.gstin : ""}</small>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setCmdOpen(true)} className="cmdk-btn" aria-label="Search (Ctrl+K)">
              <span>🔍 Search</span>
              <kbd style={{ fontSize: 11, fontWeight: 700, color: "var(--mut)", background: "#fff", border: "1px solid var(--line)", borderRadius: 5, padding: "1px 6px" }}>⌘K</kbd>
            </button>
            <form action={signOut}>
              <button className="btn btn-sm" type="submit">Sign out</button>
            </form>
          </div>
        </header>
        <main className="content-pad">{children}</main>
      </div>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} commands={commands} />
      <ShortcutsHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
