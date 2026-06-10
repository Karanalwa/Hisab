import { createClient } from "@/lib/supabase/server";
import { money, fmtDate } from "@/lib/gst";
import ExpensesClient from "./ExpensesClient";
import type { Expense } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const from = sp.from || "";
  const to = sp.to || "";
  const category = sp.category || "";

  const supabase = await createClient();
  let query = supabase.from("expenses").select("*").order("date", { ascending: false });
  if (from) query = query.gte("date", from);
  if (to) query = query.lte("date", to);
  if (category) query = query.eq("category", category);

  const { data } = await query;
  const list = (data || []) as Expense[];
  const total = list.reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, letterSpacing: -0.3 }}>Expenses</h2>
        <p style={{ color: "var(--mut)", fontSize: 13.5 }}>Track business spending by category</p>
      </div>

      <div className="card" style={{ padding: 18, marginBottom: 20, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--red)" }}>{money(total)}</div>
        <div style={{ fontSize: 12, color: "var(--mut)", fontWeight: 600 }}>TOTAL IN RANGE</div>
      </div>

      <ExpensesClient expenses={list} from={from} to={to} category={category} />
    </div>
  );
}
