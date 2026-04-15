import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";

const pct = (v) => Math.round((v??0)*100);
const color = (s) => s>=0.8 ? "var(--danger)" : s>=0.4 ? "var(--warning)" : "var(--success)";

export default function HistoryPage() {
  const { token } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get("/plagiarism/history", token).then(d => setRecords(d.records||[])).catch(()=>{}).finally(()=>setLoading(false));
  }, [token]);

  if (loading) return <div style={{ display:"flex", alignItems:"center", gap:12, padding:60, color:"var(--text-muted)", justifyContent:"center" }}><span className="spinner" style={{width:24,height:24}} /> Loading…</div>;

  return (
    <div style={{ maxWidth:900, margin:"0 auto", padding:"40px 32px 80px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:32 }}>
        <h1 style={{ fontSize:28, fontWeight:800, letterSpacing:-0.5 }}>Scan History</h1>
        <span style={{ padding:"4px 12px", background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:20, fontSize:12, color:"var(--text-muted)" }}>{records.length} records</span>
      </div>
      {records.length === 0 ? (
        <div style={{ textAlign:"center", padding:"80px 40px", color:"var(--text-muted)" }}>
          <div style={{ fontSize:48, marginBottom:16 }}>◈</div>
          <p>No scans yet. Run your first plagiarism check!</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {records.map((r,i) => {
            const hasMatches = r.matches && r.matches.length > 0;
            const topMatch = hasMatches ? r.matches[0] : r; // Fallback to root for old records
            const sim = topMatch.cosine_similarity ?? 0;
            const title = hasMatches ? topMatch.title : r.reference_file;

            return (
              <div key={r._id||i} style={{ background:"var(--surface)", border:`1px solid var(--border)`, borderLeft:`3px solid ${color(sim)}`, borderRadius:12, overflow:"hidden" }}>
                <div onClick={() => setExpanded(expanded===r._id ? null : r._id)}
                  style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 20px", cursor:"pointer", gap:16 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"var(--text)", marginBottom:4, flexWrap:"nowrap" }}>
                      <span style={{ fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.submitted_file}</span>
                      <span style={{ color:"var(--text-dim)", fontSize:11, flexShrink:0 }}>vs</span>
                      <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{hasMatches ? `Library (${r.matches.length} matches)` : title}</span>
                    </div>
                    <div style={{ fontSize:11, color:"var(--text-dim)" }}>
                      {new Date(r.createdAt).toLocaleString()} {hasMatches && `• Top Match: ${title}`}
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
                    <span style={{ fontFamily:"var(--font-display)", fontSize:22, fontWeight:800, color:color(sim) }}>{pct(sim)}%</span>
                    <span style={{ fontSize:11 }}>{expanded===r._id ? "▴" : "▾"}</span>
                  </div>
                </div>
                {expanded===r._id && (
                  <div style={{ padding:20, borderTop:"1px solid var(--border)", background:"var(--surface-2)" }}>
                    <div style={{ display:"flex", gap:24, flexWrap:"wrap", marginBottom:12 }}>
                      {[["Cosine", sim],
                        ["Paraphrase", topMatch.paraphrase_score ?? 0],
                        ["Flagged", topMatch.flagged_count ?? 0]].map(([l,v])=>(
                        <div key={l}>
                          <div style={{ fontFamily:"var(--font-display)", fontSize:20, fontWeight:700 }}>
                            {l === "Flagged" ? v : `${pct(v)}%`}
                          </div>
                          <div style={{ fontSize:11, color:"var(--text-dim)" }}>{l}</div>
                        </div>
                      ))}
                    </div>
                    {topMatch.summary && <p style={{ fontSize:12, color:"var(--text-muted)", lineHeight:1.6, borderLeft:"2px solid var(--border)", paddingLeft:12 }}>{topMatch.summary}</p>}
                    {hasMatches && r.matches.length > 1 && (
                      <div style={{ marginTop:16, paddingTop:12, borderTop:"1px dashed var(--border)" }}>
                        <div style={{ fontSize:11, fontWeight:700, color:"var(--text-dim)", marginBottom:6, textTransform:"uppercase" }}>Other Potential Matches ({r.matches.length - 1})</div>
                        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                          {r.matches.slice(1, 4).map((m, idx) => (
                            <span key={idx} style={{ fontSize:11, background:"var(--surface)", border:"1px solid var(--border)", padding:"3px 8px", borderRadius:6 }}>
                              {m.title}: <strong>{pct(m.cosine_similarity)}%</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}