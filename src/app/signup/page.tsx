import { signUp } from "@/actions/auth";
import { INDIAN_STATES } from "@/lib/states";
import Link from "next/link";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "linear-gradient(160deg, #0f172a, #1e293b 60%, #334155)" }}>
      <div className="card" style={{ width: "100%", maxWidth: 420, padding: 36 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img src="/logo.svg" alt="Hisab" width={52} height={52} style={{ borderRadius: 14, display: "inline-block", marginBottom: 14 }} />
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.3 }}>Create your shop</h1>
          <p style={{ color: "var(--mut)", fontSize: 13.5, marginTop: 4 }}>Start billing in minutes</p>
        </div>
        {sp.error && <p style={{ background: "var(--red-soft)", color: "#b91c1c", padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 16, fontWeight: 600 }}>{sp.error}</p>}
        <form action={signUp}>
          <label className="fld">Shop name</label>
          <input className="inp" name="shop_name" required style={{ marginBottom: 14 }} />
          <label className="fld">State (for GST)</label>
          <select className="inp" name="state" required style={{ marginBottom: 14 }} defaultValue="">
            <option value="" disabled>Select state…</option>
            {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <label className="fld">Email</label>
          <input className="inp" name="email" type="email" required style={{ marginBottom: 14 }} />
          <label className="fld">Password</label>
          <input className="inp" name="password" type="password" minLength={6} required style={{ marginBottom: 22 }} />
          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} type="submit">Create account</button>
        </form>
        <p style={{ textAlign: "center", fontSize: 13.5, marginTop: 18, color: "var(--mut)" }}>
          Already have an account? <Link href="/login" style={{ color: "var(--brand)", fontWeight: 700, textDecoration: "none" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
