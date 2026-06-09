"use client";
import { useEffect, useRef, useState } from "react";

export type Command = { id: string; label: string; hint?: string; keys?: string; perform: () => void };

export function CommandPalette({ open, onClose, commands }: { open: boolean; onClose: () => void; commands: Command[] }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = commands.filter((c) => c.label.toLowerCase().includes(q.toLowerCase()) || (c.hint || "").toLowerCase().includes(q.toLowerCase()));

  useEffect(() => {
    if (open) {
      setQ("");
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  useEffect(() => {
    if (sel >= filtered.length) setSel(0);
  }, [filtered.length, sel]);

  if (!open) return null;

  function run(i: number) {
    const c = filtered[i];
    if (!c) return;
    onClose();
    c.perform();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); run(sel); }
    else if (e.key === "Escape") { e.preventDefault(); onClose(); }
  }

  return (
    <div onClick={onClose} role="dialog" aria-label="Command palette" style={{ position: "fixed", inset: 0, background: "rgba(28,26,58,.4)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 60, padding: "12vh 16px 16px" }}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: "100%", maxWidth: 540, padding: 0, overflow: "hidden" }}>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => { setQ(e.target.value); setSel(0); }}
          onKeyDown={onKeyDown}
          placeholder="Type a page or action…  (↑↓ to move, Enter to run, Esc to close)"
          style={{ width: "100%", padding: "16px 18px", border: "none", borderBottom: "1px solid var(--line)", fontSize: 15, outline: "none", background: "#fff", color: "var(--txt)" }}
        />
        <div style={{ maxHeight: 360, overflow: "auto", padding: 8 }}>
          {filtered.map((c, i) => (
            <button
              key={c.id}
              onClick={() => run(i)}
              onMouseEnter={() => setSel(i)}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                padding: "11px 14px", borderRadius: 10, border: "none", cursor: "pointer", textAlign: "left",
                background: i === sel ? "linear-gradient(135deg,rgba(99,102,241,.14),rgba(139,92,246,.10))" : "transparent",
                color: "var(--txt)", fontSize: 14, fontWeight: 600,
              }}
            >
              <span><span style={{ marginRight: 10, opacity: 0.6, fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>{c.hint}</span>{c.label}</span>
              {c.keys && <kbd style={kbd}>{c.keys}</kbd>}
            </button>
          ))}
          {!filtered.length && <div style={{ padding: 16, color: "var(--mut)", fontSize: 14 }}>No matches.</div>}
        </div>
      </div>
    </div>
  );
}

const kbd: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "var(--mut)", background: "#f4f5fd", border: "1px solid var(--line)", borderRadius: 6, padding: "2px 7px", fontFamily: "ui-monospace, monospace" };
