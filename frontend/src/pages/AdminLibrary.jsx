import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";

export default function AdminLibrary() {
  const { token } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  const fetchLib = async () => {
    try {
      const data = await api.get("/admin/library", token);
      setDocs(data.documents || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLib(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", title || file.name);
      await api.upload("/admin/library/upload", fd, token);
      setFile(null); setTitle(""); fetchLib();
    } catch (err) { setError(err.message); }
    finally { setUploading(false); }
  };

  const deleteDoc = async (id) => {
    if (!confirm("Are you sure?")) return;
    try {
      await api.delete(`/admin/library/${id}`, token);
      fetchLib();
    } catch (e) { setError(e.message); }
  };

  if (loading) return <div style={{ padding:40 }}>Loading repository…</div>;

  return (
    <div style={{ maxWidth:1000, margin:"0 auto", padding:"40px 32px" }}>
      <h1 style={{ fontSize:28, fontWeight:800, marginBottom:8 }}>Library Repository</h1>
      <p style={{ color:"var(--text-muted)", marginBottom:32 }}>Manage documents that users scan their work against.</p>

      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:16, padding:24, marginBottom:40 }}>
        <h3 style={{ fontSize:16, fontWeight:700, marginBottom:16 }}>Add New Document</h3>
        <form onSubmit={handleUpload} style={{ display:"flex", gap:12, alignItems:"flex-end" }}>
          <div style={{ flex:1 }}>
            <label style={{ fontSize:12, color:"var(--text-muted)", display:"block", marginBottom:4 }}>DOCUMENT TITLE</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Research Paper Vol 1" style={{ width:"100%" }} />
          </div>
          <div style={{ flex:1 }}>
            <label style={{ fontSize:12, color:"var(--text-muted)", display:"block", marginBottom:4 }}>SELECT FILE</label>
            <input type="file" onChange={e => setFile(e.target.files[0])} style={{ padding:8 }} />
          </div>
          <button type="submit" disabled={uploading || !file} style={{ background:"var(--accent)", color:"#fff", padding:"10px 24px", borderRadius:8, fontWeight:600 }}>
            {uploading ? "Extracting..." : "Upload to Library"}
          </button>
        </form>
        {error && <div style={{ color:"var(--danger)", fontSize:13, marginTop:12 }}>{error}</div>}
      </div>

      <div style={{ display:"grid", gap:12 }}>
        {docs.map(d => (
          <div key={d._id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:16, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12 }}>
            <div>
              <div style={{ fontWeight:700, color:"var(--text)" }}>{d.title}</div>
              <div style={{ fontSize:12, color:"var(--text-dim)" }}>Added {new Date(d.createdAt).toLocaleDateString()} • {d.fileType}</div>
            </div>
            <button onClick={() => deleteDoc(d._id)} style={{ padding:"6px 12px", color:"var(--danger)", background:"transparent", border:"1px solid transparent" }}>Delete</button>
          </div>
        ))}
        {docs.length === 0 && <div style={{ textAlign:"center", padding:40, color:"var(--text-dim)" }}>The library is empty.</div>}
      </div>
    </div>
  );
}
