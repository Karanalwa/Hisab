import { signIn } from "@/actions/auth";
import Link from "next/link";
import { ReactNode } from "react";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; msg?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "linear-gradient(185deg,#211e54,#312e81 60%,#3b2f7a)" }}>
      <div className="card" style={{ width: 380, padding: 30 }}>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 30 }}>⚡</div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Hisab</h1>
          <p style={{ color: "var(--mut)", fontSize: 13 }}>POS &amp; GST Invoicing</p>
        </div>
        {sp.msg && <p style={{ background: "#d1fae5", color: "#047857", padding: "8px 12px", borderRadius: 10, fontSize: 13, marginBottom: 12 }}>{sp.msg}</p>}
        {sp.error && <p style={{ background: "#fee2e2", color: "#b91c1c", padding: "8px 12px", borderRadius: 10, fontSize: 13, marginBottom: 12 }}>{sp.error}</p>}
        <form action={signIn}>
          <label className="fld">Email</label>
          <input className="inp" name="email" type="email" required style={{ marginBottom: 12 }} />
          <label className="fld">Password</label>
          <input className="inp" name="password" type="password" required style={{ marginBottom: 18 }} />
          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} type="submit">Sign in</button>
        </form>
        <p style={{ textAlign: "center", fontSize: 13, marginTop: 16, color: "var(--mut)" }}>
          New shop? <Link href="/signup" style={{ color: "var(--indigo)", fontWeight: 700 }}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}
