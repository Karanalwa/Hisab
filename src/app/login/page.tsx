import { signIn } from "@/actions/auth";
import Link from "next/link";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; msg?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "linear-gradient(160deg, #0f172a, #1e293b 60%, #334155)" }}>
      <div className="card" style={{ width: "100%", maxWidth: 400, padding: 36 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img src="/logo.svg" alt="Hisab" width={52} height={52} style={{ borderRadius: 14, display: "inline-block", marginBottom: 14 }} />
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.3 }}>Hisab</h1>
          <p style={{ color: "var(--mut)", fontSize: 13.5, marginTop: 4 }}>POS &amp; GST Invoicing</p>
        </div>
        {sp.msg && <p style={{ background: "var(--green-soft)", color: "#047857", padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 16, fontWeight: 600 }}>{sp.msg}</p>}
        {sp.error && <p style={{ background: "var(--red-soft)", color: "#b91c1c", padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 16, fontWeight: 600 }}>{sp.error}</p>}
        <form action={signIn}>
          <label className="fld">Email</label>
          <input className="inp" name="email" type="email" required style={{ marginBottom: 14 }} />
          <label className="fld">Password</label>
          <input className="inp" name="password" type="password" required style={{ marginBottom: 22 }} />
          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} type="submit">Sign in</button>
        </form>
        <p style={{ textAlign: "center", fontSize: 13.5, marginTop: 18, color: "var(--mut)" }}>
          New shop? <Link href="/signup" style={{ color: "var(--brand)", fontWeight: 700, textDecoration: "none" }}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}
