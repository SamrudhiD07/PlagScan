import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";
import ResultPanel from "../components/ResultPanel";

export default function ScanPage() {
  const { token } = useAuth();
  const [submitted, setSubmitted] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const subRef = useRef();

  const validate = (file) => {
    if (!file || !file.name.match(/\.(txt|pdf|doc|docx)$/i)) return "Only PDF, TXT, DOC, DOCX allowed";
    if (file.size > 10 * 1024 * 1024) return "File too large (max 10MB)";
    return null;
  };

  const pickFile = (file, setter) => {
    const err = validate(file);
    if (err) { setError(err); return; }
    setError(""); setter(file);
  };

  const steps = ["Uploading to server...", "Extracting text...", "Fetching library repository...", "Vectorizing document...", "Comparing against all records...", "Generating Top 5 report..."];

  const runScan = async () => {
    if (!submitted) { setError("Please upload a document to scan"); return; }
    setLoading(true); setResult(null); setError("");
    let step = 0;
    const iv = setInterval(() => { if (step < steps.length) setProgress(steps[step++]); }, 1000);
    try {
      const fd = new FormData();
      fd.append("submitted", submitted);
      const data = await api.upload("/plagiarism/check", fd, token);
      setResult(data);
    } catch (err) {
      setError(err.message || "Scan failed. Make sure the library is not empty.");
    } finally { clearInterval(iv); setLoading(false); setProgress(""); }
  };

  const DropZone = ({ file, setter, label, inputRef }) => (
    <div onClick={() => inputRef.current.click()}
      style={{ border:`2px dashed ${file ? "var(--accent)" : "var(--border-bright)"}`, borderRadius:16, padding:"48px 32px", cursor:"pointer",
        background:"var(--surface)", minHeight:200, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.3s", boxShadow: file ? "var(--glow)" : "none" }}>
      <input ref={inputRef} type="file" accept=".pdf,.txt,.doc,.docx"
        onChange={e => e.target.files[0] && pickFile(e.target.files[0], setter)} hidden />
      {file ? (
        <div style={{ display:"flex", alignItems:"center", gap:16, width:"100%" }}>
          <span style={{ fontSize:36, background:"var(--bg)", width:60, height:60, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:12 }}>{file.name.endsWith(".pdf") ? "📄" : "📝"}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, color:"var(--text)", fontWeight:700 }}>{file.name}</div>
            <div style={{ fontSize:12, color:"var(--text-muted)", fontWeight:500 }}>{(file.size/1024).toFixed(1)} KB</div>
          </div>
          <button onClick={e => { e.stopPropagation(); setter(null); }}
            style={{ background:"var(--surface-2)", border:"1px solid var(--border)", color:"var(--danger)", width:32, height:32, borderRadius:8, fontSize:14, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>
      ) : (
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:32, color:"var(--accent)", marginBottom:14, opacity:0.8 }}>📤</div>
          <div style={{ fontSize:15, color:"var(--text)", fontWeight:600, marginBottom:6 }}>{label}</div>
          <div style={{ fontSize:12, color:"var(--text-muted)" }}>PDF, TXT, DOC, or DOCX • Max 10MB</div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ maxWidth:900, margin:"0 auto", padding:"60px 32px 120px" }}>
      <div style={{ textAlign:"center", marginBottom:48 }}>
        <h1 style={{ fontSize:48, fontWeight:800, letterSpacing:-2, marginBottom:16, background:"linear-gradient(135deg, var(--accent) 0%, var(--accent-3) 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Library Scan</h1>
        <p style={{ color:"var(--text-muted)", fontSize:18, maxWidth:600, margin:"0 auto" }}>Upload your document to perform a deep semantic check against our entire repository of reference materials.</p>
      </div>

      <div style={{ maxWidth:600, margin:"0 auto 40px" }}>
        <DropZone file={submitted} setter={setSubmitted} label="Upload submitted document" inputRef={subRef} />
      </div>

      {error && <div style={{ maxWidth:600, margin:"0 auto 24px", background:"rgba(239,68,68,0.1)", border:"1px solid var(--danger)", color:"var(--danger)", padding:"14px 20px", borderRadius:12, fontSize:14, fontWeight:600 }}>{error}</div>}

      <div style={{ display:"flex", justifyContent:"center" }}>
        <button onClick={runScan} disabled={loading || !submitted}
          style={{ display:"flex", alignItems:"center", gap:14, padding:"18px 64px", background:"var(--accent)", color:"#fff", borderRadius:16, fontSize:18, fontWeight:740, boxShadow:"var(--glow)", minWidth:280, justifyContent:"center", transition:"all 0.2s", opacity: (!submitted) ? 0.5 : 1 }}>
          {loading ? <><span className="spinner" style={{width:20, height:20}} />{progress || "Searching Library…"}</> : <>⬡ Start Deep Scan</>}
        </button>
      </div>

      {result && <div style={{ marginTop:64 }}><ResultPanel result={result} submitted={submitted?.name} /></div>}
    </div>
  );
}