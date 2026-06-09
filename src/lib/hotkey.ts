"use client";
import { useEffect } from "react";

function isTyping() {
  const el = document.activeElement as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
}

/**
 * Fire `handler` when a single key is pressed (no modifiers), unless the user is
 * typing in a field or `enabled` is false. Used for page-level actions like "a" = Add.
 */
export function useHotkey(key: string, handler: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (isTyping()) return;
      if (e.key.toLowerCase() === key.toLowerCase()) {
        e.preventDefault();
        handler();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [key, handler, enabled]);
}

/** Small inline keyboard-hint badge used on buttons. */
export const kbdHint: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  background: "rgba(255,255,255,.25)",
  borderRadius: 5,
  padding: "1px 5px",
  marginLeft: 2,
};
