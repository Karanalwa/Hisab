"use client";

const GROUPS: { title: string; items: [string, string][] }[] = [
  {
    title: "General",
    items: [
      ["Ctrl / ⌘ + K", "Open command palette"],
      ["?", "Show this help"],
      ["/", "Focus the search box on the page"],
      ["m", "Open / close the menu"],
      ["n", "New invoice (Billing)"],
      ["a", "Add new (product / customer / stock) on the current page"],
      ["Esc", "Close any dialog"],
    ],
  },
  {
    title: "Go to (press g, then…)",
    items: [
      ["g d", "Dashboard"],
      ["g b", "Billing"],
      ["g i", "Invoices"],
      ["g u", "Dues & Payments"],
      ["g r", "Cash Register"],
      ["g p", "Products"],
      ["g s", "Stock In"],
      ["g c", "Customers"],
      ["g t", "Reports"],
      ["g ,", "Settings"],
    ],
  },
];

export function ShortcutsHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div onClick={onClose} role="dialog" aria-label="Keyboard shortcuts" className="modal-bg">
      <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: "100%", maxWidth: 580, padding: 28, maxHeight: "85vh", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontWeight: 800, fontSize: 18, letterSpacing: -0.2 }}>⌨️ Keyboard Shortcuts</h3>
          <button className="btn btn-sm" onClick={onClose}>Close (Esc)</button>
        </div>
        <div className="row-2" style={{ gap: 24 }}>
          {GROUPS.map((g) => (
            <div key={g.title}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--mut)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 12 }}>{g.title}</div>
              {g.items.map(([k, label]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "7px 0", fontSize: 13.5 }}>
                  <span style={{ color: "var(--txt)" }}>{label}</span>
                  <kbd style={kbd}>{k}</kbd>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const kbd: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "var(--txt)", background: "#f1f5f9", border: "1px solid var(--line)", borderRadius: 6, padding: "3px 8px", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", whiteSpace: "nowrap" };
