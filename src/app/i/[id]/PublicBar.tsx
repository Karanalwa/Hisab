"use client";

export default function PublicBar() {
  return (
    <div className="no-print" style={{ display: "flex", justifyContent: "center", margin: "16px 0" }}>
      <button className="btn btn-primary" onClick={() => window.print()}>🖨 Save as PDF</button>
    </div>
  );
}
