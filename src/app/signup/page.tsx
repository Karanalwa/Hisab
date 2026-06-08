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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "linear-gradient(185deg,#211e54,#312e81 60%,#3b2f7a)" }}>
      <div className="card" style={{ width: 400, padding: 30 }}>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 30 }}>⚡</div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Create your shop</h1>
          <p style={{ color: "var(--mut)", fontSize: 13 }}>Start billing in minutes</p>
        </div>
        {sp.error && <p style={{ background: "#fee2e2", color: "#b91c1c", padding: "8px 12px", borderRadius: 10, fontSize: 13, marginBottom: 12 }}>{sp.error}</p>}
        <form action={signUp}>
          <label className="fld">Shop name</label>
          <input className="inp" name="shop_name" required style={{ marginBottom: 12 }} />
          <label className="fld">State (for GST)</label>
          <select className="inp" name="state" required style={{ marginBottom: 12 }} defaultValue="">
            <option value="" disabled>Select state…</option>
            {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <label className="fld">Email</label>
          <input className="inp" name="email" type="email" required style={{ marginBottom: 12 }} />
          <label className="fld">Password</label>
          <input className="inp" name="password" type="password" minLength={6} required style={{ marginBottom: 18 }} />
          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} type="submit">Create account</button>
        </form>
        <p style={{ textAlign: "center", fontSize: 13, marginTop: 16, color: "var(--mut)" }}>
          Already have an account? <Link href="/login" style={{ color: "var(--indigo)", fontWeight: 700 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
