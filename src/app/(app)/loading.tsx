export default function Loading() {
  const bar = (w: string) => (
    <div style={{ height: 14, width: w, borderRadius: 7, background: "linear-gradient(90deg,#e7e8f6,#f4f5fd,#e7e8f6)", backgroundSize: "200% 100%", animation: "hisabShimmer 1.2s infinite" }} />
  );
  return (
    <div>
      <style>{`@keyframes hisabShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ marginBottom: 20 }}>{bar("220px")}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(205px,1fr))", gap: 16, marginBottom: 22 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card" style={{ padding: 18, display: "flex", gap: 15, alignItems: "center" }}>
            <div style={{ width: 54, height: 54, borderRadius: 15, background: "#eef0fb" }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>{bar("60%")}{bar("80%")}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
        {Array.from({ length: 6 }).map((_, i) => <div key={i}>{bar(`${90 - i * 8}%`)}</div>)}
      </div>
    </div>
  );
}
