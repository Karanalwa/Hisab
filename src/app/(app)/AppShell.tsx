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
  { href: "/register", icon: "🧮", label: "Cash Register", keys: "g r" },
  { href: "/products", icon: "📦", label: "Products", keys: "g p" },
  { href: "/purchases", icon: "📥", label: "Stock In", keys: "g s" },
  { href: "/customers", icon: "👤", label: "Customers", keys: "g c" },
  { href: "/reports", icon: "📈", label: "Reports", keys: "g t" },
  { href: "/settings", icon: "⚙️", label: "Settings", keys: "g ," },
];

// g + letter -> destination
const GO: Record<string, string> = {
  d: "/dashboard", b: "/billing", i: "/invoices", u: "/dues", r: "/register",
  p: "/products", s: "/purchases", c: "/customers", t: "/reports", ",": "/settings",
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
        <div style={{ padding: "24px 20px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="/logo.svg" alt="Hisab" width={40} height={40} style={{ borderRadius: 12, display: "block" }} />
            <div>
              <b style={{ fontSize: 17, color: "#fff", display: "block", letterSpacing: 0.2 }}>Hisab</b>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>POS &amp; GST Invoicing</span>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "8px 12px", overflow: "auto" }}>
          {NAV.map((n) => {
            const active = path === n.href || path.startsWith(n.href + "/");
            return (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
                color: active ? "#fff" : "#94a3b8", fontSize: 13.5, fontWeight: 600,
                borderRadius: 10, marginBottom: 3, textDecoration: "none",
                background: active ? "rgba(14,165,233,.18)" : "transparent",
                border: active ? "1px solid rgba(14,165,233,.25)" : "1px solid transparent",
                transition: "all .15s ease",
              }} onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = "rgba(148,163,184,.10)";
              }} onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = "transparent";
              }}>
                <span style={{ fontSize: 16, width: 22, textAlign: "center" }}>{n.icon}</span>
                <span style={{ flex: 1 }}>{n.label}</span>
                <kbd style={{ fontSize: 10, fontWeight: 700, color: "#64748b", background: "rgba(148,163,184,.14)", borderRadius: 5, padding: "1px 5px" }}>{n.keys}</kbd>
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(148,163,184,.12)" }}>
          <button onClick={() => setHelpOpen(true)} style={{
            width: "100%", background: "rgba(148,163,184,.10)", color: "#94a3b8", border: "none",
            borderRadius: 9, padding: "9px", fontSize: 11.5, fontWeight: 600, cursor: "pointer",
            transition: "background .15s",
          }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(148,163,184,.16)"} onMouseLeave={(e) => e.currentTarget.style.background = "rgba(148,163,184,.10)"}>
            ⌨️ Shortcuts (press ?)
          </button>
        </div>
      </aside>

      <div className={"nav-backdrop" + (open ? " show" : "")} onClick={() => setOpen(false)} />

      <div className="main">
        <header className="topbar no-print">
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <button className="hamburger" aria-label="Menu (m)" onClick={() => setOpen(true)} style={{ borderRadius: 8, padding: 6, color: "var(--mut)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--txt)" }}>{shop.name}</div>
              <small style={{ color: "var(--mut)", fontSize: 11 }}>{shop.state}{shop.gstin ? " · " + shop.gstin : ""}</small>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setCmdOpen(true)} className="cmdk-btn" aria-label="Search (Ctrl+K)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <span>Search</span>
              <kbd style={{ fontSize: 11, fontWeight: 700, color: "var(--mut)", background: "#fff", border: "1px solid var(--line)", borderRadius: 5, padding: "1px 6px" }}>⌘K</kbd>
            </button>
            <form action={signOut}>
              <button className="btn btn-sm btn-ghost" type="submit">Sign out</button>
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
