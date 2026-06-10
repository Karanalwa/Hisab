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
    <div onClick={onClose} role="dialog" aria-label="Command palette" className="modal-bg" style={{ alignItems: "flex-start", paddingTop: "14vh" }}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: "100%", maxWidth: 560, padding: 0, overflow: "hidden", boxShadow: "0 20px 60px rgba(15,23,42,.18)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: "1px solid var(--line)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ color: "var(--mut)", flexShrink: 0 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setSel(0); }}
            onKeyDown={onKeyDown}
            placeholder="Type a page or action…"
            style={{ width: "100%", border: "none", fontSize: 15.5, outline: "none", background: "transparent", color: "var(--txt)" }}
          />
        </div>
        <div style={{ maxHeight: 380, overflow: "auto", padding: 6 }}>
          {filtered.map((c, i) => (
            <button
              key={c.id}
              onClick={() => run(i)}
              onMouseEnter={() => setSel(i)}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                padding: "11px 14px", borderRadius: 10, border: "none", cursor: "pointer", textAlign: "left",
                background: i === sel ? "var(--brand-soft)" : "transparent",
                color: "var(--txt)", fontSize: 14, fontWeight: 600,
                transition: "background .1s",
              }}
            >
              <span><span style={{ marginRight: 10, opacity: 0.55, fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".4px" }}>{c.hint}</span>{c.label}</span>
              {c.keys && <kbd style={kbd}>{c.keys}</kbd>}
            </button>
          ))}
          {!filtered.length && <div style={{ padding: 18, color: "var(--mut)", fontSize: 14 }}>No matches.</div>}
        </div>
      </div>
    </div>
  );
}

const kbd: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "var(--mut)", background: "#f1f5f9", border: "1px solid var(--line)", borderRadius: 6, padding: "2px 8px", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" };
