import { useState } from "react";
const pct = (v) => Math.round((v ?? 0) * 100);
const LEVEL = (s) => s >= 0.8 ? { label:"HIGH PLAGIARISM", color:"var(--danger)", bg:"rgba(239, 68, 68, 0.1)" }
  : s >= 0.4 ? { label:"MODERATE SIMILARITY", color:"var(--warning)", bg:"rgba(245, 158, 11, 0.1)" }
  : { label:"LOW SIMILARITY", color:"var(--success)", bg:"rgba(16, 185, 129, 0.1)" };

export default function ResultPanel({ result, submitted }) {
  const matches = result.matches || [];
  const [selectedIdx, setSelectedIdx] = useState(0);
  const currentMatch = matches[selectedIdx];

  if (!currentMatch) return <div style={{ padding:40, textAlign:"center", color:"var(--text-muted)" }}>No significant matches found in the library.</div>;

  const lvl = LEVEL(currentMatch.cosine_similarity);

  return (
    <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:24, padding:48, boxShadow:"var(--shadow)", transition:"all 0.3s ease" }}>
      <h2 style={{ fontSize:28, fontWeight:800, marginBottom:12, color:"var(--text)", letterSpacing:-1 }}>Library Analysis Results</h2>
      <p style={{ color:"var(--text-muted)", marginBottom:24, fontSize:14 }}>Showing Top {matches.length} matches found for <strong>{submitted}</strong></p>

      {/* Match Selector */}
      <div style={{ display:"flex", gap:10, marginBottom:40, overflowX:"auto", paddingBottom:12 }}>
        {matches.map((m, i) => (
          <button key={i} onClick={() => setSelectedIdx(i)}
            style={{ 
              padding:"12px 20px", borderRadius:12, flexShrink:0, border:"1px solid var(--border)",
              background: selectedIdx === i ? "var(--bg)" : "transparent",
              color: selectedIdx === i ? "var(--accent)" : "var(--text-dim)",
              fontWeight: 700, transition: "all 0.2s"
            }}>
            <div style={{ fontSize:10, textTransform:"uppercase", opacity:0.7 }}>Match #{i+1}</div>
            <div style={{ fontSize:13 }}>{pct(m.cosine_similarity)}% - {m.title.slice(0, 20)}...</div>
          </button>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:24, marginBottom:48 }}>
        <div style={{ textAlign:"center", padding:30, background:"var(--bg)", borderRadius:20, border:"1px solid var(--border)" }}>
          <div style={{ fontSize:11, color:"var(--text-muted)", fontWeight:800, marginBottom:8, textTransform:"uppercase" }}>Similarity VS {currentMatch.title}</div>
          <div style={{ fontFamily:"var(--font-display)", fontSize:72, fontWeight:800, color:lvl.color, lineHeight:1 }}>{pct(currentMatch.cosine_similarity)}%</div>
          <div style={{ padding:"6px 16px", background:lvl.bg, color:lvl.color, borderRadius:8, fontSize:12, fontWeight:700, letterSpacing:1, marginTop:16, display:"inline-block" }}>{lvl.label}</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:16, justifyContent:"center" }}>
          {[["Cosine Similarity", pct(currentMatch.cosine_similarity), "var(--accent)"],
            ["Paraphrase Score", pct(currentMatch.paraphrase_score), "var(--accent-2)"]].map(([label, val, color]) => (
            <div key={label} style={{ display:"flex", alignItems:"center", gap:16, background:"var(--bg)", border:"1px solid var(--border)", borderRadius:16, padding:"12px 20px" }}>
              <div style={{ width:60, height:60, borderRadius:12, background:color, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:800 }}>{val}%</div>
              <div style={{ fontSize:15, color:"var(--text)", fontWeight:700 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {currentMatch.summary && (
        <div style={{ display:"flex", gap:16, background:"rgba(13,148,136,0.06)", border:"1px solid rgba(13,148,136,0.15)", borderRadius:16, padding:"20px 24px", marginBottom:48, color:"var(--text-muted)", fontSize:15, lineHeight:1.7, borderLeft:"4px solid var(--accent)" }}>
          <span style={{ color:"var(--accent)", fontSize:20 }}>✦</span> {currentMatch.summary}
        </div>
      )}

      {currentMatch.plagiarized_sentences.length > 0 ? (
        <div>
          <h3 style={{ fontSize:20, fontWeight:800, marginBottom:24, display:"flex", alignItems:"center", gap:12, color:"var(--text)" }}>
            Sentence-Level Analysis
            <span style={{ background:lvl.bg, color:lvl.color, border:`1px solid ${lvl.color}33`, fontSize:12, padding:"2px 12px", borderRadius:20 }}>{currentMatch.flagged_count} flagged segments</span>
          </h3>
          <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
            {currentMatch.plagiarized_sentences.map((item, i) => {
              const sl = LEVEL(item.similarity);
              return (
                <div key={i} style={{ border:"1px solid var(--border)", borderRadius:18, overflow:"hidden", background:"var(--bg)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 20px", background:"var(--surface-2)", borderBottom:"1px solid var(--border)" }}>
                    <span style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)" }}>SEGMENT #{i+1}</span>
                    <span style={{ fontSize:11, fontWeight:800, padding:"3px 10px", borderRadius:6, background:sl.bg, color:sl.color, border:`1px solid ${sl.color}22` }}>{pct(item.similarity)}% MATCH</span>
                    {item.is_paraphrase && <span style={{ fontSize:11, fontWeight:800, padding:"3px 10px", borderRadius:6, background:"rgba(219,39,119,0.1)", color:"var(--accent-2)", border:"1px solid rgba(219,39,119,0.2)" }}>⚠ PARAPHRASE</span>}
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))" }}>
                    <div style={{ padding:20, borderRight:"1px solid var(--border)" }}>
                      <div style={{ fontSize:11, fontWeight:800, letterSpacing:1, color:"var(--text-dim)", marginBottom:10 }}>SUBMITTED SOURCE</div>
                      <p style={{ fontSize:14, color:"var(--text)", lineHeight:1.6, fontWeight:500 }}>{item.submitted_sentence}</p>
                    </div>
                    <div style={{ padding:20 }}>
                      <div style={{ fontSize:11, fontWeight:800, letterSpacing:1, color:"var(--text-dim)", marginBottom:10 }}>LIBRARY SOURCE ({currentMatch.title})</div>
                      <p style={{ fontSize:14, color:"var(--text-muted)", lineHeight:1.6 }}>{item.reference_sentence}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ display:"flex", alignItems:"center", gap:12, background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.2)", color:"var(--success)", padding:"24px", borderRadius:16, fontSize:15, fontWeight:600 }}>
          <span style={{ fontSize:20 }}>✓</span> No significantly similar segments detected in this library document.
        </div>
      )}
    </div>
  );
}