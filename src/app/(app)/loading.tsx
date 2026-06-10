export default function Loading() {
  const bar = (w: string) => (
    <div style={{ height: 14, width: w, borderRadius: 7, background: "linear-gradient(90deg,#e2e8f0,#f1f5f9,#e2e8f0)", backgroundSize: "200% 100%", animation: "hisabShimmer 1.2s infinite" }} />
  );
  return (
    <div>
      <style>{`@keyframes hisabShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ marginBottom: 24 }}>{bar("220px")}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 16, marginBottom: 24 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card" style={{ padding: 20, display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "#f1f5f9", flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>{bar("60%")}{bar("80%")}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
        {Array.from({ length: 6 }).map((_, i) => <div key={i}>{bar(`${90 - i * 8}%`)}</div>)}
      </div>
    </div>
  );
}
